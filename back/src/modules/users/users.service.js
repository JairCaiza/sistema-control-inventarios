const bcrypt = require("bcrypt");
const { pool } = require("../../config/db");

const createUser = async (data) => {
    const { nombre, apellido, correo, contrasena, rol_id } = data;

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const userResult = await client.query(
            `INSERT INTO usuarios (nombre, apellido, correo, contrasena)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, correo, activo`,
            [nombre, apellido, correo, hashedPassword]
        );

        const usuario = userResult.rows[0];

        await client.query(
            `INSERT INTO usuarios_roles (usuario_id, rol_id)
       VALUES ($1, $2)`,
            [usuario.id, rol_id]
        );

        await client.query("COMMIT");

        return usuario;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const getUsers = async () => {
    const result = await pool.query(
        `SELECT u.id, u.nombre, u.apellido, u.correo, u.activo, r.nombre AS rol
     FROM usuarios u
     LEFT JOIN usuarios_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r ON r.id = ur.rol_id`
    );

    return result.rows;
};

const updateUser = async (id, data) => {
    const fields = [];
    const values = [];
    let index = 1;

    for (let key in data) {
        fields.push(`${key} = $${index}`);
        values.push(data[key]);
        index++;
    }

    values.push(id);

    const result = await pool.query(
        `UPDATE usuarios
     SET ${fields.join(", ")}, fecha_actualizacion = NOW()
     WHERE id = $${index}
     RETURNING id, nombre, apellido, correo, activo`,
        values
    );

    return result.rows[0];
};

const deactivateUser = async (id) => {
    const result = await pool.query(
        `UPDATE usuarios
     SET activo = false, fecha_actualizacion = NOW()
     WHERE id = $1
     RETURNING id, activo`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createUser,
    getUsers,
    updateUser,
    deactivateUser
};