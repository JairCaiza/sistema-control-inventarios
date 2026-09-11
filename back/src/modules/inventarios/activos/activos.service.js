const { pool } = require("../../../config/db");

/* =====================================================
   ERRORES
===================================================== */

const crearError = (
    mensaje,
    statusCode = 400
) => {
    const error = new Error(mensaje);

    error.statusCode = statusCode;

    return error;
};

/* =====================================================
   PREFIJO SEGÚN CATEGORÍA
===================================================== */

const obtenerPrefijoCategoria = (
    tipo
) => {
    const tipoNormalizado =
        String(tipo || "")
            .trim()
            .toLowerCase();

    const prefijos = {
        equipo: "EQ",
        herramienta: "HR",
        encofrado: "EN",
        material: "MT",
        consumible: "CO",
        otro: "OT"
    };

    return (
        prefijos[tipoNormalizado] ||
        "AC"
    );
};

/* =====================================================
   GENERAR CÓDIGO
===================================================== */

const generarCodigoActivo = async (
    categoriaId,
    client = pool
) => {
    const categoria =
        await client.query(
            `
            SELECT
                id,
                nombre,
                tipo

            FROM categorias

            WHERE id = $1
              AND activo = TRUE
            `,
            [
                categoriaId
            ]
        );

    if (
        categoria.rows.length === 0
    ) {
        throw crearError(
            "La categoría no existe o se encuentra inactiva",
            404
        );
    }

    const prefijo =
        obtenerPrefijoCategoria(
            categoria.rows[0].tipo
        );

    /*
     * Evita que dos registros simultáneos
     * generen el mismo código.
     */
    await client.query(
        `
        SELECT pg_advisory_xact_lock(
            hashtext($1)
        )
        `,
        [
            `codigo-activo-${prefijo}`
        ]
    );

    const ultimo =
        await client.query(
            `
            SELECT
                codigo

            FROM activos

            WHERE codigo LIKE $1

            ORDER BY
                CAST(
                    SPLIT_PART(
                        codigo,
                        '-',
                        2
                    )
                    AS INTEGER
                ) DESC

            LIMIT 1
            `,
            [
                `${prefijo}-%`
            ]
        );

    let numero = 1;

    if (
        ultimo.rows.length > 0
    ) {
        const ultimoCodigo =
            ultimo.rows[0].codigo;

        const numeroActual =
            Number(
                ultimoCodigo.split(
                    "-"
                )[1]
            );

        if (
            Number.isFinite(
                numeroActual
            )
        ) {
            numero =
                numeroActual + 1;
        }
    }

    return `${prefijo}-${String(
        numero
    ).padStart(
        4,
        "0"
    )}`;
};

/* =====================================================
   NORMALIZAR ACTIVO
===================================================== */

const normalizarActivo = (
    activo
) => {
    if (!activo) {
        return null;
    }

    return {
        ...activo,

        cantidad_total:
            Number(
                activo.cantidad_total ||
                0
            ),

        cantidad_disponible:
            Number(
                activo.cantidad_disponible ||
                0
            ),

        cantidad_alquilada:
            Number(
                activo.cantidad_alquilada ||
                0
            ),

        cantidad_mantenimiento:
            Number(
                activo.cantidad_mantenimiento ||
                0
            ),

        cantidad_danada:
            Number(
                activo.cantidad_danada ||
                0
            ),

        cantidad_perdida:
            Number(
                activo.cantidad_perdida ||
                0
            ),

        cantidad_dado_baja:
            Number(
                activo.cantidad_dado_baja ||
                0
            ),

        valor_reposicion:
            activo.valor_reposicion !==
                null &&
                activo.valor_reposicion !==
                undefined
                ? Number(
                    activo.valor_reposicion
                )
                : null
    };
};

/* =====================================================
   INSERTAR ACTIVO BASE
===================================================== */

/*
 * Durante la migración conservamos:
 *
 * ubicacion_id
 * estado
 * cantidad_total
 *
 * dentro de activos porque otros módulos
 * todavía dependen de esas columnas.
 *
 * Después se eliminarán.
 */
