const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const result = await pool.query(
                `SELECT u.id, u.nombre, r.nombre AS rol
         FROM usuarios u
         JOIN usuarios_roles ur ON ur.usuario_id = u.id
         JOIN roles r ON r.id = ur.rol_id
         WHERE u.id = $1`,
                [decoded.id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no válido",
                });
            }

            req.user = result.rows[0];

            next();
        } else {
            return res.status(401).json({
                success: false,
                message: "No autorizado, token requerido",
            });
        }
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token inválido o expirado",
        });
    }
};

module.exports = protect;