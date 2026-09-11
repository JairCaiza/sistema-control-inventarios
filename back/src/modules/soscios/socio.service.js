const { pool } = require("../../config/db");

/* =====================================================
   CREAR ERROR HTTP
===================================================== */

const crearError = (
    mensaje,
    statusCode
) => {
    const error = new Error(mensaje);

    error.statusCode = statusCode;

    return error;
};


/* =====================================================
   NORMALIZAR SOCIO
===================================================== */

const normalizarSocio = (
    socio
) => {
    if (!socio) {
        return null;
    }

    return {
        ...socio,

        total_aportes:
            Number(
                socio.total_aportes || 0
            ),

        total_retiros:
            Number(
                socio.total_retiros || 0
            ),

        capital_neto:
            Number(
                socio.capital_neto || 0
            ),

        porcentaje_participacion:
            Number(
                socio.porcentaje_participacion || 0
            )
    };
};


/* =====================================================
   VALIDAR IDENTIFICACIÓN DUPLICADA
===================================================== */

const validarIdentificacionDuplicada =
    async (
        identificacion,
        socioId = null
    ) => {
        let resultado;

        if (socioId) {
            resultado =
                await pool.query(
                    `
                    SELECT id

                    FROM socios

                    WHERE identificacion = $1
                      AND id <> $2

                    LIMIT 1
                    `,
                    [
                        identificacion,
                        socioId
                    ]
                );
        } else {
            resultado =
                await pool.query(
                    `
                    SELECT id

                    FROM socios

                    WHERE identificacion = $1

                    LIMIT 1
                    `,
                    [
                        identificacion
                    ]
                );
        }

        if (
            resultado.rows.length > 0
        ) {
            throw crearError(
                "Ya existe un socio con esa identificación",
                409
            );
        }
    };


/* =====================================================
   CONSULTA BASE FINANCIERA DE SOCIOS
===================================================== */

const consultaCapitalSocios = `
    WITH movimientos_socios AS (
        SELECT
            s.id AS socio_id,

            COALESCE(
                SUM(
                    CASE
                        WHEN ap.estado = 'confirmado'
                         AND ap.tipo = 'aporte'
                        THEN ap.monto
                        ELSE 0
                    END
                ),
                0
            ) AS total_aportes,

            COALESCE(
                SUM(
                    CASE
                        WHEN ap.estado = 'confirmado'
                         AND ap.tipo = 'retiro'
                        THEN ap.monto
                        ELSE 0
                    END
                ),
                0
            ) AS total_retiros

        FROM socios s

        LEFT JOIN aportes_socios ap
            ON ap.socio_id = s.id

        GROUP BY
            s.id
    ),

    capital_socios AS (
        SELECT
            socio_id,

            total_aportes,

            total_retiros,

            total_aportes -
            total_retiros
                AS capital_neto

        FROM movimientos_socios
    ),

    capital_total AS (
        SELECT
            COALESCE(
                SUM(
                    GREATEST(
                        capital_neto,
                        0
                    )
                ),
                0
            ) AS total

        FROM capital_socios
    )

    SELECT
        s.id,
        s.nombre,
        s.identificacion,
        s.contacto,
        s.fecha_ingreso,
        s.activo,
        s.usuario_id,
        s.fecha_creacion,
        s.fecha_actualizacion,

        cs.total_aportes,
        cs.total_retiros,
        cs.capital_neto,

        CASE
            WHEN ct.total > 0
            THEN ROUND(
                (
                    GREATEST(
                        cs.capital_neto,
                        0
                    )
                    /
                    ct.total
                ) * 100,
                2
            )

            ELSE 0
        END
            AS porcentaje_participacion

    FROM socios s

    INNER JOIN capital_socios cs
        ON cs.socio_id = s.id

    CROSS JOIN capital_total ct
`;


/* =====================================================
   CREAR SOCIO
===================================================== */

