const { pool } = require("../../config/db");

/* =========================
   CREATE ROLE
========================= */
const createRole = async ({ nombre, descripcion }) => {
    const result = await pool.query(
        `INSERT INTO roles (nombre, descripcion)
         VALUES ($1, $2)
         RETURNING id, nombre, descripcion, activo`,
        [nombre, descripcion]
    );

    return result.rows[0];
};

/* =========================
   GET ROLES
========================= */
const getRoles = async () => {
    const result = await pool.query(
        `SELECT id, nombre, descripcion, activo
         FROM roles
         ORDER BY fecha_creacion DESC`
    );

    return result.rows;
};

/* =========================
   UPDATE ROLE
========================= */
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
         SET ${fields.join(", ")},
             fecha_actualizacion = NOW()
         WHERE id = $${index}
         RETURNING id, nombre, descripcion, activo`,
        values
    );

    return result.rows[0];
};

/* =========================
   TOGGLE STATUS (ACTIVAR / DESACTIVAR)
========================= */
const toggleRoleStatus = async (id, activo) => {
    const result = await pool.query(
        `UPDATE roles
         SET activo = $1
         WHERE id = $2
         RETURNING id, activo`,
        [activo, id]
    );

    return result.rows[0];
};

/* =========================
   DELETE ROLE (VALIDADO)
========================= */
const deleteRole = async (id) => {
    // 🔥 validar si está en uso
    const check = await pool.query(
        `SELECT COUNT(*) 
         FROM usuarios_roles 
         WHERE rol_id = $1`,
        [id]
    );

    const count = parseInt(check.rows[0].count);

    if (count > 0) {
        throw new Error("No se puede eliminar el rol porque está asignado a usuarios");
    }

    // 🔥 eliminación real (o puedes hacer soft delete si quieres)
    const result = await pool.query(
        `DELETE FROM roles
         WHERE id = $1
         RETURNING id`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createRole,
    getRoles,
    updateRole,
    toggleRoleStatus,
    deleteRole
};