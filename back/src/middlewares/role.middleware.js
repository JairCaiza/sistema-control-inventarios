const pool = require("../config/db");

const authorizeRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: "Acceso denegado",
            });
        }

        next();
    };
};


module.exports = authorizeRoles;