const crearSocio = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* =================================================
           VALIDAR IDENTIFICACIÓN DUPLICADA
        ================================================= */

        const identificacionDuplicada =
            await client.query(
                `
                SELECT id

                FROM socios

                WHERE identificacion = $1

                LIMIT 1
                `,
                [
                    data.identificacion.trim()
                ]
            );

        if (
            identificacionDuplicada.rows.length > 0
        ) {
            throw crearError(
                "Ya existe un socio con esa identificación",
                409
            );
        }

        /* =================================================
           OBTENER USUARIO Y SUS ROLES
        ================================================= */

        const usuarioRes =
            await client.query(
                `
                SELECT
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.activo,

                    COALESCE(
                        ARRAY_AGG(
                            DISTINCT r.nombre
                        )
                        FILTER (
                            WHERE r.nombre IS NOT NULL
                        ),
                        '{}'
                    ) AS roles

                FROM usuarios u

                LEFT JOIN usuarios_roles ur
                    ON ur.usuario_id = u.id

                LEFT JOIN roles r
                    ON r.id = ur.rol_id
                    AND r.activo = TRUE

                WHERE u.id = $1

                GROUP BY
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.activo
                `,
                [
                    data.usuario_id
                ]
            );

        if (
            usuarioRes.rows.length === 0
        ) {
            throw crearError(
                "El usuario seleccionado no existe",
                404
            );
        }

        const usuario =
            usuarioRes.rows[0];

        /* =================================================
           VALIDAR USUARIO ACTIVO
        ================================================= */

        if (
            usuario.activo === false
        ) {
            throw crearError(
                "No se puede registrar como socio un usuario inactivo",
                409
            );
        }

        /* =================================================
           VALIDAR ROL SOCIO
        ================================================= */

        const roles =
            Array.isArray(
                usuario.roles
            )
                ? usuario.roles
                : [];

        if (
            !roles.includes(
                "Socio"
            )
        ) {
            throw crearError(
                "El usuario seleccionado debe tener asignado el rol Socio",
                409
            );
        }

        /* =================================================
           VALIDAR QUE EL USUARIO NO SEA YA SOCIO
        ================================================= */

        const usuarioVinculado =
            await client.query(
                `
                SELECT
                    id,
                    nombre,
                    identificacion

                FROM socios

                WHERE usuario_id = $1

                LIMIT 1
                `,
                [
                    data.usuario_id
                ]
            );

        if (
            usuarioVinculado.rows.length > 0
        ) {
            throw crearError(
                "El usuario seleccionado ya está registrado como socio",
                409
            );
        }

        /* =================================================
           GENERAR NOMBRE DESDE EL USUARIO
        ================================================= */

        const nombreCompleto = [
            usuario.nombre,
            usuario.apellido
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        if (!nombreCompleto) {
            throw crearError(
                "El usuario seleccionado no tiene un nombre válido",
                409
            );
        }

        const activo =
            data.activo !== undefined
                ? data.activo
                : true;

        /* =================================================
           CREAR SOCIO VINCULADO
        ================================================= */

        const resultado =
            await client.query(
                `
                INSERT INTO socios
                (
                    nombre,
                    identificacion,
                    contacto,
                    fecha_ingreso,
                    activo,
                    usuario_id
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    COALESCE(
                        $4,
                        CURRENT_DATE
                    ),
                    $5,
                    $6
                )

                RETURNING
                    id,
                    nombre,
                    identificacion,
                    contacto,
                    fecha_ingreso,
                    activo,
                    usuario_id,
                    fecha_creacion,
                    fecha_actualizacion
                `,
                [
                    nombreCompleto,

                    data.identificacion.trim(),

                    data.contacto
                        ? data.contacto.trim()
                        : null,

                    data.fecha_ingreso || null,

                    activo,

                    data.usuario_id
                ]
            );

        await client.query("COMMIT");

        return normalizarSocio({
            ...resultado.rows[0],

            correo:
                usuario.correo,

            total_aportes:
                0,

            total_retiros:
                0,

            capital_neto:
                0,

            porcentaje_participacion:
                0
        });

    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        if (
            error.code === "23505"
        ) {
            throw crearError(
                "La identificación o el usuario seleccionado ya pertenece a otro socio",
                409
            );
        }

        if (
            error.code === "23503"
        ) {
            throw crearError(
                "El usuario seleccionado no existe",
                404
            );
        }

        throw error;

    } finally {
        client.release();
    }
};


/* =====================================================
   LISTAR SOCIOS
===================================================== */

