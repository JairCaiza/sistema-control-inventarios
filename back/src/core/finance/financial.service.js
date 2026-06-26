const { pool } = require("../../config/db");

/* =========================
   VALIDACIONES
========================= */

const validarMonto = (monto) => {
    const value = Number(monto);

    if (!value || value <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    return value;
};

const validarCuenta = async (client, cuenta_id) => {
    const res = await client.query(
        `SELECT id, saldo_actual
         FROM cuentas_financieras
         WHERE id = $1`,
        [cuenta_id]
    );

    if (res.rows.length === 0) {
        throw new Error("La cuenta financiera no existe");
    }

    return res.rows[0];
};

/* =========================
   CREAR TRANSACCIÓN BASE
========================= */

const crearTransaccion = async (
    {
        cuenta_id,
        tipo,
        monto,
        descripcion,
        fecha,
        origen_modulo,
        origen_id,
        obra_id = null,
        control_diario_id = null,
        referencia_id = null
    },
    clientParam = null
) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(monto);

        if (!["ingreso", "egreso"].includes(tipo)) {
            throw new Error("Tipo de transacción inválido");
        }

        const cuenta = await validarCuenta(client, cuenta_id);

        if (tipo === "egreso" && Number(cuenta.saldo_actual) < montoValidado) {
            throw new Error("Saldo insuficiente en la cuenta financiera");
        }

        const transaccionRes = await client.query(
            `INSERT INTO transacciones (
                cuenta_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                origen_modulo,
                origen_id,
                obra_id,
                control_diario_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`,
            [
                cuenta_id,
                tipo,
                montoValidado,
                descripcion || null,
                fecha || new Date(),
                referencia_id,
                origen_modulo || "manual",
                origen_id || null,
                obra_id,
                control_diario_id
            ]
        );

        if (tipo === "ingreso") {
            await client.query(
                `UPDATE cuentas_financieras
                 SET saldo_actual = saldo_actual + $1
                 WHERE id = $2`,
                [montoValidado, cuenta_id]
            );
        }

        if (tipo === "egreso") {
            await client.query(
                `UPDATE cuentas_financieras
                 SET saldo_actual = saldo_actual - $1
                 WHERE id = $2`,
                [montoValidado, cuenta_id]
            );
        }

        if (!external) await client.query("COMMIT");

        return transaccionRes.rows[0];

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   INGRESO MANUAL
========================= */

const registrarIngresoManual = async (data, client = null) => {
    return crearTransaccion(
        {
            cuenta_id: data.cuenta_id,
            tipo: "ingreso",
            monto: data.monto,
            descripcion: data.descripcion || "Ingreso manual",
            fecha: data.fecha,
            origen_modulo: "manual",
            origen_id: null,
            referencia_id: null
        },
        client
    );
};

/* =========================
   EGRESO MANUAL
========================= */

const registrarEgresoManual = async (data, client = null) => {
    return crearTransaccion(
        {
            cuenta_id: data.cuenta_id,
            tipo: "egreso",
            monto: data.monto,
            descripcion: data.descripcion || "Egreso manual",
            fecha: data.fecha,
            origen_modulo: "manual",
            origen_id: null,
            referencia_id: null
        },
        client
    );
};

/* =========================
   PAGO CONTRATO / ALQUILER
========================= */

const registrarPagoContrato = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        const contratoRes = await client.query(
            `SELECT id, numero_contrato
             FROM contratos_alquiler
             WHERE id = $1`,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("El contrato no existe");
        }

        const pagoRes = await client.query(
            `INSERT INTO pagos_contratos (
                contrato_id,
                cuenta_id,
                monto,
                fecha,
                metodo_pago,
                concepto,
                observaciones
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
                data.contrato_id,
                data.cuenta_id,
                montoValidado,
                data.fecha || new Date(),
                data.metodo_pago || "efectivo",
                data.concepto || "alquiler",
                data.observaciones || null
            ]
        );

        const pago = pagoRes.rows[0];

        const transaccion = await crearTransaccion(
            {
                cuenta_id: data.cuenta_id,
                tipo: "ingreso",
                monto: montoValidado,
                descripcion:
                    data.descripcion ||
                    `Pago contrato ${contratoRes.rows[0].numero_contrato}`,
                fecha: data.fecha,
                origen_modulo: "pagos_contratos",
                origen_id: pago.id,
                referencia_id: pago.id
            },
            client
        );

        if (!external) await client.query("COMMIT");

        return {
            pago,
            transaccion
        };

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   PAGO EMPLEADO
========================= */

const registrarPagoEmpleado = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        const empleadoRes = await client.query(
            `SELECT id, nombres, apellidos
             FROM empleados
             WHERE id = $1`,
            [data.empleado_id]
        );

        if (empleadoRes.rows.length === 0) {
            throw new Error("El empleado no existe");
        }

        const pagoRes = await client.query(
            `INSERT INTO pagos_empleados (
                empleado_id,
                obra_id,
                monto,
                fecha,
                descripcion
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                data.empleado_id,
                data.obra_id || null,
                montoValidado,
                data.fecha || new Date(),
                data.descripcion || "Pago empleado"
            ]
        );

        const pago = pagoRes.rows[0];

        const empleado = empleadoRes.rows[0];

        const transaccion = await crearTransaccion(
            {
                cuenta_id: data.cuenta_id,
                tipo: "egreso",
                monto: montoValidado,
                descripcion:
                    data.descripcion ||
                    `Pago empleado ${empleado.nombres} ${empleado.apellidos}`,
                fecha: data.fecha,
                origen_modulo: "pagos_empleados",
                origen_id: pago.id,
                referencia_id: pago.id,
                obra_id: data.obra_id || null
            },
            client
        );

        if (!external) await client.query("COMMIT");

        return {
            pago,
            transaccion
        };

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   GASTO OBRA
========================= */

const registrarGastoObra = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        const gastoRes = await client.query(
            `INSERT INTO gastos_obra (
                obra_id,
                control_diario_id,
                tipo,
                descripcion,
                monto,
                fecha
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [
                data.obra_id,
                data.control_diario_id || null,
                data.tipo || "general",
                data.descripcion,
                montoValidado,
                data.fecha || new Date()
            ]
        );

        const gasto = gastoRes.rows[0];

        const transaccion = await crearTransaccion(
            {
                cuenta_id: data.cuenta_id,
                tipo: "egreso",
                monto: montoValidado,
                descripcion: data.descripcion || "Gasto de obra",
                fecha: data.fecha,
                origen_modulo: "gastos_obra",
                origen_id: gasto.id,
                referencia_id: gasto.id,
                obra_id: data.obra_id,
                control_diario_id: data.control_diario_id || null
            },
            client
        );

        if (!external) await client.query("COMMIT");

        return {
            gasto,
            transaccion
        };

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   APORTE SOCIO
========================= */

const registrarAporteSocio = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        const aporteRes = await client.query(
            `INSERT INTO aportes_socios (
                socio_id,
                monto,
                fecha
            )
            VALUES ($1,$2,$3)
            RETURNING *`,
            [
                data.socio_id,
                montoValidado,
                data.fecha || new Date()
            ]
        );

        const aporte = aporteRes.rows[0];

        const transaccion = await crearTransaccion(
            {
                cuenta_id: data.cuenta_id,
                tipo: "ingreso",
                monto: montoValidado,
                descripcion: data.descripcion || "Aporte de socio",
                fecha: data.fecha,
                origen_modulo: "aportes_socios",
                origen_id: aporte.id,
                referencia_id: aporte.id
            },
            client
        );

        if (!external) await client.query("COMMIT");

        return {
            aporte,
            transaccion
        };

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   DISTRIBUCIÓN UTILIDADES
========================= */

const registrarDistribucionUtilidad = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        const distribucionRes = await client.query(
            `INSERT INTO distribuciones_utilidades (
                socio_id,
                periodo,
                monto,
                fecha_pago
            )
            VALUES ($1,$2,$3,$4)
            RETURNING *`,
            [
                data.socio_id,
                data.periodo,
                montoValidado,
                data.fecha_pago || new Date()
            ]
        );

        const distribucion = distribucionRes.rows[0];

        const transaccion = await crearTransaccion(
            {
                cuenta_id: data.cuenta_id,
                tipo: "egreso",
                monto: montoValidado,
                descripcion:
                    data.descripcion ||
                    `Distribución de utilidad periodo ${data.periodo}`,
                fecha: data.fecha_pago,
                origen_modulo: "distribuciones_utilidades",
                origen_id: distribucion.id,
                referencia_id: distribucion.id
            },
            client
        );

        if (!external) await client.query("COMMIT");

        return {
            distribucion,
            transaccion
        };

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

/* =========================
   TRANSFERENCIA ENTRE CUENTAS
========================= */

const registrarTransferencia = async (data, clientParam = null) => {
    const client = clientParam || await pool.connect();
    const external = !!clientParam;

    try {
        if (!external) await client.query("BEGIN");

        const montoValidado = validarMonto(data.monto);

        if (data.cuenta_origen_id === data.cuenta_destino_id) {
            throw new Error("La cuenta origen y destino no pueden ser iguales");
        }

        const cuentaOrigen = await validarCuenta(client, data.cuenta_origen_id);
        await validarCuenta(client, data.cuenta_destino_id);

        if (Number(cuentaOrigen.saldo_actual) < montoValidado) {
            throw new Error("Saldo insuficiente en la cuenta origen");
        }

        const transferenciaRes = await client.query(
            `INSERT INTO transferencias (
                cuenta_origen_id,
                cuenta_destino_id,
                monto,
                fecha,
                descripcion
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                data.cuenta_origen_id,
                data.cuenta_destino_id,
                montoValidado,
                data.fecha || new Date(),
                data.descripcion || "Transferencia entre cuentas"
            ]
        );

        await client.query(
            `UPDATE cuentas_financieras
             SET saldo_actual = saldo_actual - $1
             WHERE id = $2`,
            [montoValidado, data.cuenta_origen_id]
        );

        await client.query(
            `UPDATE cuentas_financieras
             SET saldo_actual = saldo_actual + $1
             WHERE id = $2`,
            [montoValidado, data.cuenta_destino_id]
        );

        if (!external) await client.query("COMMIT");

        return transferenciaRes.rows[0];

    } catch (error) {
        if (!external) await client.query("ROLLBACK");
        throw error;
    } finally {
        if (!external) client.release();
    }
};

module.exports = {
    crearTransaccion,

    registrarIngresoManual,
    registrarEgresoManual,

    registrarPagoContrato,
    registrarPagoEmpleado,
    registrarGastoObra,
    registrarAporteSocio,
    registrarDistribucionUtilidad,
    registrarTransferencia
};