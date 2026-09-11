const { pool } = require("../../config/db");

/* =====================================================
   REGISTRAR INGRESO
===================================================== */

const registrarIngreso = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* 1. Obtener y bloquear la cuenta */
        const cuentaRes = await client.query(
            `SELECT
                id,
                nombre,
                tipo,
                saldo_actual,
                activo
             FROM cuentas_financieras
             WHERE id = $1
             FOR UPDATE`,
            [data.cuenta_id]
        );

        if (cuentaRes.rows.length === 0) {
            const error = new Error(
                "La cuenta financiera no existe"
            );

            error.statusCode = 404;
            throw error;
        }

        const cuenta = cuentaRes.rows[0];

        if (!cuenta.activo) {
            const error = new Error(
                "No se pueden registrar ingresos en una cuenta inactiva"
            );

            error.statusCode = 400;
            throw error;
        }

        const monto = Number(data.monto);

        /* 2. Registrar la transacción */
        const transaccionRes = await client.query(
            `INSERT INTO transacciones
            (
                cuenta_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                obra_id,
                control_diario_id,
                origen_modulo,
                origen_id
            )
            VALUES
            (
                $1,
                'ingreso',
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *`,
            [
                data.cuenta_id,
                monto,
                data.descripcion.trim(),
                data.fecha,
                data.referencia_id || null,
                data.obra_id || null,
                data.control_diario_id || null,
                data.origen_modulo || "manual",
                data.origen_id || null
            ]
        );

        /* 3. Aumentar saldo */
        const cuentaActualizadaRes = await client.query(
            `UPDATE cuentas_financieras
             SET
                saldo_actual = saldo_actual + $1,
                fecha_actualizacion = NOW()
             WHERE id = $2
             RETURNING
                id,
                nombre,
                tipo,
                saldo_actual,
                activo`,
            [
                monto,
                data.cuenta_id
            ]
        );

        await client.query("COMMIT");

        return {
            transaccion: transaccionRes.rows[0],
            cuenta: cuentaActualizadaRes.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   LISTAR INGRESOS
===================================================== */

const listarIngresos = async ({
    cuenta_id,
    fecha_inicio,
    fecha_fin
} = {}) => {
    const condiciones = [`t.tipo = 'ingreso'`];
    const valores = [];

    if (cuenta_id) {
        valores.push(cuenta_id);

        condiciones.push(
            `t.cuenta_id = $${valores.length}`
        );
    }

    if (fecha_inicio) {
        valores.push(fecha_inicio);

        condiciones.push(
            `t.fecha >= $${valores.length}`
        );
    }

    if (fecha_fin) {
        valores.push(fecha_fin);

        condiciones.push(
            `t.fecha <= $${valores.length}`
        );
    }

    const resultado = await pool.query(
        `SELECT
            t.id,
            t.cuenta_id,
            t.tipo,
            t.monto,
            t.descripcion,
            t.fecha,
            t.referencia_id,
            t.obra_id,
            t.control_diario_id,
            t.origen_modulo,
            t.origen_id,
            t.fecha_creacion,

            cf.nombre AS cuenta_nombre,
            cf.tipo AS cuenta_tipo

         FROM transacciones t

         JOIN cuentas_financieras cf
           ON cf.id = t.cuenta_id

         WHERE ${condiciones.join(" AND ")}

         ORDER BY
            t.fecha DESC,
            t.fecha_creacion DESC`,
        valores
    );

    return resultado.rows;
};

/* =====================================================
   REGISTRAR EGRESO
===================================================== */

const registrarEgreso = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* 1. Obtener y bloquear la cuenta */
        const cuentaRes = await client.query(
            `SELECT
                id,
                nombre,
                tipo,
                saldo_actual,
                activo
             FROM cuentas_financieras
             WHERE id = $1
             FOR UPDATE`,
            [data.cuenta_id]
        );

        if (cuentaRes.rows.length === 0) {
            const error = new Error(
                "La cuenta financiera no existe"
            );

            error.statusCode = 404;
            throw error;
        }

        const cuenta = cuentaRes.rows[0];

        if (!cuenta.activo) {
            const error = new Error(
                "No se pueden registrar egresos en una cuenta inactiva"
            );

            error.statusCode = 400;
            throw error;
        }

        const monto = Number(data.monto);
        const saldoActual = Number(
            cuenta.saldo_actual
        );

        /* 2. Validar saldo suficiente */
        if (saldoActual < monto) {
            const error = new Error(
                `Saldo insuficiente. La cuenta dispone de $${saldoActual.toFixed(
                    2
                )}`
            );

            error.statusCode = 400;
            throw error;
        }

        /* 3. Registrar la transacción */
        const transaccionRes = await client.query(
            `INSERT INTO transacciones
            (
                cuenta_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                obra_id,
                control_diario_id,
                origen_modulo,
                origen_id
            )
            VALUES
            (
                $1,
                'egreso',
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *`,
            [
                data.cuenta_id,
                monto,
                data.descripcion.trim(),
                data.fecha,
                data.referencia_id || null,
                data.obra_id || null,
                data.control_diario_id || null,
                data.origen_modulo || "manual",
                data.origen_id || null
            ]
        );

        /* 4. Disminuir saldo */
        const cuentaActualizadaRes = await client.query(
            `UPDATE cuentas_financieras
             SET
                saldo_actual = saldo_actual - $1,
                fecha_actualizacion = NOW()
             WHERE id = $2
             RETURNING
                id,
                nombre,
                tipo,
                saldo_actual,
                activo`,
            [
                monto,
                data.cuenta_id
            ]
        );

        await client.query("COMMIT");

        return {
            transaccion: transaccionRes.rows[0],
            cuenta: cuentaActualizadaRes.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   LISTAR EGRESOS
===================================================== */

const listarEgresos = async ({
    cuenta_id,
    fecha_inicio,
    fecha_fin
} = {}) => {
    const condiciones = [`t.tipo = 'egreso'`];
    const valores = [];

    if (cuenta_id) {
        valores.push(cuenta_id);

        condiciones.push(
            `t.cuenta_id = $${valores.length}`
        );
    }

    if (fecha_inicio) {
        valores.push(fecha_inicio);

        condiciones.push(
            `t.fecha >= $${valores.length}`
        );
    }

    if (fecha_fin) {
        valores.push(fecha_fin);

        condiciones.push(
            `t.fecha <= $${valores.length}`
        );
    }

    const resultado = await pool.query(
        `SELECT
            t.id,
            t.cuenta_id,
            t.tipo,
            t.monto,
            t.descripcion,
            t.fecha,
            t.referencia_id,
            t.obra_id,
            t.control_diario_id,
            t.origen_modulo,
            t.origen_id,
            t.fecha_creacion,

            cf.nombre AS cuenta_nombre,
            cf.tipo AS cuenta_tipo

         FROM transacciones t

         JOIN cuentas_financieras cf
           ON cf.id = t.cuenta_id

         WHERE ${condiciones.join(" AND ")}

         ORDER BY
            t.fecha DESC,
            t.fecha_creacion DESC`,
        valores
    );

    return resultado.rows;
};

/* =====================================================
   REGISTRAR TRANSFERENCIA
===================================================== */

const registrarTransferencia = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const cuentaOrigenId = data.cuenta_id;
        const cuentaDestinoId =
            data.cuenta_destino_id;

        /* 1. Validar que las cuentas sean diferentes */
        if (cuentaOrigenId === cuentaDestinoId) {
            const error = new Error(
                "La cuenta de origen y la cuenta de destino deben ser diferentes"
            );

            error.statusCode = 400;
            throw error;
        }

        /*
         * 2. Obtener y bloquear las dos cuentas.
         *
         * Se utiliza ORDER BY id para bloquearlas siempre
         * en el mismo orden y reducir el riesgo de deadlocks.
         */
        const cuentasRes = await client.query(
            `SELECT
                id,
                nombre,
                tipo,
                saldo_actual,
                activo
             FROM cuentas_financieras
             WHERE id = ANY($1::uuid[])
             ORDER BY id
             FOR UPDATE`,
            [[cuentaOrigenId, cuentaDestinoId]]
        );

        if (cuentasRes.rows.length !== 2) {
            const idsEncontrados = cuentasRes.rows.map(
                (cuenta) => cuenta.id
            );

            if (
                !idsEncontrados.includes(cuentaOrigenId)
            ) {
                const error = new Error(
                    "La cuenta de origen no existe"
                );

                error.statusCode = 404;
                throw error;
            }

            const error = new Error(
                "La cuenta de destino no existe"
            );

            error.statusCode = 404;
            throw error;
        }

        const cuentaOrigen =
            cuentasRes.rows.find(
                (cuenta) =>
                    cuenta.id === cuentaOrigenId
            );

        const cuentaDestino =
            cuentasRes.rows.find(
                (cuenta) =>
                    cuenta.id === cuentaDestinoId
            );

        if (!cuentaOrigen) {
            const error = new Error(
                "La cuenta de origen no existe"
            );

            error.statusCode = 404;
            throw error;
        }

        if (!cuentaDestino) {
            const error = new Error(
                "La cuenta de destino no existe"
            );

            error.statusCode = 404;
            throw error;
        }

        /* 3. Validar que ambas cuentas estén activas */
        if (!cuentaOrigen.activo) {
            const error = new Error(
                "No se puede transferir dinero desde una cuenta inactiva"
            );

            error.statusCode = 400;
            throw error;
        }

        if (!cuentaDestino.activo) {
            const error = new Error(
                "No se puede transferir dinero hacia una cuenta inactiva"
            );

            error.statusCode = 400;
            throw error;
        }

        const monto = Number(data.monto);
        const saldoOrigen = Number(
            cuentaOrigen.saldo_actual
        );

        /* 4. Validar saldo suficiente */
        if (saldoOrigen < monto) {
            const error = new Error(
                `Saldo insuficiente. La cuenta de origen dispone de $${saldoOrigen.toFixed(
                    2
                )}`
            );

            error.statusCode = 400;
            throw error;
        }

        /* 5. Registrar la transferencia */
        const transaccionRes = await client.query(
            `INSERT INTO transacciones
            (
                cuenta_id,
                cuenta_destino_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                origen_modulo,
                origen_id
            )
            VALUES
            (
                $1,
                $2,
                'transferencia',
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )
            RETURNING *`,
            [
                cuentaOrigenId,
                cuentaDestinoId,
                monto,
                data.descripcion.trim(),
                data.fecha,
                data.referencia_id || null,
                data.origen_modulo ||
                "transferencia_manual",
                data.origen_id || null
            ]
        );

        /* 6. Disminuir saldo de la cuenta origen */
        const cuentaOrigenActualizadaRes =
            await client.query(
                `UPDATE cuentas_financieras
                 SET
                    saldo_actual = saldo_actual - $1,
                    fecha_actualizacion = NOW()
                 WHERE id = $2
                 RETURNING
                    id,
                    nombre,
                    tipo,
                    saldo_actual,
                    activo`,
                [
                    monto,
                    cuentaOrigenId
                ]
            );

        /* 7. Aumentar saldo de la cuenta destino */
        const cuentaDestinoActualizadaRes =
            await client.query(
                `UPDATE cuentas_financieras
                 SET
                    saldo_actual = saldo_actual + $1,
                    fecha_actualizacion = NOW()
                 WHERE id = $2
                 RETURNING
                    id,
                    nombre,
                    tipo,
                    saldo_actual,
                    activo`,
                [
                    monto,
                    cuentaDestinoId
                ]
            );

        await client.query("COMMIT");

        return {
            transaccion: transaccionRes.rows[0],
            cuenta_origen:
                cuentaOrigenActualizadaRes.rows[0],
            cuenta_destino:
                cuentaDestinoActualizadaRes.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   LISTAR TRANSFERENCIAS
===================================================== */

const listarTransferencias = async ({
    cuenta_id,
    cuenta_origen_id,
    cuenta_destino_id,
    fecha_inicio,
    fecha_fin
} = {}) => {
    const condiciones = [
        `t.tipo = 'transferencia'`
    ];

    const valores = [];

    /*
     * cuenta_id funciona como filtro general:
     * muestra transferencias donde la cuenta participó
     * como origen o como destino.
     */
    if (cuenta_id) {
        valores.push(cuenta_id);

        condiciones.push(
            `(t.cuenta_id = $${valores.length}
              OR
              t.cuenta_destino_id = $${valores.length})`
        );
    }

    if (cuenta_origen_id) {
        valores.push(cuenta_origen_id);

        condiciones.push(
            `t.cuenta_id = $${valores.length}`
        );
    }

    if (cuenta_destino_id) {
        valores.push(cuenta_destino_id);

        condiciones.push(
            `t.cuenta_destino_id = $${valores.length}`
        );
    }

    if (fecha_inicio) {
        valores.push(fecha_inicio);

        condiciones.push(
            `t.fecha >= $${valores.length}`
        );
    }

    if (fecha_fin) {
        valores.push(fecha_fin);

        condiciones.push(
            `t.fecha <= $${valores.length}`
        );
    }

    const resultado = await pool.query(
        `SELECT
            t.id,
            t.cuenta_id,
            t.cuenta_destino_id,
            t.tipo,
            t.monto,
            t.descripcion,
            t.fecha,
            t.referencia_id,
            t.origen_modulo,
            t.origen_id,
            t.fecha_creacion,

            cuenta_origen.nombre
                AS cuenta_origen_nombre,

            cuenta_origen.tipo
                AS cuenta_origen_tipo,

            cuenta_destino.nombre
                AS cuenta_destino_nombre,

            cuenta_destino.tipo
                AS cuenta_destino_tipo

         FROM transacciones t

         JOIN cuentas_financieras cuenta_origen
           ON cuenta_origen.id = t.cuenta_id

         JOIN cuentas_financieras cuenta_destino
           ON cuenta_destino.id =
              t.cuenta_destino_id

         WHERE ${condiciones.join(" AND ")}

         ORDER BY
            t.fecha DESC,
            t.fecha_creacion DESC`,
        valores
    );

    return resultado.rows;
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    registrarIngreso,
    listarIngresos,
    registrarEgreso,
    listarEgresos,
    registrarTransferencia,
    listarTransferencias
};