const listarSocios = async ({
    buscar,
    activo,
    fecha_ingreso
} = {}) => {
    const condiciones = [];

    const valores = [];

    if (buscar) {
        valores.push(
            `%${buscar.trim()}%`
        );

        condiciones.push(
            `
            (
                s.nombre ILIKE $${valores.length}

                OR

                s.identificacion ILIKE $${valores.length}

                OR

                COALESCE(
                    s.contacto,
                    ''
                ) ILIKE $${valores.length}
            )
            `
        );
    }

    if (
        activo !== undefined &&
        activo !== null &&
        activo !== ""
    ) {
        const estadoActivo =
            activo === true ||
            activo === "true";

        valores.push(
            estadoActivo
        );

        condiciones.push(
            `s.activo = $${valores.length}`
        );
    }

    if (fecha_ingreso) {
        valores.push(
            fecha_ingreso
        );

        condiciones.push(
            `s.fecha_ingreso = $${valores.length}`
        );
    }

    const where =
        condiciones.length > 0
            ? `WHERE ${condiciones.join(
                " AND "
            )}`
            : "";

    const resultado =
        await pool.query(
            `
            ${consultaCapitalSocios}

            ${where}

            ORDER BY
                s.activo DESC,
                s.nombre ASC
            `,
            valores
        );

    return resultado.rows.map(
        normalizarSocio
    );
};


/* =====================================================
   OBTENER SOCIO POR ID
===================================================== */

