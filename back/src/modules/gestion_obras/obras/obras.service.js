const { pool } = require("../../../config/db");

/* =====================================================
   ERROR PERSONALIZADO
===================================================== */

const crearError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};

/* =====================================================
   HELPERS
===================================================== */

const normalizarTexto = (
    value
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const texto =
        String(value).trim();

    return texto === ""
        ? null
        : texto;
};

const normalizarFecha = (
    value
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return value;
};

const normalizarNumero = (
    value,
    valorDefault = null
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return valorDefault;
    }

    const numero =
        Number(value);

    return Number.isFinite(numero)
        ? numero
        : valorDefault;
};

/* =====================================================
   VALIDAR RANGO DE FECHAS
===================================================== */

const validarFechas = (
    fechaInicio,
    fechaFin
) => {
    if (
        !fechaInicio ||
        !fechaFin
    ) {
        return;
    }

    const inicio =
        new Date(fechaInicio);

    const fin =
        new Date(fechaFin);

    if (
        fin < inicio
    ) {
        throw crearError(
            "La fecha de finalización no puede ser anterior a la fecha de inicio",
            400
        );
    }
};

/* =====================================================
   OBTENER OBRA SIMPLE
===================================================== */

const obtenerObraSimple = async (
    db,
    obraId
) => {
    const result =
        await db.query(
            `
            SELECT
                id,
                codigo,
                nombre,
                cliente_id,
                ubicacion,
                fecha_inicio,
                fecha_fin,
                presupuesto,
                estado,
                descripcion
            FROM obras
            WHERE id = $1
            LIMIT 1
            `,
            [
                obraId
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "Obra no encontrada",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR CLIENTE
===================================================== */

const validarCliente = async (
    db,
    clienteId
) => {
    if (!clienteId) {
        return null;
    }

    const result =
        await db.query(
            `
            SELECT
                id,
                nombre,
                apellido
            FROM clientes
            WHERE id = $1
            LIMIT 1
            `,
            [
                clienteId
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "El cliente seleccionado no existe",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR EMPLEADO
===================================================== */

const validarEmpleado = async (
    db,
    empleadoId
) => {
    const result =
        await db.query(
            `
            SELECT
                id,
                cedula,
                nombres,
                apellidos,
                activo
            FROM empleados
            WHERE id = $1
            LIMIT 1
            `,
            [
                empleadoId
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "El empleado no existe",
            404
        );
    }

    if (
        result.rows[0].activo === false
    ) {
        throw crearError(
            "No se puede asignar un empleado inactivo",
            409
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR CÓDIGO DUPLICADO
===================================================== */

const validarCodigoDuplicado = async (
    db,
    codigo,
    excluirObraId = null
) => {
    let query = `
        SELECT id
        FROM obras
        WHERE LOWER(codigo) = LOWER($1)
    `;

    const params = [
        codigo
    ];

    if (excluirObraId) {
        query += `
            AND id <> $2
        `;

        params.push(
            excluirObraId
        );
    }

    query += `
        LIMIT 1
    `;

    const result =
        await db.query(
            query,
            params
        );

    if (
        result.rowCount > 0
    ) {
        throw crearError(
            "El código de obra ya existe",
            409
        );
    }
};

/* =====================================================
   CREATE OBRA
===================================================== */

const createObra = async ({
    codigo,
    nombre,
    cliente_id,
    ubicacion,
    fecha_inicio,
    fecha_fin,
    presupuesto,
    estado,
    descripcion
}) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const codigoNormalizado =
            codigo.trim();

        const nombreNormalizado =
            nombre.trim();

        const clienteId =
            normalizarTexto(
                cliente_id
            );

        const fechaInicio =
            normalizarFecha(
                fecha_inicio
            );

        const fechaFin =
            normalizarFecha(
                fecha_fin
            );

        validarFechas(
            fechaInicio,
            fechaFin
        );

        await validarCodigoDuplicado(
            client,
            codigoNormalizado
        );

        await validarCliente(
            client,
            clienteId
        );

        const result =
            await client.query(
                `
                INSERT INTO obras (
                    codigo,
                    nombre,
                    cliente_id,
                    ubicacion,
                    fecha_inicio,
                    fecha_fin,
                    presupuesto,
                    estado,
                    descripcion
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )
                RETURNING *
                `,
                [
                    codigoNormalizado,
                    nombreNormalizado,
                    clienteId,
                    normalizarTexto(
                        ubicacion
                    ),
                    fechaInicio,
                    fechaFin,
                    normalizarNumero(
                        presupuesto,
                        0
                    ),
                    estado ||
                    "planificada",
                    normalizarTexto(
                        descripcion
                    )
                ]
            );

        await client.query(
            "COMMIT"
        );

        return result.rows[0];

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
   GET OBRAS
===================================================== */

const getObras = async () => {
    const result =
        await pool.query(
            `
            SELECT
                o.id,
                o.codigo,
                o.nombre,
                o.cliente_id,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(c.nombre, ''),
                            ' ',
                            COALESCE(c.apellido, '')
                        )
                    ),
                    ''
                ) AS cliente_nombre,

                o.ubicacion,
                o.fecha_inicio,
                o.fecha_fin,
                o.presupuesto,
                o.estado,
                o.descripcion,
                o.fecha_creacion

            FROM obras o

            LEFT JOIN clientes c
                ON c.id = o.cliente_id

            ORDER BY
                o.fecha_creacion DESC,
                o.nombre ASC
            `
        );

    return result.rows;
};

/* =====================================================
   GET OBRA BY ID
===================================================== */

const getObraById = async (
    id
) => {
    const result =
        await pool.query(
            `
            SELECT
                o.id,
                o.codigo,
                o.nombre,
                o.cliente_id,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(c.nombre, ''),
                            ' ',
                            COALESCE(c.apellido, '')
                        )
                    ),
                    ''
                ) AS cliente_nombre,

                o.ubicacion,
                o.fecha_inicio,
                o.fecha_fin,
                o.presupuesto,
                o.estado,
                o.descripcion,
                o.fecha_creacion

            FROM obras o

            LEFT JOIN clientes c
                ON c.id = o.cliente_id

            WHERE o.id = $1

            LIMIT 1
            `,
            [
                id
            ]
        );

    if (
        result.rowCount === 0
    ) {
        return null;
    }

    return result.rows[0];
};

/* =====================================================
   UPDATE OBRA
===================================================== */

const updateObra = async (
    id,
    data
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const obraActual =
            await obtenerObraSimple(
                client,
                id
            );

        /*
         * Lista blanca.
         *
         * Aunque el frontend envíe campos adicionales,
         * jamás se convierten automáticamente en SQL.
         */
        const camposPermitidos = [
            "codigo",
            "nombre",
            "cliente_id",
            "ubicacion",
            "fecha_inicio",
            "fecha_fin",
            "presupuesto",
            "estado",
            "descripcion"
        ];

        const datosLimpios = {};

        for (
            const campo of
            camposPermitidos
        ) {
            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        data,
                        campo
                    )
            ) {
                datosLimpios[campo] =
                    data[campo];
            }
        }

        if (
            Object.keys(
                datosLimpios
            ).length === 0
        ) {
            throw crearError(
                "No se enviaron campos válidos para actualizar",
                400
            );
        }

        /* =============================================
           CÓDIGO
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "codigo"
                )
        ) {
            datosLimpios.codigo =
                String(
                    datosLimpios.codigo
                ).trim();

            await validarCodigoDuplicado(
                client,
                datosLimpios.codigo,
                id
            );
        }

        /* =============================================
           NOMBRE
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "nombre"
                )
        ) {
            datosLimpios.nombre =
                String(
                    datosLimpios.nombre
                ).trim();
        }

        /* =============================================
           CLIENTE
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "cliente_id"
                )
        ) {
            datosLimpios.cliente_id =
                normalizarTexto(
                    datosLimpios.cliente_id
                );

            await validarCliente(
                client,
                datosLimpios.cliente_id
            );
        }

        /* =============================================
           TEXTOS OPCIONALES
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "ubicacion"
                )
        ) {
            datosLimpios.ubicacion =
                normalizarTexto(
                    datosLimpios.ubicacion
                );
        }

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "descripcion"
                )
        ) {
            datosLimpios.descripcion =
                normalizarTexto(
                    datosLimpios.descripcion
                );
        }

        /* =============================================
           FECHAS
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "fecha_inicio"
                )
        ) {
            datosLimpios.fecha_inicio =
                normalizarFecha(
                    datosLimpios.fecha_inicio
                );
        }

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "fecha_fin"
                )
        ) {
            datosLimpios.fecha_fin =
                normalizarFecha(
                    datosLimpios.fecha_fin
                );
        }

        const fechaInicioFinal =
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "fecha_inicio"
                )
                ? datosLimpios.fecha_inicio
                : obraActual.fecha_inicio;

        const fechaFinFinal =
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "fecha_fin"
                )
                ? datosLimpios.fecha_fin
                : obraActual.fecha_fin;

        validarFechas(
            fechaInicioFinal,
            fechaFinFinal
        );

        /* =============================================
           PRESUPUESTO
        ============================================= */

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    datosLimpios,
                    "presupuesto"
                )
        ) {
            datosLimpios.presupuesto =
                normalizarNumero(
                    datosLimpios.presupuesto,
                    0
                );
        }

        /* =============================================
           CONSTRUIR UPDATE
        ============================================= */

        const fields = [];
        const values = [];

        let index = 1;

        for (
            const [
                key,
                value
            ] of Object.entries(
                datosLimpios
            )
        ) {
            fields.push(
                `${key} = $${index}`
            );

            values.push(
                value
            );

            index++;
        }

        values.push(
            id
        );

        const result =
            await client.query(
                `
                UPDATE obras

                SET
                    ${fields.join(", ")}

                WHERE id = $${index}

                RETURNING *
                `,
                values
            );

        await client.query(
            "COMMIT"
        );

        return result.rows[0];

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
   DELETE OBRA
===================================================== */

const deleteObra = async (
    id
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const obra =
            await obtenerObraSimple(
                client,
                id
            );

        /*
         * Una obra que ya tiene historial operativo
         * NO debe desaparecer de la base de datos.
         *
         * Se revisan las principales relaciones.
         */

        const relaciones =
            await client.query(
                `
                SELECT

                    (
                        SELECT COUNT(*)
                        FROM empleados_obras
                        WHERE obra_id = $1
                    )::int
                        AS empleados,

                    (
                        SELECT COUNT(*)
                        FROM controles_diarios
                        WHERE obra_id = $1
                    )::int
                        AS controles,

                    (
                        SELECT COUNT(*)
                        FROM gastos_obra
                        WHERE obra_id = $1
                    )::int
                        AS gastos,

                    (
                        SELECT COUNT(*)
                        FROM pagos_empleados
                        WHERE obra_id = $1
                    )::int
                        AS pagos,

                    (
                        SELECT COUNT(*)
                        FROM transacciones
                        WHERE obra_id = $1
                    )::int
                        AS transacciones
                `,
                [
                    id
                ]
            );

        const historial =
            relaciones.rows[0];

        const tieneHistorial =
            Number(
                historial.empleados
            ) > 0 ||
            Number(
                historial.controles
            ) > 0 ||
            Number(
                historial.gastos
            ) > 0 ||
            Number(
                historial.pagos
            ) > 0 ||
            Number(
                historial.transacciones
            ) > 0;

        if (tieneHistorial) {
            throw crearError(
                "La obra tiene información asociada y no puede eliminarse. Puede cambiar su estado a cancelada para conservar el historial.",
                409
            );
        }

        const result =
            await client.query(
                `
                DELETE FROM obras
                WHERE id = $1
                RETURNING id, codigo, nombre
                `,
                [
                    id
                ]
            );

        await client.query(
            "COMMIT"
        );

        return result.rows[0] || {
            id: obra.id,
            codigo: obra.codigo,
            nombre: obra.nombre
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
   ASIGNAR EMPLEADO A OBRA
===================================================== */

const asignarEmpleadoObra =
    async ({
        obra_id,
        empleado_id,
        cargo_obra,
        fecha_inicio,
        fecha_fin,
        salario_acordado,
        observaciones
    }) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const obra =
                await obtenerObraSimple(
                    client,
                    obra_id
                );

            if (
                obra.estado ===
                "cancelada"
            ) {
                throw crearError(
                    "No se pueden asignar empleados a una obra cancelada",
                    409
                );
            }

            if (
                obra.estado ===
                "finalizada"
            ) {
                throw crearError(
                    "No se pueden asignar empleados a una obra finalizada",
                    409
                );
            }

            await validarEmpleado(
                client,
                empleado_id
            );

            const fechaInicio =
                normalizarFecha(
                    fecha_inicio
                );

            const fechaFin =
                normalizarFecha(
                    fecha_fin
                );

            validarFechas(
                fechaInicio,
                fechaFin
            );

            /* =========================================
               EVITAR ASIGNACIÓN DUPLICADA ACTIVA
            ========================================= */

            const existe =
                await client.query(
                    `
                    SELECT id
                    FROM empleados_obras

                    WHERE obra_id = $1
                      AND empleado_id = $2
                      AND activo = TRUE

                    LIMIT 1
                    `,
                    [
                        obra_id,
                        empleado_id
                    ]
                );

            if (
                existe.rowCount > 0
            ) {
                throw crearError(
                    "El empleado ya está asignado actualmente a esta obra",
                    409
                );
            }

            const result =
                await client.query(
                    `
                    INSERT INTO empleados_obras (
                        obra_id,
                        empleado_id,
                        cargo_obra,
                        fecha_inicio,
                        fecha_fin,
                        salario_acordado,
                        observaciones
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )
                    RETURNING *
                    `,
                    [
                        obra_id,
                        empleado_id,

                        normalizarTexto(
                            cargo_obra
                        ),

                        fechaInicio,

                        fechaFin,

                        normalizarNumero(
                            salario_acordado,
                            null
                        ),

                        normalizarTexto(
                            observaciones
                        )
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return result.rows[0];

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
   EMPLEADOS DE UNA OBRA
===================================================== */

const getEmpleadosObra =
    async (
        obraId
    ) => {
        await obtenerObraSimple(
            pool,
            obraId
        );

        const result =
            await pool.query(
                `
                SELECT
                    eo.id,
                    eo.obra_id,
                    eo.empleado_id,
                    eo.fecha_asignacion,
                    eo.fecha_inicio,
                    eo.fecha_fin,
                    eo.cargo_obra,
                    eo.salario_acordado,
                    eo.activo,
                    eo.observaciones,

                    e.nombres,
                    e.apellidos,

                    TRIM(
                        CONCAT(
                            e.nombres,
                            ' ',
                            e.apellidos
                        )
                    ) AS empleado_nombre,

                    e.cedula,
                    e.telefono,
                    e.correo,
                    e.cargo,
                    e.tipo_pago,
                    e.salario_base

                FROM empleados_obras eo

                INNER JOIN empleados e
                    ON e.id =
                        eo.empleado_id

                WHERE eo.obra_id = $1
                  AND eo.activo = TRUE

                ORDER BY
                    e.apellidos ASC,
                    e.nombres ASC
                `,
                [
                    obraId
                ]
            );

        return result.rows;
    };

/* =====================================================
   DESASIGNAR EMPLEADO
===================================================== */

const desasignarEmpleadoObra =
    async (
        id,
        motivo_salida,
        observaciones
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const asignacion =
                await client.query(
                    `
                    SELECT
                        id,
                        obra_id,
                        empleado_id,
                        activo
                    FROM empleados_obras

                    WHERE id = $1

                    FOR UPDATE
                    `,
                    [
                        id
                    ]
                );

            if (
                asignacion.rowCount ===
                0
            ) {
                throw crearError(
                    "La asignación no existe",
                    404
                );
            }

            if (
                asignacion.rows[0]
                    .activo === false
            ) {
                throw crearError(
                    "El empleado ya se encuentra desasignado",
                    409
                );
            }

            const result =
                await client.query(
                    `
                    UPDATE empleados_obras

                    SET
                        activo = FALSE,
                        fecha_fin = CURRENT_DATE,
                        motivo_salida = $2,
                        observaciones = $3

                    WHERE id = $1

                    RETURNING *
                    `,
                    [
                        id,

                        normalizarTexto(
                            motivo_salida
                        ),

                        normalizarTexto(
                            observaciones
                        )
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return result.rows[0];

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
   REGISTRAR ACTIVIDAD DIARIA
===================================================== */

const registrarActividadObra =
    async ({
        obra_id,
        fecha,
        actividad,
        descripcion,
        hora_inicio,
        hora_fin,
        avance,
        observaciones,
        clima
    }) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const obra =
                await obtenerObraSimple(
                    client,
                    obra_id
                );

            if (
                obra.estado ===
                "cancelada"
            ) {
                throw crearError(
                    "No se pueden registrar controles diarios en una obra cancelada",
                    409
                );
            }

            if (
                obra.estado ===
                "finalizada"
            ) {
                throw crearError(
                    "No se pueden registrar controles diarios en una obra finalizada",
                    409
                );
            }

            if (
                hora_inicio &&
                hora_fin &&
                hora_fin <
                hora_inicio
            ) {
                throw crearError(
                    "La hora de finalización no puede ser anterior a la hora de inicio",
                    400
                );
            }

            const avanceNumero =
                avance === undefined ||
                    avance === null ||
                    avance === ""
                    ? null
                    : Number(avance);

            if (
                avanceNumero !== null &&
                (
                    !Number.isFinite(
                        avanceNumero
                    ) ||
                    avanceNumero < 0 ||
                    avanceNumero > 100
                )
            ) {
                throw crearError(
                    "El avance debe estar entre 0 y 100",
                    400
                );
            }

            const result =
                await client.query(
                    `
                    INSERT INTO controles_diarios (
                        obra_id,
                        fecha,
                        actividad,
                        descripcion,
                        hora_inicio,
                        hora_fin,
                        avance,
                        observaciones,
                        clima
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9
                    )
                    RETURNING *
                    `,
                    [
                        obra_id,

                        fecha,

                        normalizarTexto(
                            actividad
                        ),

                        normalizarTexto(
                            descripcion
                        ),

                        normalizarTexto(
                            hora_inicio
                        ),

                        normalizarTexto(
                            hora_fin
                        ),

                        avanceNumero,

                        normalizarTexto(
                            observaciones
                        ),

                        normalizarTexto(
                            clima
                        )
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return result.rows[0];

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
   LISTAR CONTROLES POR OBRA
===================================================== */

const listarControlesPorObra =
    async (
        obra_id
    ) => {
        await obtenerObraSimple(
            pool,
            obra_id
        );

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    obra_id,
                    fecha,
                    actividad,
                    descripcion,
                    hora_inicio,
                    hora_fin,
                    avance,
                    observaciones,
                    clima

                FROM controles_diarios

                WHERE obra_id = $1

                ORDER BY
                    fecha DESC,
                    hora_inicio DESC NULLS LAST
                `,
                [
                    obra_id
                ]
            );

        return result.rows;
    };
/* =====================================================
LISTAR TODOS LOS CONTROLES DIARIOS
===================================================== */

const listarTodosControles = async () => {
    const result =
        await pool.query(
            `
            SELECT
                cd.id,
                cd.obra_id,

                o.codigo
                    AS obra_codigo,

                o.nombre
                    AS obra_nombre,

                cd.fecha,
                cd.actividad,
                cd.descripcion,
                cd.hora_inicio,
                cd.hora_fin,
                cd.avance,
                cd.clima,
                cd.observaciones

            FROM controles_diarios cd

            INNER JOIN obras o
                ON o.id = cd.obra_id

            ORDER BY
                cd.fecha DESC,
                cd.hora_inicio DESC NULLS LAST
            `
        );

    return result.rows;
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    createObra,
    getObras,
    getObraById,
    updateObra,
    deleteObra,

    asignarEmpleadoObra,
    getEmpleadosObra,
    desasignarEmpleadoObra,

    registrarActividadObra,
    listarControlesPorObra,
    listarTodosControles
};