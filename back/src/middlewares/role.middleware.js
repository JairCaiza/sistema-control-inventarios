/* =====================================================
   MIDDLEWARE DE AUTORIZACIÓN POR ROLES
===================================================== */

const authorizeRoles = (...rolesPermitidos) => {

    return (req, res, next) => {

        /* =================================================
           VERIFICAR USUARIO AUTENTICADO
        ================================================= */

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado"
            });
        }

        /* =================================================
           OBTENER ROLES DEL USUARIO
        ================================================= */

        const rolesUsuario = Array.isArray(req.user.roles)
            ? req.user.roles
            : [];

        /* =================================================
           USUARIO SIN ROLES
        ================================================= */

        if (rolesUsuario.length === 0) {
            return res.status(403).json({
                success: false,
                message: "El usuario no tiene roles asignados"
            });
        }

        /* =================================================
           VERIFICAR SI TIENE UN ROL PERMITIDO
        ================================================= */

        const tienePermiso = rolesUsuario.some(
            (rol) => rolesPermitidos.includes(rol)
        );

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para acceder a este recurso"
            });
        }

        /* =================================================
           AUTORIZADO
        ================================================= */

        return next();
    };
};

module.exports = authorizeRoles;