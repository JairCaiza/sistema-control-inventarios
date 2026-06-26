const { pool } = require("../../../config/db");
const financialService = require("../../../core/finance/financial.service");

/* =========================
   REGISTRAR PAGO CONTRATO
========================= */
const registrarPago = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const contratoRes = await client.query(
            `SELECT id, numero_contrato, total, pagado, saldo_pendiente
             FROM contratos_alquiler
             WHERE id = $1`,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoRes.rows[0];

        if (Number(data.monto) > Number(contrato.saldo_pendiente || contrato.total)) {
            throw new Error("El monto no puede ser mayor al saldo pendiente");
        }

        const resultado = await financialService.registrarPagoContrato(
            {
                contrato_id: data.contrato_id,
                cuenta_id: data.cuenta_id,
                monto: data.monto,
                metodo_pago: data.metodo_pago,
                concepto: data.concepto || "alquiler",
                observaciones: data.observaciones,
                descripcion: `Pago contrato ${contrato.numero_contrato}`
            },
            client
        );

        const nuevoPagado = Number(contrato.pagado || 0) + Number(data.monto);
        const nuevoSaldo = Math.max(Number(contrato.total || 0) - nuevoPagado, 0);

        await client.query(
            `UPDATE contratos_alquiler
             SET pagado = $2,
                 saldo_pendiente = $3
             WHERE id = $1`,
            [data.contrato_id, nuevoPagado, nuevoSaldo]
        );

        await client.query("COMMIT");

        return {
            contrato_id: data.contrato_id,
            total: Number(contrato.total || 0),
            pagado: nuevoPagado,
            saldo_pendiente: nuevoSaldo,
            pago: resultado.pago,
            transaccion: resultado.transaccion
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =========================
   LISTAR PAGOS DE CONTRATO
========================= */
const listarPorContrato = async (contrato_id) => {
    const result = await pool.query(
        `SELECT
            pc.id,
            pc.contrato_id,
            pc.cuenta_id,
            cf.nombre AS cuenta,
            pc.monto,
            pc.fecha,
            pc.metodo_pago,
            pc.concepto,
            pc.observaciones,
            pc.fecha_creacion
         FROM pagos_contratos pc
         JOIN cuentas_financieras cf ON cf.id = pc.cuenta_id
         WHERE pc.contrato_id = $1
         ORDER BY pc.fecha DESC, pc.fecha_creacion DESC`,
        [contrato_id]
    );

    return result.rows;
};

/* =========================
   RESUMEN DE PAGOS
========================= */
const resumenContrato = async (contrato_id) => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.numero_contrato,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            COALESCE(SUM(pc.monto),0) AS total_pagos
         FROM contratos_alquiler c
         LEFT JOIN pagos_contratos pc ON pc.contrato_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`,
        [contrato_id]
    );

    if (result.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    return result.rows[0];
};

module.exports = {
    registrarPago,
    listarPorContrato,
    resumenContrato
};