const { pool } = require("../../../config/db");

const crearUbicacion = async ({ nombre, descripcion }) => {

    const result = await pool.query(
        `INSERT INTO ubicaciones (nombre, descripcion)
         VALUES ($1, $2)
         RETURNING *`,
        [nombre, descripcion]
    );

    return result.rows[0];
};


const listarUbicaciones = async () => {

    const result = await pool.query(
        `SELECT *
         FROM ubicaciones
         ORDER BY nombre`
    );

    return result.rows;
};


const actualizarUbicacion = async (id, { nombre, descripcion }) => {

    const result = await pool.query(
        `UPDATE ubicaciones
         SET nombre = $1,
             descripcion = $2
         WHERE id = $3
         RETURNING *`,
        [nombre, descripcion, id]
    );

    return result.rows[0];
};


const eliminarUbicacion = async (id) => {

    // 🔍 1. VALIDAR RELACIÓN CON ACTIVOS
    const check = await pool.query(
        `SELECT COUNT(*) 
         FROM activos 
         WHERE ubicacion_id = $1`,
        [id]
    );

    const count = parseInt(check.rows[0].count);

    if (count > 0) {
        throw new Error("No se puede eliminar la ubicación porque está asignada a activos");
    }

    // 🗑 2. ELIMINAR SI NO TIENE RELACIÓN
    const result = await pool.query(
        `DELETE FROM ubicaciones
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
};


module.exports = {
    crearUbicacion,
    listarUbicaciones,
    actualizarUbicacion,
    eliminarUbicacion
};