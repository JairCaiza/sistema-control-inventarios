const { pool } = require("../../config/db");

/* =========================
   CREAR CONTRATO
========================= */
const crearContrato = async (data) => {
    const result = await pool.query(
        `INSERT INTO contratos_alquiler
        (
            numero_contrato,
            cliente_id,
            fecha_inicio,
            fecha_fin,
            estado,
            total,
            pagado,
            saldo_pendiente,
            observaciones
        )
        VALUES ($1,$2,$3,$4,$5,0,0,0,$6)
        RETURNING *`,
        [
            data.numero_contrato,
            data.cliente_id,
            data.fecha_inicio,
            data.fecha_fin,
            data.estado || "activo",
            data.observaciones || null
        ]
    );

    return result.rows[0];
};

/* =========================
   LISTAR CONTRATOS
========================= */
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
            c.pagado,
            c.saldo_pendiente,
            c.fecha_creacion
        FROM contratos_alquiler c
        JOIN clientes cl ON cl.id = c.cliente_id
        ORDER BY c.fecha_creacion DESC
    `);

    return result.rows;
};

/* =========================
   AGREGAR ACTIVO A CONTRATO
========================= */
const agregarActivoContrato = async (contrato_id, data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const contratoRes = await client.query(
            `SELECT id, pagado
             FROM contratos_alquiler
             WHERE id = $1`,
            [contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const pagadoActual = Number(contratoRes.rows[0].pagado || 0);

        const activoResult = await client.query(
            `SELECT cantidad_total
             FROM activos
             WHERE id = $1`,
            [data.activo_id]
        );

        if (activoResult.rows.length === 0) {
            throw new Error("El activo no existe");
        }

        const stockActual = Number(activoResult.rows[0].cantidad_total);

        if (Number(data.cantidad) > stockActual) {
            throw new Error("Stock insuficiente");
        }

        const subtotal = Number(data.cantidad) * Number(data.precio_diario);

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

        await client.query(
            `UPDATE activos
             SET cantidad_total = cantidad_total - $1
             WHERE id = $2`,
            [data.cantidad, data.activo_id]
        );

        await client.query(
            `INSERT INTO movimientos_inventario
            (activo_id, tipo_movimiento, cantidad, motivo, referencia)
            VALUES ($1,'salida',$2,$3,$4)`,
            [
                data.activo_id,
                data.cantidad,
                "Salida por contrato de alquiler",
                `Contrato ${contrato_id}`
            ]
        );

        const totalRes = await client.query(
            `SELECT COALESCE(SUM(subtotal),0) AS total
             FROM detalles_contrato
             WHERE contrato_id = $1`,
            [contrato_id]
        );

        const nuevoTotal = Number(totalRes.rows[0].total);
        const nuevoSaldoPendiente = Math.max(nuevoTotal - pagadoActual, 0);

        await client.query(
            `UPDATE contratos_alquiler
             SET
                total = $2,
                saldo_pendiente = $3
             WHERE id = $1`,
            [contrato_id, nuevoTotal, nuevoSaldoPendiente]
        );

        await client.query("COMMIT");

        return {
            contrato_id,
            total: nuevoTotal,
            pagado: pagadoActual,
            saldo_pendiente: nuevoSaldoPendiente
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =========================
   OBTENER CONTRATO POR ID
========================= */
const obtenerContratoPorId = async (id) => {
    const contratoResult = await pool.query(
        `SELECT
            c.id,
            c.numero_contrato,
            cl.nombre AS cliente,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            c.observaciones
         FROM contratos_alquiler c
         JOIN clientes cl ON cl.id = c.cliente_id
         WHERE c.id = $1`,
        [id]
    );

    if (contratoResult.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    const contrato = contratoResult.rows[0];

    const activosResult = await pool.query(
        `SELECT
            a.id,
            a.codigo,
            a.nombre,
            dc.cantidad,
            dc.precio_diario AS precio_dia,
            dc.subtotal
         FROM detalles_contrato dc
         JOIN activos a ON dc.activo_id = a.id
         WHERE dc.contrato_id = $1`,
        [id]
    );

    const pagosResult = await pool.query(
        `SELECT
            pc.id,
            pc.monto,
            pc.fecha,
            pc.metodo_pago,
            pc.concepto,
            pc.observaciones,
            cf.nombre AS cuenta
         FROM pagos_contratos pc
         JOIN cuentas_financieras cf ON cf.id = pc.cuenta_id
         WHERE pc.contrato_id = $1
         ORDER BY pc.fecha DESC`,
        [id]
    );

    contrato.activos = activosResult.rows;
    contrato.pagos = pagosResult.rows;

    return contrato;
};

module.exports = {
    crearContrato,
    listarContratos,
    agregarActivoContrato,
    obtenerContratoPorId
};