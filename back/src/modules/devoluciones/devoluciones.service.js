const { pool } = require("../../config/db");

/* =========================
   REGISTRAR DEVOLUCIÓN
========================= */
const registrar = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* 1. Obtener contrato */
        const contratoRes = await client.query(
            `SELECT id, fecha_fin, estado
             FROM contratos_alquiler
             WHERE id = $1`,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no existe");
        }

        const contrato = contratoRes.rows[0];

        /* 2. Validar que no esté finalizado */
        if (contrato.estado === "finalizado") {
            throw new Error("No se puede registrar devolución de un contrato finalizado");
        }

        /* 3. Validar que no tenga devolución previa */
        const devolucionExiste = await client.query(
            `SELECT id
             FROM devoluciones
             WHERE contrato_id = $1
             LIMIT 1`,
            [data.contrato_id]
        );

        if (devolucionExiste.rows.length > 0) {
            throw new Error("Este contrato ya tiene una devolución registrada");
        }

        /* 4. Calcular días de retraso */
        const fechaFin = new Date(contrato.fecha_fin);
        const fechaDev = new Date(data.fecha_devolucion);

        let dias_retraso = 0;

        if (fechaDev > fechaFin) {
            const diff = fechaDev.getTime() - fechaFin.getTime();
            dias_retraso = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        /* 5. Obtener activos del contrato */
        const activosRes = await client.query(
            `SELECT activo_id, cantidad, precio_diario
             FROM detalles_contrato
             WHERE contrato_id = $1`,
            [data.contrato_id]
        );

        if (activosRes.rows.length === 0) {
            throw new Error("El contrato no tiene activos asociados");
        }

        /* 6. Calcular penalidad */
        let penalidad_total = 0;

        if (dias_retraso > 0) {
            activosRes.rows.forEach((a) => {
                penalidad_total +=
                    dias_retraso *
                    Number(a.precio_diario) *
                    Number(a.cantidad);
            });
        }

        /* 7. Insertar devolución */
        const insertRes = await client.query(
            `INSERT INTO devoluciones
             (contrato_id, fecha_devolucion, dias_retraso, penalidad_total)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                data.contrato_id,
                data.fecha_devolucion,
                dias_retraso,
                penalidad_total
            ]
        );

        const devolucion = insertRes.rows[0];

        /* 8. Finalizar contrato y sumar penalidad al saldo pendiente */
        await client.query(
            `UPDATE contratos_alquiler
             SET estado = 'finalizado',
                 saldo_pendiente = saldo_pendiente + $2
             WHERE id = $1`,
            [
                data.contrato_id,
                penalidad_total
            ]
        );

        /* 9. Devolver stock */
        for (const a of activosRes.rows) {
            await client.query(
                `UPDATE activos
                 SET cantidad_total = cantidad_total + $1,
                     estado = 'disponible'
                 WHERE id = $2`,
                [
                    a.cantidad,
                    a.activo_id
                ]
            );

            await client.query(
                `INSERT INTO movimientos_inventario
                 (activo_id, tipo_movimiento, cantidad, motivo, referencia)
                 VALUES ($1, 'entrada', $2, $3, $4)`,
                [
                    a.activo_id,
                    a.cantidad,
                    "Devolución de contrato",
                    `Contrato ${data.contrato_id}`
                ]
            );
        }

        await client.query("COMMIT");

        return {
            ...devolucion,
            mensaje:
                penalidad_total > 0
                    ? "Devolución registrada con penalidad pendiente de cobro"
                    : "Devolución registrada sin penalidad"
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =========================
   LISTAR DEVOLUCIONES
========================= */
const listar = async () => {
    const res = await pool.query(`
        SELECT
            d.*,
            c.numero_contrato,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            cl.nombre AS cliente
        FROM devoluciones d
        JOIN contratos_alquiler c ON c.id = d.contrato_id
        JOIN clientes cl ON cl.id = c.cliente_id
        ORDER BY d.fecha_devolucion DESC
    `);

    return res.rows;
};

/* =========================
   OBTENER DEVOLUCIÓN POR ID
========================= */
const obtenerPorId = async (id) => {
    const res = await pool.query(`
        SELECT
            d.*,
            c.numero_contrato,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            cl.nombre AS cliente
        FROM devoluciones d
        JOIN contratos_alquiler c ON c.id = d.contrato_id
        JOIN clientes cl ON cl.id = c.cliente_id
        WHERE d.id = $1
    `, [id]);

    return res.rows[0];
};

module.exports = {
    registrar,
    listar,
    obtenerPorId
};