const obtenerSocioPorId = async (
    id
) => {
    const resultado =
        await pool.query(
            `
            ${consultaCapitalSocios}

            WHERE s.id = $1
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

    return normalizarSocio(
        resultado.rows[0]
    );
};


/* =====================================================
   OBTENER SOCIO POR USUARIO
===================================================== */

/*
 * Esta función será utilizada por el portal del socio.
 *
 * El frontend NO enviará el socio_id.
 *
 * Se utilizará:
 *
 * req.user.id
 *
 * y se buscará:
 *
 * socios.usuario_id = req.user.id
 */

const obtenerSocioPorUsuario = async (
    usuarioId
) => {
    const resultado =
        await pool.query(
            `
            ${consultaCapitalSocios}

            WHERE s.usuario_id = $1
            `,
            [
                usuarioId
            ]
        );

    if (
        resultado.rows.length === 0
    ) {
        throw crearError(
            "El usuario autenticado no está vinculado a ningún socio",
            404
        );
    }

    return normalizarSocio(
        resultado.rows[0]
    );
};


/* =====================================================
   LISTAR USUARIOS DISPONIBLES PARA REGISTRAR SOCIO
===================================================== */

const listarUsuariosSocioDisponibles =
    async () => {
        const resultado =
            await pool.query(
                `
                SELECT DISTINCT
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.activo

                FROM usuarios u

                INNER JOIN usuarios_roles ur
                    ON ur.usuario_id = u.id

                INNER JOIN roles r
                    ON r.id = ur.rol_id

                LEFT JOIN socios s
                    ON s.usuario_id = u.id

                WHERE r.nombre = 'Socio'
                  AND r.activo = TRUE
                  AND u.activo = TRUE
                  AND s.id IS NULL

                ORDER BY
                    u.nombre ASC,
                    u.apellido ASC,
                    u.correo ASC
                `
            );

        return resultado.rows;
    };


/* =====================================================
   VALIDAR USUARIO PARA VINCULAR CON SOCIO
===================================================== */

const validarUsuarioParaSocio = async (
    usuarioId
) => {
    const resultado =
        await pool.query(
            `
            SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.activo,

                COALESCE(
                    ARRAY_AGG(
                        DISTINCT r.nombre
                    )
                    FILTER (
                        WHERE r.nombre IS NOT NULL
                    ),
                    '{}'
                ) AS roles

            FROM usuarios u

            LEFT JOIN usuarios_roles ur
                ON ur.usuario_id = u.id

            LEFT JOIN roles r
                ON r.id = ur.rol_id
                AND r.activo = TRUE

            WHERE u.id = $1

            GROUP BY
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.activo
            `,
            [
                usuarioId
            ]
        );

    if (
        resultado.rows.length === 0
    ) {
        throw crearError(
            "El usuario seleccionado no existe",
            404
        );
    }

    const usuario =
        resultado.rows[0];

    if (
        usuario.activo === false
    ) {
        throw crearError(
            "No se puede vincular un usuario inactivo",
            409
        );
    }

    const roles =
        Array.isArray(
            usuario.roles
        )
            ? usuario.roles
            : [];

    if (
        !roles.includes(
            "Socio"
        )
    ) {
        throw crearError(
            "El usuario seleccionado debe tener asignado el rol Socio",
            409
        );
    }

    return usuario;
};


/* =====================================================
   VINCULAR USUARIO CON SOCIO
===================================================== */

const vincularUsuarioSocio = async (
    socioId,
    usuarioId
) => {
    const socio =
        await obtenerSocioPorId(
            socioId
        );

    if (!socio) {
        throw crearError(
            "El socio no existe",
            404
        );
    }

    if (
        socio.activo === false
    ) {
        throw crearError(
            "No se puede vincular un usuario a un socio inactivo",
            409
        );
    }

    await validarUsuarioParaSocio(
        usuarioId
    );

    /* =================================================
       VERIFICAR QUE EL USUARIO NO ESTÉ VINCULADO
       A OTRO SOCIO
    ================================================= */

    const usuarioVinculado =
        await pool.query(
            `
            SELECT
                id,
                nombre,
                identificacion

            FROM socios

            WHERE usuario_id = $1
              AND id <> $2

            LIMIT 1
            `,
            [
                usuarioId,
                socioId
            ]
        );

    if (
        usuarioVinculado.rows.length > 0
    ) {
        throw crearError(
            "El usuario seleccionado ya está vinculado a otro socio",
            409
        );
    }

    /* =================================================
       VERIFICAR SI EL SOCIO YA TIENE OTRO USUARIO
    ================================================= */

    if (
        socio.usuario_id &&
        socio.usuario_id !== usuarioId
    ) {
        throw crearError(
            "El socio ya tiene una cuenta de usuario vinculada. Debe desvincularla antes de asignar otra.",
            409
        );
    }

    try {
        await pool.query(
            `
            UPDATE socios

            SET
                usuario_id = $1,
                fecha_actualizacion = NOW()

            WHERE id = $2
            `,
            [
                usuarioId,
                socioId
            ]
        );

        return await obtenerSocioPorId(
            socioId
        );

    } catch (error) {
        if (
            error.code === "23505"
        ) {
            throw crearError(
                "El usuario seleccionado ya está vinculado a otro socio",
                409
            );
        }

        if (
            error.code === "23503"
        ) {
            throw crearError(
                "El usuario seleccionado no existe",
                404
            );
        }

        throw error;
    }
};


/* =====================================================
   DESVINCULAR USUARIO DEL SOCIO
===================================================== */

const desvincularUsuarioSocio = async (
    socioId
) => {
    const socio =
        await obtenerSocioPorId(
            socioId
        );

    if (!socio) {
        throw crearError(
            "El socio no existe",
            404
        );
    }

    if (!socio.usuario_id) {
        throw crearError(
            "El socio no tiene una cuenta de usuario vinculada",
            409
        );
    }

    await pool.query(
        `
        UPDATE socios

        SET
            usuario_id = NULL,
            fecha_actualizacion = NOW()

        WHERE id = $1
        `,
        [
            socioId
        ]
    );

    return await obtenerSocioPorId(
        socioId
    );
};


/* =====================================================
   ACTUALIZAR SOCIO
===================================================== */

const actualizarSocio = async (
    id,
    data
) => {
    const socioActual =
        await obtenerSocioPorId(
            id
        );

    if (!socioActual) {
        throw crearError(
            "El socio no existe",
            404
        );
    }

    const nombre =
        data.nombre !== undefined
            ? data.nombre.trim()
            : socioActual.nombre;

    const identificacion =
        data.identificacion !== undefined
            ? data.identificacion.trim()
            : socioActual.identificacion;

    const contacto =
        data.contacto !== undefined
            ? (
                data.contacto
                    ? data.contacto.trim()
                    : null
            )
            : socioActual.contacto;

    const fechaIngreso =
        data.fecha_ingreso !== undefined
            ? data.fecha_ingreso
            : socioActual.fecha_ingreso;

    const activo =
        data.activo !== undefined
            ? data.activo
            : socioActual.activo;

    await validarIdentificacionDuplicada(
        identificacion,
        id
    );

    try {
        await pool.query(
            `
            UPDATE socios

            SET
                nombre = $1,
                identificacion = $2,
                contacto = $3,
                fecha_ingreso = $4,
                activo = $5,
                fecha_actualizacion = NOW()

            WHERE id = $6
            `,
            [
                nombre,
                identificacion,
                contacto,
                fechaIngreso,
                activo,
                id
            ]
        );

        return await obtenerSocioPorId(
            id
        );

    } catch (error) {
        if (
            error.code === "23505"
        ) {
            throw crearError(
                "Ya existe un socio con esa identificación",
                409
            );
        }

        throw error;
    }
};


/* =====================================================
   CAMBIAR ESTADO
===================================================== */

const cambiarEstadoSocio = async (
    id,
    activo
) => {
    const socio =
        await obtenerSocioPorId(
            id
        );

    if (!socio) {
        throw crearError(
            "El socio no existe",
            404
        );
    }

    await pool.query(
        `
        UPDATE socios

        SET
            activo = $1,
            fecha_actualizacion = NOW()

        WHERE id = $2
        `,
        [
            activo,
            id
        ]
    );

    return await obtenerSocioPorId(
        id
    );
};


/* =====================================================
   ELIMINAR SOCIO
===================================================== */

const eliminarSocio = async (
    id
) => {
    const socio =
        await obtenerSocioPorId(
            id
        );

    if (!socio) {
        throw crearError(
            "El socio no existe",
            404
        );
    }

    const aportesRes =
        await pool.query(
            `
            SELECT
                COUNT(*)::INTEGER
                    AS total

            FROM aportes_socios

            WHERE socio_id = $1
            `,
            [
                id
            ]
        );

    const utilidadesRes =
        await pool.query(
            `
            SELECT
                COUNT(*)::INTEGER
                    AS total

            FROM distribuciones_utilidades

            WHERE socio_id = $1
            `,
            [
                id
            ]
        );

    const totalAportes =
        Number(
            aportesRes.rows[0]
                .total
        );

    const totalUtilidades =
        Number(
            utilidadesRes.rows[0]
                .total
        );

    if (
        totalAportes > 0 ||
        totalUtilidades > 0
    ) {
        throw crearError(
            "No se puede eliminar el socio porque tiene movimientos financieros o distribuciones de utilidades. Debe desactivarlo.",
            409
        );
    }

    const resultado =
        await pool.query(
            `
            DELETE FROM socios

            WHERE id = $1

            RETURNING
                id,
                nombre
            `,
            [
                id
            ]
        );

    return resultado.rows[0];
};


/* =====================================================
   OBTENER RESUMEN DE CAPITAL SOCIAL
===================================================== */

const obtenerResumenCapital = async () => {
    const resultado =
        await pool.query(
            `
            WITH movimientos AS (
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN estado = 'confirmado'
                                 AND tipo = 'aporte'
                                THEN monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS aportes,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN estado = 'confirmado'
                                 AND tipo = 'retiro'
                                THEN monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS retiros

                FROM aportes_socios
            )

            SELECT
                aportes AS total_aportes,

                retiros AS total_retiros,

                aportes - retiros
                    AS capital_total

            FROM movimientos
            `
        );

    return {
        total_aportes:
            Number(
                resultado.rows[0]
                    .total_aportes || 0
            ),

        total_retiros:
            Number(
                resultado.rows[0]
                    .total_retiros || 0
            ),

        capital_total:
            Number(
                resultado.rows[0]
                    .capital_total || 0
            )
    };
};


/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearSocio,

    listarSocios,

    obtenerSocioPorId,

    obtenerSocioPorUsuario,

    listarUsuariosSocioDisponibles,

    vincularUsuarioSocio,

    desvincularUsuarioSocio,

    actualizarSocio,

    cambiarEstadoSocio,

    eliminarSocio,

    obtenerResumenCapital
};