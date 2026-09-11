const jwt = require("jsonwebtoken");

const {
    pool
} = require("../config/db");

/* =====================================================
   PROTEGER RUTAS
===================================================== */

const protect = async (
    req,
    res,
    next
) => {
    try {
        /* =================================================
           OBTENER HEADER AUTHORIZATION
        ================================================= */

        const authorization =
            req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "No autorizado, token requerido"
            });
        }

        /* =================================================
           OBTENER TOKEN
        ================================================= */

        const token =
            authorization.split(" ")[1];

        /* =================================================
           VERIFICAR JWT
        ================================================= */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        /* =================================================
           BUSCAR USUARIO + TODOS SUS ROLES
        ================================================= */

        const result =
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
                    decoded.id
                ]
            );

        /* =================================================
           USUARIO NO EXISTE
        ================================================= */

        if (
            result.rows.length === 0
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Usuario no válido"
            });
        }

        const usuario =
            result.rows[0];

        /* =================================================
           USUARIO INACTIVO
        ================================================= */

        if (
            usuario.activo === false
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "El usuario se encuentra desactivado"
            });
        }

        /* =================================================
           NORMALIZAR ROLES
        ================================================= */

        usuario.roles =
            Array.isArray(
                usuario.roles
            )
                ? usuario.roles
                : [];

        /* =================================================
           USUARIO SIN ROLES
        ================================================= */

        if (
            usuario.roles.length === 0
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "El usuario no tiene roles activos asignados"
            });
        }

        /* =================================================
           GUARDAR USUARIO EN REQUEST
        ================================================= */

        req.user = {
            id:
                usuario.id,

            nombre:
                usuario.nombre,

            apellido:
                usuario.apellido,

            correo:
                usuario.correo,

            roles:
                usuario.roles
        };

        return next();

    } catch (error) {
        /* =================================================
           TOKEN EXPIRADO
        ================================================= */

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "La sesión ha expirado"
            });
        }

        /* =================================================
           TOKEN INVÁLIDO
        ================================================= */

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Token inválido"
            });
        }

        /* =================================================
           ERROR GENERAL
        ================================================= */

        console.error(
            "Error en auth.middleware:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                "No autorizado"
        });
    }
};

module.exports = protect;