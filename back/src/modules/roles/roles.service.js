const { pool } = require("../../config/db");

const createRole = async ({ nombre, descripcion }) => {
    const result = await pool.query(
        `INSERT INTO roles (nombre, descripcion)
     VALUES ($1, $2)
     RETURNING id, nombre, descripcion, activo`,
        [nombre, descripcion]
    );

    return result.rows[0];
};

const getRoles = async () => {
    const result = await pool.query(
        `SELECT id, nombre, descripcion, activo
     FROM roles
     ORDER BY fecha_creacion DESC`
    );

    return result.rows;
};

const updateRole = async (id, data) => {
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
        `UPDATE roles
     SET ${fields.join(", ")}
     WHERE id = $${index}
     RETURNING id, nombre, descripcion, activo`,
        values
    );

    return result.rows[0];
};

const deactivateRole = async (id) => {
    const result = await pool.query(
        `UPDATE roles
     SET activo = false
     WHERE id = $1
     RETURNING id, activo`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createRole,
    getRoles,
    updateRole,
    deactivateRole
};