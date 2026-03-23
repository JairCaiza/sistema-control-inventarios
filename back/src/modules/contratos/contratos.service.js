const { pool } = require("../../config/db");

const crearContrato = async (data) => {

    const result = await pool.query(
        `INSERT INTO contratos_alquiler
        (numero_contrato, cliente_id, fecha_inicio, fecha_fin, estado, observaciones)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [
            data.numero_contrato,
            data.cliente_id,
            data.fecha_inicio,
            data.fecha_fin,
            data.estado,
            data.observaciones
        ]
    );

    return result.rows[0];
};


const listarContratos = async () => {

    const result = await pool.query(`
        SELECT
            c.id,
            c.numero_contrato,
            cl.nombre AS cliente,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.total,
            c.fecha_creacion
        FROM contratos_alquiler c
        JOIN clientes cl ON cl.id = c.cliente_id
        ORDER BY c.fecha_creacion DESC
    `);

    return result.rows;
};
const agregarActivoContrato = async (contrato_id, data) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        /* 1 verificar stock */

        const activoResult = await client.query(
            `SELECT cantidad_total
             FROM activos
             WHERE id = $1`,
            [data.activo_id]
        );

        if (activoResult.rows.length === 0) {
            throw new Error("El activo no existe");
        }

        const stockActual = activoResult.rows[0].cantidad_total;

        if (data.cantidad > stockActual) {
            throw new Error("Stock insuficiente");
        }

        /* 2 calcular subtotal */

        const subtotal = data.cantidad * data.precio_diario;

        /* 3 insertar detalle contrato */

        await client.query(
            `INSERT INTO detalles_contrato
            (contrato_id, activo_id, cantidad, precio_diario, subtotal)
            VALUES ($1,$2,$3,$4,$5)`,
            [
                contrato_id,
                data.activo_id,
                data.cantidad,
                data.precio_diario,
                subtotal
            ]
        );

        /* 4 descontar inventario */

        await client.query(
            `UPDATE activos
             SET cantidad_total = cantidad_total - $1
             WHERE id = $2`,
            [data.cantidad, data.activo_id]
        );

        /* 5 registrar movimiento */

        await client.query(
            `INSERT INTO movimientos_inventario
            (activo_id, tipo_movimiento, cantidad, motivo)
            VALUES ($1,'salida',$2,$3)`,
            [
                data.activo_id,
                data.cantidad,
                `Contrato ${contrato_id}`
            ]
        );

        /* 6 actualizar total del contrato */

        await client.query(
            `UPDATE contratos_alquiler
             SET total = (
                SELECT COALESCE(SUM(subtotal),0)
                FROM detalles_contrato
                WHERE contrato_id = $1
             )
             WHERE id = $1`,
            [contrato_id]
        );

        await client.query("COMMIT");

        return true;

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();

    }
};


module.exports = {
    crearContrato,
    listarContratos, agregarActivoContrato
};