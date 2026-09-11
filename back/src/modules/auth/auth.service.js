const bcrypt = require("bcrypt");

const {
    pool
} = require("../../config/db");

const generateToken =
    require("../../utils/generateToken");

const logger =
    require("../../utils/logger");

/* =====================================================
   LOGIN
===================================================== */

const login = async ({
    correo,
    contrasena
}) => {

    /* =================================================
       BUSCAR USUARIO
    ================================================= */

    const result =
        await pool.query(
            `
            SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.contrasena,
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

            WHERE LOWER(u.correo) =
                  LOWER($1)

            GROUP BY
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.contrasena,
                u.activo
            `,
            [
                correo.trim()
            ]
        );

    /* =================================================
       USUARIO NO EXISTE
    ================================================= */

    if (
        result.rows.length === 0
    ) {
        throw new Error(
            "Credenciales inválidas"
        );
    }

    const usuario =
        result.rows[0];

    /* =================================================
       USUARIO INACTIVO
    ================================================= */

    if (
        usuario.activo === false
    ) {
        throw new Error(
            "El usuario se encuentra desactivado"
        );
    }

    /* =================================================
       VALIDAR CONTRASEÑA
    ================================================= */

    const match =
        await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

    if (!match) {
        throw new Error(
            "Credenciales inválidas"
        );
    }

    /* =================================================
       VALIDAR ROLES
    ================================================= */

    const roles =
        Array.isArray(
            usuario.roles
        )
            ? usuario.roles
            : [];

    if (
        roles.length === 0
    ) {
        throw new Error(
            "El usuario no tiene roles asignados"
        );
    }

    /* =================================================
       GENERAR TOKEN
    ================================================= */

    const token =
        generateToken({
            id:
                usuario.id,

            roles
        });

    /* =================================================
       LOG
    ================================================= */

    logger(
        `Usuario ${usuario.correo} inició sesión. Roles: ${roles.join(", ")}`
    );

    /* =================================================
       RESPUESTA
    ================================================= */

    return {
        token,

        usuario: {
            id:
                usuario.id,

            nombre:
                usuario.nombre,

            apellido:
                usuario.apellido,

            correo:
                usuario.correo,

            roles
        }
    };
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    login
};