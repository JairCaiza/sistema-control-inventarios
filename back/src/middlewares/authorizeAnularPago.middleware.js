
/* =====================================================
   AUTORIZAR ANULACIÓN DE PAGOS
   CONSTRUCTSYS
===================================================== */

const authorizeAnularPago = (req, res, next) => {
    try {
        // El middleware protect debe ejecutarse primero.
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado"
            });
        }

        const roles = Array.isArray(req.user.roles)
            ? req.user.roles
            : [];

        // Normalizar nombres de roles.
        const rolesNormalizados = roles.map((rol) =>
            String(rol).trim().toLowerCase()
        );

        // Solo Administrador puede anular pagos.
        const esAdministrador =
            rolesNormalizados.includes("administrador");

        if (!esAdministrador) {
            return res.status(403).json({
                success: false,
                message:
                    "No tiene permisos para anular pagos. " +
                    "Esta operación requiere el rol Administrador."
            });
        }

        return next();

    } catch (error) {
        console.error(
            "Error en authorizeAnularPago:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error al verificar los permisos de anulación"
        });
    }
};

module.exports = authorizeAnularPago;
