const { pool } = require("../../config/db");

/* =====================================================
   UTILIDAD: CONVERTIR Y VALIDAR NÚMEROS
===================================================== */
const convertirNumero = (valor, nombreCampo) => {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        throw new Error(`${nombreCampo} no es un número válido`);
    }

    return numero;
};

/* =====================================================
   CREAR CONTRATO
===================================================== */
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
        VALUES ($1, $2, $3, $4, $5, 0, 0, 0, $6)
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

/* =====================================================
   LISTAR CONTRATOS
===================================================== */
const listarContratos = async () => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.numero_contrato,
            c.cliente_id,
            cl.nombre AS cliente,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            c.observaciones,
            c.fecha_creacion,
            GREATEST(
                c.fecha_fin::date - c.fecha_inicio::date,
                1
            ) AS dias_contrato
        FROM contratos_alquiler c
        INNER JOIN clientes cl
            ON cl.id = c.cliente_id
        ORDER BY c.fecha_creacion DESC`
    );

    return result.rows;
};

/* =====================================================
   AGREGAR ACTIVO A CONTRATO
===================================================== */
const agregarActivoContrato = async (contratoId, data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /* -------------------------------------------------
           1. Obtener y bloquear el contrato
        ------------------------------------------------- */
        const contratoResult = await client.query(
            `SELECT
                id,
                numero_contrato,
                fecha_inicio,
                fecha_fin,
                estado,
                total,
                pagado,
                saldo_pendiente,
                GREATEST(
                    fecha_fin::date - fecha_inicio::date,
                    1
                ) AS dias_contrato
            FROM contratos_alquiler
            WHERE id = $1
            FOR UPDATE`,
            [contratoId]
        );

        if (contratoResult.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoResult.rows[0];

        if (contrato.estado !== "activo") {
            throw new Error(
                "Solo se pueden agregar activos a contratos activos"
            );
        }

        const cantidad = convertirNumero(
            data.cantidad,
            "La cantidad"
        );

        const precioDiario = convertirNumero(
            data.precio_diario,
            "El precio diario"
        );

        const diasContrato = convertirNumero(
            contrato.dias_contrato,
            "La duración del contrato"
        );

        const pagadoActual = convertirNumero(
            contrato.pagado || 0,
            "El valor pagado"
        );

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error(
                "La cantidad debe ser un número entero mayor que cero"
            );
        }

        if (precioDiario <= 0) {
            throw new Error(
                "El precio diario debe ser mayor que cero"
            );
        }

        /* -------------------------------------------------
           2. Obtener y bloquear el activo
        ------------------------------------------------- */
        const activoResult = await client.query(
            `SELECT
                id,
                codigo,
                nombre,
                cantidad_total
            FROM activos
            WHERE id = $1
            FOR UPDATE`,
            [data.activo_id]
        );

        if (activoResult.rows.length === 0) {
            throw new Error("El activo no existe");
        }

        const activo = activoResult.rows[0];

        const stockActual = convertirNumero(
            activo.cantidad_total,
            "El stock disponible"
        );

        if (cantidad > stockActual) {
            throw new Error(
                `Stock insuficiente para ${activo.nombre}. ` +
                `Disponible: ${stockActual}`
            );
        }

        /* -------------------------------------------------
           3. Calcular subtotal del activo
           
           cantidad × precio diario × días del contrato
        ------------------------------------------------- */
        const subtotal = Number(
            (
                cantidad *
                precioDiario *
                diasContrato
            ).toFixed(2)
        );
        console.log("==================================");
        console.log("CÁLCULO DEL ALQUILER");
        console.log({
            contratoId,
            cantidad,
            precioDiario,
            diasContrato,
            subtotal
        });
        console.log("==================================");


        /* -------------------------------------------------
           4. Insertar detalle del contrato
        ------------------------------------------------- */
        const detalleResult = await client.query(
            `INSERT INTO detalles_contrato
            (
                contrato_id,
                activo_id,
                cantidad,
                precio_diario,
                subtotal
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                contratoId,
                data.activo_id,
                cantidad,
                precioDiario,
                subtotal
            ]
        );

        /* -------------------------------------------------
           5. Descontar stock
        ------------------------------------------------- */
        await client.query(
            `UPDATE activos
            SET cantidad_total = cantidad_total - $1
            WHERE id = $2`,
            [
                cantidad,
                data.activo_id
            ]
        );

        /* -------------------------------------------------
           6. Registrar movimiento de inventario
        ------------------------------------------------- */
        await client.query(
            `INSERT INTO movimientos_inventario
            (
                activo_id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia
            )
            VALUES ($1, 'salida', $2, $3, $4)`,
            [
                data.activo_id,
                cantidad,
                "Salida por contrato de alquiler",
                `Contrato ${contrato.numero_contrato || contratoId}`
            ]
        );

        /* -------------------------------------------------
           7. Recalcular total del contrato
        ------------------------------------------------- */
        const totalResult = await client.query(
            `SELECT
                COALESCE(SUM(subtotal), 0) AS total
            FROM detalles_contrato
            WHERE contrato_id = $1`,
            [contratoId]
        );

        const nuevoTotal = Number(
            Number(totalResult.rows[0].total || 0).toFixed(2)
        );

        /*
         * En esta etapa solamente se considera el alquiler.
         * Las penalidades se sumarán posteriormente desde
         * el proceso de devolución.
         */
        const nuevoSaldoPendiente = Number(
            Math.max(
                nuevoTotal - pagadoActual,
                0
            ).toFixed(2)
        );

        /* -------------------------------------------------
           8. Actualizar resumen financiero del contrato
        ------------------------------------------------- */
        const contratoActualizadoResult = await client.query(
            `UPDATE contratos_alquiler
            SET
                total = $2,
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
                contratoId,
                nuevoTotal,
                nuevoSaldoPendiente
            ]
        );

        await client.query("COMMIT");

        return {
            contrato: contratoActualizadoResult.rows[0],

            detalle: {
                ...detalleResult.rows[0],
                activo: activo.nombre,
                codigo: activo.codigo,
                dias: diasContrato
            },

            calculo: {
                cantidad,
                precio_diario: precioDiario,
                dias: diasContrato,
                subtotal
            }
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/* =====================================================
   OBTENER CONTRATO POR ID
===================================================== */
const obtenerContratoPorId = async (id) => {
    const contratoResult = await pool.query(
        `SELECT
            c.id,
            c.numero_contrato,
            c.cliente_id,
            cl.nombre AS cliente,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.total,
            c.pagado,
            c.saldo_pendiente,
            c.observaciones,
            c.fecha_creacion,
            GREATEST(
                c.fecha_fin::date - c.fecha_inicio::date,
                1
            ) AS dias_contrato
        FROM contratos_alquiler c
        INNER JOIN clientes cl
            ON cl.id = c.cliente_id
        WHERE c.id = $1`,
        [id]
    );

    if (contratoResult.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    const contrato = contratoResult.rows[0];

    /* -------------------------------------------------
       Obtener activos con subtotal guardado en BD
    ------------------------------------------------- */
    const activosResult = await pool.query(
        `SELECT
            dc.id AS detalle_id,
            a.id,
            a.codigo,
            a.nombre,
            dc.cantidad,
            dc.precio_diario AS precio_dia,
            GREATEST(
                c.fecha_fin::date - c.fecha_inicio::date,
                1
            ) AS dias,
            dc.subtotal
        FROM detalles_contrato dc
        INNER JOIN activos a
            ON a.id = dc.activo_id
        INNER JOIN contratos_alquiler c
            ON c.id = dc.contrato_id
        WHERE dc.contrato_id = $1
        ORDER BY a.nombre ASC`,
        [id]
    );

    /* -------------------------------------------------
       Obtener historial de pagos
    ------------------------------------------------- */
    const pagosResult = await pool.query(
        `SELECT
            pc.id,
            pc.contrato_id,
            pc.cuenta_id,
            pc.monto,
            pc.fecha,
            pc.metodo_pago,
            pc.concepto,
            pc.observaciones,
            pc.fecha_creacion,
            cf.nombre AS cuenta
        FROM pagos_contratos pc
        INNER JOIN cuentas_financieras cf
            ON cf.id = pc.cuenta_id
        WHERE pc.contrato_id = $1
        ORDER BY
            pc.fecha DESC,
            pc.fecha_creacion DESC`,
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