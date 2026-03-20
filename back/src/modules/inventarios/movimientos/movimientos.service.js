const { pool } = require("../../../config/db");

const crearMovimiento = async ({
    activo_id,
    tipo_movimiento,
    cantidad,
    motivo,
    referencia
}) => {

    // 1️⃣ Obtener stock actual
    const stockResult = await pool.query(`
        SELECT COALESCE(SUM(
            CASE 
                WHEN tipo_movimiento = 'entrada' THEN cantidad
                WHEN tipo_movimiento = 'salida' THEN -cantidad
            END
        ),0) AS stock
        FROM movimientos_inventario
        WHERE activo_id = $1
    `, [activo_id]);

    const stockActual = Number(stockResult.rows[0].stock);

    // 2️⃣ VALIDAR STOCK
    if (tipo_movimiento === "salida" && cantidad > stockActual) {
        throw new Error("Stock insuficiente");
    }

    // 3️⃣ Registrar movimiento
    const result = await pool.query(`
        INSERT INTO movimientos_inventario
        (activo_id, tipo_movimiento, cantidad, motivo, referencia)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
    `, [activo_id, tipo_movimiento, cantidad, motivo, referencia]);

    return result.rows[0];
};  

const obtenerHistorialPorActivo = async (activo_id) => {

    const result = await pool.query(
        `SELECT 
            id,
            tipo_movimiento,
            cantidad,
            motivo,
            referencia,
            fecha_creacion
         FROM movimientos_inventario
         WHERE activo_id = $1
         ORDER BY fecha_creacion DESC`,
        [activo_id]
    );

    return result.rows;
};
const obtenerMovimientos = async () => {

    const result = await pool.query(
        `SELECT 
            m.id,
            a.nombre AS activo,
            m.tipo_movimiento,
            m.cantidad,
            m.motivo,
            m.referencia,
            m.fecha_creacion
        FROM movimientos_inventario m
        JOIN activos a ON a.id = m.activo_id
        ORDER BY m.fecha_creacion DESC`
    );

    return result.rows;
};

const obtenerKardex = async (activo_id) => {

    const client = await pool.connect();

    try {

        const activo = await client.query(
            `SELECT cantidad_total
             FROM activos
             WHERE id = $1`,
            [activo_id]
        );

        if (activo.rows.length === 0) {
            throw new Error("Activo no encontrado");
        }

        let stock = activo.rows[0].cantidad_total;

        const movimientos = await client.query(
            `SELECT
                tipo_movimiento,
                cantidad,
                fecha_creacion
            FROM movimientos_inventario
            WHERE activo_id = $1
            ORDER BY fecha_creacion DESC`,
            [activo_id]
        );

        const kardex = movimientos.rows.map(m => {

            let entrada = 0;
            let salida = 0;

            if (m.tipo_movimiento === "entrada") {
                entrada = m.cantidad;
                stock -= m.cantidad;
            }

            if (m.tipo_movimiento === "salida") {
                salida = m.cantidad;
                stock += m.cantidad;
            }

            return {
                fecha: m.fecha_creacion,
                tipo: m.tipo_movimiento,
                entrada,
                salida,
                stock
            };

        });

        return kardex.reverse();

    } finally {

        client.release();

    }

};
module.exports = {
    crearMovimiento, obtenerHistorialPorActivo, obtenerMovimientos, obtenerKardex
};