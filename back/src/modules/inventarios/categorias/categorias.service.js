const { pool } = require("../../../config/db");

const crearCategoria = async ({ nombre, tipo }) => {
    const result = await pool.query(
        `INSERT INTO categorias (nombre, tipo)
         VALUES ($1, $2)
         RETURNING *`,
        [nombre, tipo]
    );

    return result.rows[0];
};
const listarCategorias = async () => {
    const result = await pool.query(
        `SELECT * FROM categorias
         WHERE activo = true
         ORDER BY fecha_creacion DESC`
    );

    return result.rows;
};
const actualizarCategoria = async (id, { nombre, tipo }) => {
    const result = await pool.query(
        `UPDATE categorias
         SET nombre = $1,
             tipo = $2
         WHERE id = $3
         RETURNING *`,
        [nombre, tipo, id]
    );

    return result.rows[0];
};
const eliminarCategoria = async (id) => {
    const result = await pool.query(
        `UPDATE categorias
         SET activo = false
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
};
module.exports = {
    crearCategoria, listarCategorias, actualizarCategoria, eliminarCategoria
};