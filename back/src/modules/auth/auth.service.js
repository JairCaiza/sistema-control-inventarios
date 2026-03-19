const bcrypt = require("bcrypt");
const { pool } = require("../../config/db");
const generateToken = require("../../utils/generateToken");
const logger = require("../../utils/logger");

const login = async ({ correo, contrasena }) => {
    const result = await pool.query(
        `SELECT u.id, u.nombre, u.correo, u.contrasena, r.nombre AS rol
     FROM usuarios u
     JOIN usuarios_roles ur ON ur.usuario_id = u.id
     JOIN roles r ON r.id = ur.rol_id
     WHERE u.correo = $1`,
        [correo]
    );

    if (result.rows.length === 0) {
        throw new Error("Credenciales inválidas");
    }

    const usuario = result.rows[0];

    const match = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!match) {
        throw new Error("Credenciales inválidas");
    }

    const token = generateToken(usuario);

    logger(`Usuario ${usuario.correo} inició sesión`);

    return {
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
        },
    };
};

module.exports = {
    login,
};