const insertarActivoBase = async (
    client,
    data,
    codigo,
    cantidadLegacy
) => {
    const resultado =
        await client.query(
            `
            INSERT INTO activos
            (
                codigo,
                nombre,
                descripcion,
                categoria_id,

                ubicacion_id,
                estado,
                cantidad_total,

                tipo_control,
                valor_reposicion,

                marca,
                color,
                responsable,
                observaciones,

                activo,

                fecha_actualizacion
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,

                $5,
                $6,
                $7,

                $8,
                $9,

                $10,
                $11,
                $12,
                $13,

                TRUE,

                NOW()
            )
            RETURNING *
            `,
            [
                codigo,

                data.nombre.trim(),

                data.descripcion
                    ? data.descripcion.trim()
                    : null,

                data.categoria_id,

                data.ubicacion_id,

                data.estado ||
                "disponible",

                cantidadLegacy,

                data.tipo_control,

                data.valor_reposicion ??
                null,

                data.marca
                    ? data.marca.trim()
                    : null,

                data.color
                    ? data.color.trim()
                    : null,

                data.responsable
                    ? data.responsable.trim()
                    : null,

                data.observaciones
                    ? data.observaciones.trim()
                    : null
            ]
        );

    return resultado.rows[0];
};

/* =====================================================
   CREAR EXISTENCIA INICIAL
===================================================== */

const crearExistenciaInicial =
    async (
        client,
        activoId,
        ubicacionId,
        estado,
        cantidad
    ) => {
        const resultado =
            await client.query(
                `
                INSERT INTO existencias_activos
                (
                    activo_id,
                    ubicacion_id,
                    estado,
                    cantidad
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING *
                `,
                [
                    activoId,
                    ubicacionId,
                    estado,
                    cantidad
                ]
            );

        return resultado.rows[0];
    };

/* =====================================================
   CREAR MOVIMIENTO INICIAL
===================================================== */

const crearMovimientoInicial =
    async (
        client,
        activoId,
        ubicacionId,
        estado,
        cantidad
    ) => {
        await client.query(
            `
            INSERT INTO movimientos_inventario
            (
                activo_id,
                tipo_movimiento,
                cantidad,

                ubicacion_destino_id,

                estado_destino,

                motivo,

                origen_modulo
            )
            VALUES
            (
                $1,
                'entrada',
                $2,

                $3,

                $4,

                'Registro inicial del activo',

                'inventario'
            )
            `,
            [
                activoId,
                cantidad,
                ubicacionId,
                estado
            ]
        );
    };

/* =====================================================
   CREAR ACTIVO
===================================================== */

/*
 * CASO 1
 *
 * tipo_control = unidad
 * cantidad_total = 5
 *
 * NO crea un activo con cantidad 5.
 *
 * Crea:
 *
 * HR-0001 -> 1
 * HR-0002 -> 1
 * HR-0003 -> 1
 * HR-0004 -> 1
 * HR-0005 -> 1
 *
 *
 * CASO 2
 *
 * tipo_control = cantidad
 * cantidad_total = 200
 *
 * Crea un solo activo y una existencia
 * con cantidad 200.
 */
