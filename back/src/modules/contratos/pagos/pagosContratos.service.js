const { pool } = require("../../../config/db");
const financialService = require("../../../core/finance/financial.service");

/* =========================
   REGISTRAR PAGO CONTRATO
========================= */
const registrarPago = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * Bloquea el contrato mientras se procesa el pago
         * para evitar pagos simultáneos inconsistentes.
         */
        const contratoRes = await client.query(
            `SELECT
                id,
                numero_contrato,
                estado,
                total,
                pagado,
                saldo_pendiente
             FROM contratos_alquiler
             WHERE id = $1
             FOR UPDATE`,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoRes.rows[0];

        const montoPago = Number(data.monto);
        const totalContrato = Number(contrato.total || 0);
        const pagadoActual = Number(contrato.pagado || 0);
        const saldoActual = Number(contrato.saldo_pendiente || 0);

        /* =========================
           VALIDACIONES
        ========================= */

        if (!Number.isFinite(montoPago) || montoPago <= 0) {
            throw new Error("El monto debe ser mayor a 0");
        }

        if (!data.cuenta_id) {
            throw new Error("Debe seleccionar una cuenta financiera");
        }

        if (saldoActual <= 0) {
            throw new Error("El contrato no tiene saldo pendiente");
        }

        if (montoPago > saldoActual) {
            throw new Error(
                `El monto no puede ser mayor al saldo pendiente de ${saldoActual.toFixed(
                    2
                )}`
            );
        }

        /*
         * Guarda el pago, genera la transacción financiera
         * y aumenta el saldo de la cuenta seleccionada.
         */
        const resultado = await financialService.registrarPagoContrato(
            {
                contrato_id: data.contrato_id,
                cuenta_id: data.cuenta_id,
                monto: montoPago,
                fecha: data.fecha,
                metodo_pago: data.metodo_pago || "efectivo",
                concepto: data.concepto || "alquiler",
                observaciones: data.observaciones || null,
                descripcion:
                    data.descripcion ||
                    `Pago contrato ${contrato.numero_contrato}`
            },
            client
        );

        /*
         * Se descuenta el pago directamente del saldo pendiente.
         *
         * Ejemplo:
         * saldo actual: 920
         * pago: 100
         * nuevo saldo: 820
         */
        const nuevoPagado = pagadoActual + montoPago;
        const nuevoSaldo = Math.max(saldoActual - montoPago, 0);

        /*
         * RETURNING devuelve los valores que PostgreSQL
         * realmente guardó.
         */
        const contratoActualizadoRes = await client.query(
            `UPDATE contratos_alquiler
             SET
                pagado = $2,
                saldo_pendiente = $3
             WHERE id = $1
             RETURNING
                id,
                numero_contrato,
                total,
                pagado,
                saldo_pendiente,
                estado`,
            [
                data.contrato_id,
                nuevoPagado,
                nuevoSaldo
            ]
        );

        const contratoActualizado = contratoActualizadoRes.rows[0];

        await client.query("COMMIT");

        return {
            contrato_id: contratoActualizado.id,
            numero_contrato: contratoActualizado.numero_contrato,
            total: Number(contratoActualizado.total),
            pagado: Number(contratoActualizado.pagado),
            saldo_pendiente: Number(
                contratoActualizado.saldo_pendiente
            ),
            estado: contratoActualizado.estado,
            pago: resultado.pago,
            transaccion: resultado.transaccion,
            mensaje:
                Number(contratoActualizado.saldo_pendiente) === 0
                    ? "Pago registrado. El contrato no tiene saldo pendiente"
                    : "Pago registrado correctamente"
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
    const contratoRes = await pool.query(
        `SELECT id
         FROM contratos_alquiler
         WHERE id = $1`,
        [contrato_id]
    );

    if (contratoRes.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

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
         JOIN cuentas_financieras cf
            ON cf.id = pc.cuenta_id
         WHERE pc.contrato_id = $1
         ORDER BY
            pc.fecha DESC,
            pc.fecha_creacion DESC`,
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
            c.estado,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            COUNT(pc.id)::INTEGER AS cantidad_pagos,
            COALESCE(SUM(pc.monto), 0) AS total_pagos
         FROM contratos_alquiler c
         LEFT JOIN pagos_contratos pc
            ON pc.contrato_id = c.id
         WHERE c.id = $1
         GROUP BY
            c.id,
            c.numero_contrato,
            c.estado,
            c.total,
            c.pagado,
            c.saldo_pendiente`,
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