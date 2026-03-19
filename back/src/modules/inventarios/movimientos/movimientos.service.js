const { pool } = require("../../../config/db");

const crearMovimiento = async (data) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const activoResult = await client.query(
            `SELECT cantidad_total
             FROM activos
             WHERE id = $1`,
            [data.activo_id]
        );

        if (activoResult.rows.length === 0) {
            throw new Error("Activo no encontrado");
        }

        let stock = activoResult.rows[0].cantidad_total;

        if (data.tipo_movimiento === "entrada") {
            stock += data.cantidad;
        }

        if (data.tipo_movimiento === "salida") {

            if (stock < data.cantidad) {
                throw new Error("Stock insuficiente");
            }

            stock -= data.cantidad;
        }

        if (data.tipo_movimiento === "ajuste") {
            stock = data.cantidad;
        }

        await client.query(
            `UPDATE activos
             SET cantidad_total = $1,
                 fecha_actualizacion = NOW()
             WHERE id = $2`,
            [stock, data.activo_id]
        );

        const movimiento = await client.query(
            `INSERT INTO movimientos_inventario
            (activo_id,tipo_movimiento,cantidad,motivo,referencia)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                data.activo_id,
                data.tipo_movimiento,
                data.cantidad,
                data.motivo,
                data.referencia
            ]
        );

        await client.query("COMMIT");

        return movimiento.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();

    }
};

module.exports = {
    crearMovimiento
};