const crearActivo = async (
    data
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        /*
         * Validar ubicación.
         */
        const ubicacion =
            await client.query(
                `
                SELECT id

                FROM ubicaciones

                WHERE id = $1
                `,
                [
                    data.ubicacion_id
                ]
            );

        if (
            ubicacion.rows.length === 0
        ) {
            throw crearError(
                "La ubicación seleccionada no existe",
                404
            );
        }

        const cantidad =
            Number(
                data.cantidad_total
            );

        if (
            !Number.isInteger(
                cantidad
            ) ||
            cantidad <= 0
        ) {
            throw crearError(
                "La cantidad debe ser mayor que cero",
                400
            );
        }

        const estadoInicial =
            data.estado ||
            "disponible";

        const activosCreados =
            [];

        /* =================================================
           CONTROL INDIVIDUAL
        ================================================= */

        if (
            data.tipo_control ===
            "unidad"
        ) {
            for (
                let i = 0;
                i < cantidad;
                i++
            ) {
                const codigo =
                    await generarCodigoActivo(
                        data.categoria_id,
                        client
                    );

                const activo =
                    await insertarActivoBase(
                        client,
                        data,
                        codigo,

                        /*
                         * Compatibilidad temporal:
                         * cada activo individual = 1
                         */
                        1
                    );

                await crearExistenciaInicial(
                    client,
                    activo.id,
                    data.ubicacion_id,
                    estadoInicial,
                    1
                );

                await crearMovimientoInicial(
                    client,
                    activo.id,
                    data.ubicacion_id,
                    estadoInicial,
                    1
                );

                activosCreados.push(
                    activo
                );
            }
        }

        /* =================================================
           CONTROL POR CANTIDAD
        ================================================= */

        else if (
            data.tipo_control ===
            "cantidad"
        ) {
            const codigo =
                await generarCodigoActivo(
                    data.categoria_id,
                    client
                );

            const activo =
                await insertarActivoBase(
                    client,
                    data,
                    codigo,
                    cantidad
                );

            await crearExistenciaInicial(
                client,
                activo.id,
                data.ubicacion_id,
                estadoInicial,
                cantidad
            );

            await crearMovimientoInicial(
                client,
                activo.id,
                data.ubicacion_id,
                estadoInicial,
                cantidad
            );

            activosCreados.push(
                activo
            );
        } else {
            throw crearError(
                "El tipo de control no es válido",
                400
            );
        }

        await client.query(
            "COMMIT"
        );

        return {
            tipo_control:
                data.tipo_control,

            cantidad_creada:
                activosCreados.length,

            unidades_fisicas:
                data.tipo_control ===
                    "unidad"
                    ? activosCreados.length
                    : cantidad,

            activos:
                activosCreados
        };
    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   LISTAR ACTIVOS
===================================================== */

const listarActivos = async () => {
    const resultado =
        await pool.query(
            `
            SELECT
                a.id,
                a.codigo,
                a.nombre,
                a.descripcion,

                a.categoria_id,

                c.nombre
                    AS categoria,

                c.tipo
                    AS categoria_tipo,

                a.tipo_control,

                a.valor_reposicion,

                a.marca,
                a.color,
                a.responsable,
                a.observaciones,

                a.activo,

                a.fecha_creacion,
                a.fecha_actualizacion,

                /* ==============================
                   EXISTENCIA TOTAL
                ============================== */

                COALESCE(
                    SUM(ea.cantidad),
                    0
                )::INTEGER
                    AS cantidad_total,

                /* ==============================
                   DISPONIBLE
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'disponible'
                    ),
                    0
                )::INTEGER
                    AS cantidad_disponible,

                /* ==============================
                   ALQUILADO
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'alquilado'
                    ),
                    0
                )::INTEGER
                    AS cantidad_alquilada,

                /* ==============================
                   MANTENIMIENTO
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'mantenimiento'
                    ),
                    0
                )::INTEGER
                    AS cantidad_mantenimiento,

                /* ==============================
                   DAÑADO
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'danado'
                    ),
                    0
                )::INTEGER
                    AS cantidad_danada,

                /* ==============================
                   PERDIDO
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'perdido'
                    ),
                    0
                )::INTEGER
                    AS cantidad_perdida,

                /* ==============================
                   DADO DE BAJA
                ============================== */

                COALESCE(
                    SUM(
                        ea.cantidad
                    ) FILTER (
                        WHERE
                            ea.estado =
                            'dado_baja'
                    ),
                    0
                )::INTEGER
                    AS cantidad_dado_baja,

                /*
                 * Para activos individuales,
                 * el estado se obtiene de su
                 * existencia.
                 *
                 * Para control por cantidad
                 * puede existir más de un estado.
                 */
                CASE

                    WHEN
                        a.tipo_control =
                        'unidad'
                    THEN
                        MAX(ea.estado)

                    WHEN
                        COUNT(
                            DISTINCT
                            CASE
                                WHEN ea.cantidad > 0
                                THEN ea.estado
                            END
                        ) = 1
                    THEN
                        MAX(
                            CASE
                                WHEN ea.cantidad > 0
                                THEN ea.estado
                            END
                        )

                    ELSE
                        'mixto'

                END AS estado,

                /*
                 * Ubicación simplificada para
                 * mantener compatibilidad con
                 * el frontend actual.
                 */
                STRING_AGG(
                    DISTINCT
                    CASE
                        WHEN ea.cantidad > 0
                        THEN u.nombre
                    END,
                    ', '
                ) AS ubicacion,

                /* ==============================
                   DETALLE COMPLETO
                ============================== */

                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id',
                                ea.id,

                            'ubicacion_id',
                                ea.ubicacion_id,

                            'ubicacion',
                                u.nombre,

                            'estado',
                                ea.estado,

                            'cantidad',
                                ea.cantidad
                        )
                        ORDER BY
                            u.nombre,
                            ea.estado
                    )
                    FILTER (
                        WHERE
                            ea.id IS NOT NULL
                    ),
                    '[]'::JSON
                ) AS existencias

            FROM activos a

            INNER JOIN categorias c
                ON c.id =
                   a.categoria_id

            LEFT JOIN existencias_activos ea
                ON ea.activo_id =
                   a.id

            LEFT JOIN ubicaciones u
                ON u.id =
                   ea.ubicacion_id

            GROUP BY
                a.id,
                c.id,
                c.nombre,
                c.tipo

            ORDER BY
                a.fecha_creacion DESC,
                a.codigo ASC
            `
        );

    return resultado.rows.map(
        normalizarActivo
    );
};

/* =====================================================
   OBTENER ACTIVO POR ID
===================================================== */

const obtenerActivoPorId =
    async (
        id
    ) => {
        const resultado =
            await pool.query(
                `
                SELECT
                    a.*,

                    c.nombre
                        AS categoria,

                    c.tipo
                        AS categoria_tipo,

                    COALESCE(
                        (
                            SELECT
                                SUM(
                                    ea.cantidad
                                )
                            FROM
                                existencias_activos ea
                            WHERE
                                ea.activo_id =
                                a.id
                        ),
                        0
                    )::INTEGER
                        AS cantidad_total,

                    COALESCE(
                        (
                            SELECT
                                SUM(
                                    ea.cantidad
                                )
                            FROM
                                existencias_activos ea
                            WHERE
                                ea.activo_id =
                                a.id

                              AND
                                ea.estado =
                                'disponible'
                        ),
                        0
                    )::INTEGER
                        AS cantidad_disponible,

                    COALESCE(
                        (
                            SELECT
                                JSON_AGG(
                                    JSON_BUILD_OBJECT(
                                        'id',
                                            ea.id,

                                        'ubicacion_id',
                                            ea.ubicacion_id,

                                        'ubicacion',
                                            u.nombre,

                                        'estado',
                                            ea.estado,

                                        'cantidad',
                                            ea.cantidad
                                    )
                                    ORDER BY
                                        u.nombre,
                                        ea.estado
                                )

                            FROM
                                existencias_activos ea

                            INNER JOIN
                                ubicaciones u
                                ON u.id =
                                   ea.ubicacion_id

                            WHERE
                                ea.activo_id =
                                a.id
                        ),
                        '[]'::JSON
                    ) AS existencias

                FROM activos a

                INNER JOIN categorias c
                    ON c.id =
                       a.categoria_id

                WHERE a.id = $1
                `,
                [
                    id
                ]
            );

        if (
            resultado.rows.length === 0
        ) {
            return null;
        }

        return normalizarActivo(
            resultado.rows[0]
        );
    };

/* =====================================================
   ACTUALIZAR INFORMACIÓN DEL ACTIVO
===================================================== */

const actualizarActivo =
    async (
        id,
        data
    ) => {
        const campos = [];

        const valores = [];

        const agregarCampo = (
            columna,
            valor
        ) => {
            valores.push(
                valor
            );

            campos.push(
                `${columna} = $${valores.length}`
            );
        };

        if (
            data.nombre !==
            undefined
        ) {
            agregarCampo(
                "nombre",
                data.nombre.trim()
            );
        }

        if (
            data.descripcion !==
            undefined
        ) {
            agregarCampo(
                "descripcion",
                data.descripcion
                    ? data.descripcion.trim()
                    : null
            );
        }

        if (
            data.categoria_id !==
            undefined
        ) {
            agregarCampo(
                "categoria_id",
                data.categoria_id
            );
        }

        if (
            data.valor_reposicion !==
            undefined
        ) {
            agregarCampo(
                "valor_reposicion",
                data.valor_reposicion
            );
        }

        if (
            data.marca !==
            undefined
        ) {
            agregarCampo(
                "marca",
                data.marca
                    ? data.marca.trim()
                    : null
            );
        }

        if (
            data.color !==
            undefined
        ) {
            agregarCampo(
                "color",
                data.color
                    ? data.color.trim()
                    : null
            );
        }

        if (
            data.responsable !==
            undefined
        ) {
            agregarCampo(
                "responsable",
                data.responsable
                    ? data.responsable.trim()
                    : null
            );
        }

        if (
            data.observaciones !==
            undefined
        ) {
            agregarCampo(
                "observaciones",
                data.observaciones
                    ? data.observaciones.trim()
                    : null
            );
        }

        if (
            data.activo !==
            undefined
        ) {
            agregarCampo(
                "activo",
                data.activo
            );
        }

        if (
            campos.length === 0
        ) {
            throw crearError(
                "No existen datos para actualizar",
                400
            );
        }

        campos.push(
            "fecha_actualizacion = NOW()"
        );

        valores.push(
            id
        );

        const resultado =
            await pool.query(
                `
                UPDATE activos

                SET
                    ${campos.join(
                    ", "
                )}

                WHERE id =
                    $${valores.length}

                RETURNING *
                `,
                valores
            );

        if (
            resultado.rows.length === 0
        ) {
            throw crearError(
                "El activo no existe",
                404
            );
        }

        return await obtenerActivoPorId(
            id
        );
    };

/* =====================================================
   CAMBIAR ESTADO DE EXISTENCIA
===================================================== */

/*
 * Ejemplo:
 *
 * disponible 17
 *
 * mover 1 a mantenimiento
 *
 * RESULTADO:
 *
 * disponible    16
 * mantenimiento  1
 *
 *
 * Si es control individual:
 *
 * disponible 1
 *
 * ->
 *
 * mantenimiento 1
 */
const cambiarEstadoActivo =
    async (
        activoId,
        data
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            /* =================================================
               ACTIVO
            ================================================= */

            const activoRes =
                await client.query(
                    `
                    SELECT
                        *

                    FROM activos

                    WHERE id = $1

                    FOR UPDATE
                    `,
                    [
                        activoId
                    ]
                );

            if (
                activoRes.rows.length === 0
            ) {
                throw crearError(
                    "El activo no existe",
                    404
                );
            }

            const activo =
                activoRes.rows[0];

            const cantidad =
                Number(
                    data.cantidad
                );

            if (
                activo.tipo_control ===
                "unidad" &&
                cantidad !== 1
            ) {
                throw crearError(
                    "Un activo individual solo puede cambiar una unidad de estado",
                    400
                );
            }

            /* =================================================
               EXISTENCIA ORIGEN
            ================================================= */

            const origenRes =
                await client.query(
                    `
                    SELECT
                        *

                    FROM existencias_activos

                    WHERE
                        activo_id = $1
                        AND ubicacion_id = $2
                        AND estado = $3

                    FOR UPDATE
                    `,
                    [
                        activoId,
                        data.ubicacion_id,
                        data.estado_origen
                    ]
                );

            if (
                origenRes.rows.length === 0
            ) {
                throw crearError(
                    "No existe stock del activo en el estado y ubicación seleccionados",
                    404
                );
            }

            const existenciaOrigen =
                origenRes.rows[0];

            const cantidadDisponibleOrigen =
                Number(
                    existenciaOrigen.cantidad
                );

            if (
                cantidadDisponibleOrigen <
                cantidad
            ) {
                throw crearError(
                    `Cantidad insuficiente. Solo existen ${cantidadDisponibleOrigen} unidades en estado ${data.estado_origen}.`,
                    400
                );
            }

            /* =================================================
               RESTAR ORIGEN
            ================================================= */

            await client.query(
                `
                UPDATE existencias_activos

                SET
                    cantidad =
                        cantidad - $1,

                    fecha_actualizacion =
                        NOW()

                WHERE id = $2
                `,
                [
                    cantidad,
                    existenciaOrigen.id
                ]
            );

            /* =================================================
               SUMAR DESTINO
            ================================================= */

            await client.query(
                `
                INSERT INTO existencias_activos
                (
                    activo_id,
                    ubicacion_id,
                    estado,
                    cantidad
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )

                ON CONFLICT
                (
                    activo_id,
                    ubicacion_id,
                    estado
                )

                DO UPDATE

                SET
                    cantidad =
                        existencias_activos.cantidad
                        +
                        EXCLUDED.cantidad,

                    fecha_actualizacion =
                        NOW()
                `,
                [
                    activoId,
                    data.ubicacion_id,
                    data.estado_destino,
                    cantidad
                ]
            );

            /* =================================================
               MOVIMIENTO
            ================================================= */

            await client.query(
                `
                INSERT INTO movimientos_inventario
                (
                    activo_id,
                    tipo_movimiento,
                    cantidad,

                    ubicacion_origen_id,
                    ubicacion_destino_id,

                    estado_origen,
                    estado_destino,

                    motivo,

                    origen_modulo
                )
                VALUES
                (
                    $1,
                    'cambio_estado',
                    $2,

                    $3,
                    $3,

                    $4,
                    $5,

                    $6,

                    'inventario'
                )
                `,
                [
                    activoId,

                    cantidad,

                    data.ubicacion_id,

                    data.estado_origen,

                    data.estado_destino,

                    data.motivo
                        ? data.motivo.trim()
                        : null
                ]
            );

            /* =================================================
               COMPATIBILIDAD TEMPORAL
            ================================================= */

            /*
             * cantidad_total antigua se mantiene
             * temporalmente como CANTIDAD DISPONIBLE,
             * porque contratos todavía podría depender
             * de ella.
             */
            const disponibleRes =
                await client.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(cantidad),
                            0
                        )::INTEGER
                            AS disponible

                    FROM existencias_activos

                    WHERE
                        activo_id = $1
                        AND estado =
                            'disponible'
                    `,
                    [
                        activoId
                    ]
                );

            const cantidadDisponible =
                Number(
                    disponibleRes.rows[0]
                        .disponible ||
                    0
                );

            if (
                activo.tipo_control ===
                "unidad"
            ) {
                await client.query(
                    `
                    UPDATE activos

                    SET
                        estado = $1,

                        ubicacion_id = $2,

                        cantidad_total = $3,

                        fecha_actualizacion =
                            NOW()

                    WHERE id = $4
                    `,
                    [
                        data.estado_destino,

                        data.ubicacion_id,

                        cantidadDisponible,

                        activoId
                    ]
                );
            } else {
                /*
                 * Para control por cantidad no existe
                 * un único estado real.
                 *
                 * Solo sincronizamos temporalmente
                 * cantidad_total disponible.
                 */
                await client.query(
                    `
                    UPDATE activos

                    SET
                        cantidad_total = $1,

                        fecha_actualizacion =
                            NOW()

                    WHERE id = $2
                    `,
                    [
                        cantidadDisponible,

                        activoId
                    ]
                );
            }

            await client.query(
                "COMMIT"
            );

            return await obtenerActivoPorId(
                activoId
            );
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            throw error;
        } finally {
            client.release();
        }
    };

/* =====================================================
   REPORTE INVENTARIO
===================================================== */

const obtenerReporteInventario =
    async () => {
        const resultado =
            await pool.query(
                `
                SELECT

                    a.codigo,

                    a.nombre
                        AS activo,

                    c.nombre
                        AS categoria,

                    a.tipo_control,

                    COALESCE(
                        SUM(ea.cantidad),
                        0
                    )::INTEGER
                        AS stock_total,

                    COALESCE(
                        SUM(
                            ea.cantidad
                        ) FILTER (
                            WHERE
                                ea.estado =
                                'disponible'
                        ),
                        0
                    )::INTEGER
                        AS disponible,

                    COALESCE(
                        SUM(
                            ea.cantidad
                        ) FILTER (
                            WHERE
                                ea.estado =
                                'alquilado'
                        ),
                        0
                    )::INTEGER
                        AS alquilado,

                    COALESCE(
                        SUM(
                            ea.cantidad
                        ) FILTER (
                            WHERE
                                ea.estado =
                                'mantenimiento'
                        ),
                        0
                    )::INTEGER
                        AS mantenimiento,

                    COALESCE(
                        SUM(
                            ea.cantidad
                        ) FILTER (
                            WHERE
                                ea.estado =
                                'danado'
                        ),
                        0
                    )::INTEGER
                        AS danado,

                    COALESCE(
                        SUM(
                            ea.cantidad
                        ) FILTER (
                            WHERE
                                ea.estado =
                                'perdido'
                        ),
                        0
                    )::INTEGER
                        AS perdido,

                    STRING_AGG(
                        DISTINCT
                        CASE
                            WHEN
                                ea.cantidad > 0
                            THEN
                                u.nombre
                        END,
                        ', '
                    ) AS ubicacion

                FROM activos a

                INNER JOIN categorias c
                    ON c.id =
                       a.categoria_id

                LEFT JOIN existencias_activos ea
                    ON ea.activo_id =
                       a.id

                LEFT JOIN ubicaciones u
                    ON u.id =
                       ea.ubicacion_id

                GROUP BY
                    a.id,
                    c.id,
                    c.nombre

                ORDER BY
                    a.nombre ASC,
                    a.codigo ASC
                `
            );

        return resultado.rows.map(
            (item) => ({
                ...item,

                stock_total:
                    Number(
                        item.stock_total ||
                        0
                    ),

                disponible:
                    Number(
                        item.disponible ||
                        0
                    ),

                alquilado:
                    Number(
                        item.alquilado ||
                        0
                    ),

                mantenimiento:
                    Number(
                        item.mantenimiento ||
                        0
                    ),

                danado:
                    Number(
                        item.danado ||
                        0
                    ),

                perdido:
                    Number(
                        item.perdido ||
                        0
                    )
            })
        );
    };

/* =====================================================
ELIMINAR ACTIVO
===================================================== */

/*
 * Un activo solamente puede eliminarse físicamente
 * cuando todavía no ha participado en operaciones
 * reales del sistema.
 *
 * Se permite únicamente el movimiento automático
 * creado al registrar inicialmente el activo.
 *
 * Si existen contratos, movimientos posteriores
 * u operaciones relacionadas, NO se elimina.
 *
 * En ese caso deberá desactivarse mediante:
 *
 * activo = false
 */
const eliminarActivo = async (
    id
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        /* =================================================
           VERIFICAR ACTIVO
        ================================================= */

        const activoRes =
            await client.query(
                `
                SELECT
                    id,
                    codigo,
                    nombre,
                    activo

                FROM activos

                WHERE id = $1

                FOR UPDATE
                `,
                [
                    id
                ]
            );

        if (
            activoRes.rows.length === 0
        ) {
            throw crearError(
                "El activo no existe",
                404
            );
        }

        const activo =
            activoRes.rows[0];

        /* =================================================
           VERIFICAR CONTRATOS
        ================================================= */

        const contratosRes =
            await client.query(
                `
                SELECT
                    COUNT(*)::INTEGER
                        AS total

                FROM detalles_contrato

                WHERE activo_id = $1
                `,
                [
                    id
                ]
            );

        const totalContratos =
            Number(
                contratosRes.rows[0]
                    .total ||
                0
            );

        if (
            totalContratos > 0
        ) {
            throw crearError(
                "No se puede eliminar el activo porque tiene contratos relacionados. Puede desactivarlo para conservar el historial.",
                409
            );
        }

        /* =================================================
           VERIFICAR MOVIMIENTOS REALES
        ================================================= */

        /*
         * Ignoramos únicamente el movimiento
         * automático generado al crear el activo:
         *
         * tipo_movimiento = entrada
         * origen_modulo = inventario
         * motivo = Registro inicial del activo
         */
        const movimientosRes =
            await client.query(
                `
                SELECT
                    COUNT(*)::INTEGER
                        AS total

                FROM movimientos_inventario

                WHERE activo_id = $1

                  AND NOT (
                      tipo_movimiento = 'entrada'

                      AND origen_modulo = 'inventario'

                      AND motivo =
                          'Registro inicial del activo'
                  )
                `,
                [
                    id
                ]
            );

        const totalMovimientos =
            Number(
                movimientosRes.rows[0]
                    .total ||
                0
            );

        if (
            totalMovimientos > 0
        ) {
            throw crearError(
                "No se puede eliminar el activo porque ya tiene movimientos de inventario. Puede desactivarlo para conservar la trazabilidad.",
                409
            );
        }

        /* =================================================
           ELIMINAR MOVIMIENTO INICIAL
        ================================================= */

        await client.query(
            `
            DELETE FROM movimientos_inventario

            WHERE activo_id = $1

              AND tipo_movimiento =
                  'entrada'

              AND origen_modulo =
                  'inventario'

              AND motivo =
                  'Registro inicial del activo'
            `,
            [
                id
            ]
        );

        /* =================================================
           ELIMINAR ACTIVO
        ================================================= */

        /*
         * existencias_activos tiene:
         *
         * ON DELETE CASCADE
         *
         * por lo tanto sus existencias se eliminarán
         * automáticamente.
         */
        const eliminadoRes =
            await client.query(
                `
                DELETE FROM activos

                WHERE id = $1

                RETURNING
                    id,
                    codigo,
                    nombre
                `,
                [
                    id
                ]
            );

        await client.query(
            "COMMIT"
        );

        return eliminadoRes.rows[0];

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();
    }
};
/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    generarCodigoActivo,

    crearActivo,

    listarActivos,

    obtenerActivoPorId,

    actualizarActivo,

    cambiarEstadoActivo,
    eliminarActivo,

    obtenerReporteInventario
};