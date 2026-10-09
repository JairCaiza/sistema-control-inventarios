
const { pool } = require("../../../config/db");

const financialService = require(
    "../../../core/finance/financial.service"
);

// =====================================================
// UTILIDADES
// =====================================================

const redondear = (valor) => {
    return Math.round(
        (Number(valor) + Number.EPSILON) * 100
    ) / 100;
};

const validarMonto = (valor) => {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        throw new Error("Debe ingresar el monto del pago");
    }

    const monto = Number(valor);

    if (!Number.isFinite(monto) || monto <= 0) {
        throw new Error("El monto debe ser mayor a cero");
    }

    const centavos = Math.round(monto * 100);

    if (
        Math.abs(monto * 100 - centavos) > 0.0000001
    ) {
        throw new Error(
            "El monto no puede tener más de dos decimales"
        );
    }

    return centavos / 100;
};

// =====================================================
// ESTADO FINANCIERO EFECTIVO
// =====================================================

const obtenerEstadoFinanciero = async (
    contratoId,
    db = pool
) => {
    const result = await db.query(
        `
        SELECT
            c.id,
            c.numero_contrato,
            c.estado,
            c.total AS total_previsto,
            c.pagado,
            c.saldo_pendiente AS saldo_previsto,

            COALESCE(
                (
                    SELECT SUM(ja.total_dia)
                    FROM jornadas_alquiler ja
                    INNER JOIN detalles_contrato dc
                        ON dc.id = ja.detalle_contrato_id
                    WHERE dc.contrato_id = c.id
                      AND ja.cobrable = TRUE
                ),
                0
            ) AS total_efectivo,

            COALESCE(
                (
                    SELECT SUM(pc.monto)
                    FROM pagos_contratos pc
                    WHERE pc.contrato_id = c.id
                      AND pc.estado = 'registrado'
                      AND pc.concepto IN (
                          'alquiler',
                          'anticipo',
                          'abono',
                          'saldo'
                      )
                ),
                0
            ) AS pagos_aplicables,

            COALESCE(
                (
                    SELECT SUM(pc.monto)
                    FROM pagos_contratos pc
                    WHERE pc.contrato_id = c.id
                      AND pc.estado = 'registrado'
                      AND pc.concepto = 'penalidad'
                ),
                0
            ) AS total_penalidades_pagadas

        FROM contratos_alquiler c
        WHERE c.id = $1
        `,
        [contratoId]
    );

    if (result.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    const contrato = result.rows[0];

    const totalPrevisto = redondear(
        contrato.total_previsto || 0
    );

    const totalEfectivo = redondear(
        contrato.total_efectivo || 0
    );

    const pagado = redondear(
        contrato.pagado || 0
    );

    const saldoPrevisto = redondear(
        contrato.saldo_previsto || 0
    );

    const pagosAplicables = redondear(
        contrato.pagos_aplicables || 0
    );

    const penalidadesPagadas = redondear(
        contrato.total_penalidades_pagadas || 0
    );

    const saldoEfectivoPendiente = Math.max(
        redondear(totalEfectivo - pagosAplicables),
        0
    );

    const saldoFavorCliente = Math.max(
        redondear(pagosAplicables - totalEfectivo),
        0
    );

    const disponibleAnticipo = Math.max(
        redondear(totalPrevisto - pagosAplicables),
        0
    );

    return {
        id: contrato.id,
        numero_contrato: contrato.numero_contrato,
        estado: contrato.estado,

        total_previsto: totalPrevisto,
        total_efectivo: totalEfectivo,

        pagado,
        pagos_aplicables: pagosAplicables,

        total_penalidades_pagadas:
            penalidadesPagadas,

        saldo_previsto: saldoPrevisto,

        saldo_efectivo_pendiente:
            saldoEfectivoPendiente,

        saldo_a_favor_cliente:
            saldoFavorCliente,

        disponible_anticipo:
            disponibleAnticipo,
    };
};

// =====================================================
// REGISTRAR PAGO
// =====================================================

const registrarPago = async (data) => {
    const client = await pool.connect();

    let transaccionIniciada = false;

    try {
        await client.query("BEGIN");
        transaccionIniciada = true;

        const contratoRes = await client.query(
            `
            SELECT
                id,
                numero_contrato,
                estado,
                total,
                pagado,
                saldo_pendiente
            FROM contratos_alquiler
            WHERE id = $1
            FOR UPDATE
            `,
            [data.contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoRes.rows[0];

        const montoPago = validarMonto(data.monto);

        if (!data.cuenta_id) {
            throw new Error(
                "Debe seleccionar una cuenta financiera"
            );
        }

        if (contrato.estado !== "activo") {
            throw new Error(
                "Solo se pueden registrar pagos en contratos activos"
            );
        }

        const concepto = String(
            data.concepto || "alquiler"
        ).trim().toLowerCase();

        if (
            concepto !== "alquiler" &&
            concepto !== "anticipo"
        ) {
            throw new Error(
                "El concepto debe ser alquiler o anticipo"
            );
        }

        const estadoFinanciero =
            await obtenerEstadoFinanciero(
                data.contrato_id,
                client
            );

        if (concepto === "alquiler") {
            const saldo =
                estadoFinanciero.saldo_efectivo_pendiente;

            if (saldo <= 0) {
                throw new Error(
                    "El contrato no tiene jornadas pendientes de cobro"
                );
            }

            if (montoPago > saldo) {
                throw new Error(
                    `El monto no puede superar el saldo efectivo pendiente de $${saldo.toFixed(2)}`
                );
            }
        }

        if (concepto === "anticipo") {
            const disponible =
                estadoFinanciero.disponible_anticipo;

            if (disponible <= 0) {
                throw new Error(
                    "El contrato no tiene importe disponible para anticipos"
                );
            }

            if (montoPago > disponible) {
                throw new Error(
                    `El anticipo no puede superar $${disponible.toFixed(2)}`
                );
            }
        }

        const resultado =
            await financialService.registrarPagoContrato(
                {
                    contrato_id: data.contrato_id,
                    cuenta_id: data.cuenta_id,
                    monto: montoPago,
                    fecha: data.fecha,

                    metodo_pago:
                        data.metodo_pago || "efectivo",

                    concepto,

                    observaciones:
                        data.observaciones || null,

                    descripcion:
                        data.descripcion ||
                        `Pago ${concepto} contrato ${contrato.numero_contrato}`,
                },
                client
            );

        const actualizadoRes = await client.query(
            `
            UPDATE contratos_alquiler
            SET
                pagado = COALESCE(pagado, 0) + $2,
                saldo_pendiente = GREATEST(
                    COALESCE(saldo_pendiente, 0) - $2,
                    0
                )
            WHERE id = $1
            RETURNING *
            `,
            [data.contrato_id, montoPago]
        );

        const actualizado = actualizadoRes.rows[0];

        const nuevoEstado =
            await obtenerEstadoFinanciero(
                data.contrato_id,
                client
            );

        await client.query("COMMIT");
        transaccionIniciada = false;

        return {
            contrato_id: actualizado.id,
            numero_contrato:
                actualizado.numero_contrato,
            estado: actualizado.estado,
            total: redondear(actualizado.total),

            pagado: nuevoEstado.pagado,
            saldo_pendiente:
                nuevoEstado.saldo_previsto,

            total_previsto:
                nuevoEstado.total_previsto,

            total_efectivo:
                nuevoEstado.total_efectivo,

            pagos_aplicables:
                nuevoEstado.pagos_aplicables,

            total_penalidades_pagadas:
                nuevoEstado.total_penalidades_pagadas,

            saldo_previsto:
                nuevoEstado.saldo_previsto,

            saldo_efectivo_pendiente:
                nuevoEstado.saldo_efectivo_pendiente,

            saldo_a_favor_cliente:
                nuevoEstado.saldo_a_favor_cliente,

            disponible_anticipo:
                nuevoEstado.disponible_anticipo,

            concepto,
            pago: resultado.pago,
            transaccion: resultado.transaccion,

            mensaje: "Pago registrado correctamente",
        };
    } catch (error) {
        if (transaccionIniciada) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

// =====================================================
// ANULAR PAGO DE CONTRATO
// =====================================================

const anularPago = async ({
    contrato_id,
    pago_id,
    motivo_anulacion,
    usuario_id,
}) => {
    const client = await pool.connect();

    let transaccionIniciada = false;

    try {
        if (!contrato_id || !pago_id) {
            throw new Error(
                "Debe identificar el contrato y el pago"
            );
        }

        if (!usuario_id) {
            throw new Error(
                "No se pudo identificar al usuario que realiza la anulación"
            );
        }

        const motivo = String(
            motivo_anulacion || ""
        ).trim();

        if (motivo.length < 10) {
            throw new Error(
                "El motivo de anulación debe tener al menos 10 caracteres"
            );
        }

        await client.query("BEGIN");
        transaccionIniciada = true;

        const contratoRes = await client.query(
            `
            SELECT
                id,
                numero_contrato,
                estado,
                total,
                pagado,
                saldo_pendiente
            FROM contratos_alquiler
            WHERE id = $1
            FOR UPDATE
            `,
            [contrato_id]
        );

        if (contratoRes.rows.length === 0) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoRes.rows[0];

        const pagoRes = await client.query(
            `
            SELECT *
            FROM pagos_contratos
            WHERE id = $1
              AND contrato_id = $2
            FOR UPDATE
            `,
            [pago_id, contrato_id]
        );

        if (pagoRes.rows.length === 0) {
            throw new Error(
                "El pago no existe o no pertenece al contrato"
            );
        }

        const pago = pagoRes.rows[0];

        if (pago.estado === "anulado") {
            throw new Error(
                "Este pago ya fue anulado anteriormente"
            );
        }

        if (pago.estado !== "registrado") {
            throw new Error(
                "El pago no tiene un estado válido para anulación"
            );
        }

        const monto = validarMonto(pago.monto);

        const transaccionOriginalRes =
            await client.query(
                `
                SELECT
                    id,
                    cuenta_id,
                    tipo,
                    monto,
                    fecha,
                    origen_modulo,
                    origen_id
                FROM transacciones
                WHERE origen_modulo = 'pagos_contratos'
                  AND origen_id = $1
                  AND tipo = 'ingreso'
                FOR UPDATE
                `,
                [pago.id]
            );

        if (
            transaccionOriginalRes.rows.length !== 1
        ) {
            throw new Error(
                "No se encontró una única transacción original del pago. Se requiere revisión financiera."
            );
        }

        const transaccionOriginal =
            transaccionOriginalRes.rows[0];

        if (
            transaccionOriginal.cuenta_id !==
            pago.cuenta_id
        ) {
            throw new Error(
                "La cuenta del pago no coincide con la transacción original"
            );
        }

        if (
            redondear(transaccionOriginal.monto) !==
            monto
        ) {
            throw new Error(
                "El monto del pago no coincide con la transacción original"
            );
        }

        const reversionExistente =
            await client.query(
                `
                SELECT id
                FROM transacciones
                WHERE origen_modulo IN (
                    'anulacion_pago_contrato',
                    'correccion_pago_contrato'
                )
                  AND origen_id = $1
                LIMIT 1
                `,
                [pago.id]
            );

        if (reversionExistente.rows.length > 0) {
            throw new Error(
                "Este pago ya tiene una reversión financiera registrada"
            );
        }

        const cuentaRes = await client.query(
            `
            SELECT id, saldo_actual
            FROM cuentas_financieras
            WHERE id = $1
            FOR UPDATE
            `,
            [pago.cuenta_id]
        );

        if (cuentaRes.rows.length === 0) {
            throw new Error(
                "No existe la cuenta financiera del pago"
            );
        }

        const cuenta = cuentaRes.rows[0];

        if (
            Number(cuenta.saldo_actual) < monto
        ) {
            throw new Error(
                "La cuenta financiera no tiene saldo suficiente para revertir este pago"
            );
        }

        const transaccionReversion =
            await financialService.crearTransaccion(
                {
                    cuenta_id: pago.cuenta_id,
                    tipo: "egreso",
                    monto,

                    descripcion:
                        `REVERSIÓN PAGO ${pago.id} - ` +
                        `CONTRATO ${contrato.numero_contrato}. ` +
                        `Motivo: ${motivo}`,

                    fecha: new Date(),

                    origen_modulo:
                        "anulacion_pago_contrato",

                    origen_id: pago.id,

                    referencia_id:
                        transaccionOriginal.id,
                },
                client
            );

        const pagoAnuladoRes =
            await client.query(
                `
                UPDATE pagos_contratos
                SET
                    estado = 'anulado',
                    motivo_anulacion = $2,
                    fecha_anulacion = NOW(),
                    anulado_por = $3,
                    transaccion_reversion_id = $4
                WHERE id = $1
                  AND estado = 'registrado'
                RETURNING *
                `,
                [
                    pago.id,
                    motivo,
                    usuario_id,
                    transaccionReversion.id,
                ]
            );

        if (pagoAnuladoRes.rows.length !== 1) {
            throw new Error(
                "No se pudo actualizar el estado del pago"
            );
        }

        const contratoActualizadoRes =
            await client.query(
                `
                UPDATE contratos_alquiler
                SET
                    pagado = GREATEST(
                        COALESCE(pagado, 0) - $2,
                        0
                    ),

                    saldo_pendiente = GREATEST(
                        COALESCE(total, 0) -
                        GREATEST(
                            COALESCE(pagado, 0) - $2,
                            0
                        ),
                        0
                    )
                WHERE id = $1
                RETURNING *
                `,
                [contrato_id, monto]
            );

        const contratoActualizado =
            contratoActualizadoRes.rows[0];

        const resumen =
            await obtenerEstadoFinanciero(
                contrato_id,
                client
            );

        await client.query("COMMIT");
        transaccionIniciada = false;

        return {
            success: true,
            mensaje:
                "Pago anulado correctamente",

            contrato_id,

            numero_contrato:
                contratoActualizado.numero_contrato,

            pago: pagoAnuladoRes.rows[0],

            transaccion_reversion:
                transaccionReversion,

            resumen_financiero: resumen,
        };
    } catch (error) {
        if (transaccionIniciada) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

// =====================================================
// CORREGIR PAGO DE CONTRATO
// =====================================================

const corregirPago = async ({
    contrato_id,
    pago_id,
    cuenta_id,
    monto,
    metodo_pago,
    concepto,
    observaciones,
    fecha,
    motivo_correccion,
    usuario_id,
}) => {
    if (!contrato_id || !pago_id) {
        throw new Error(
            "Debe identificar el contrato y el pago"
        );
    }

    if (!usuario_id) {
        throw new Error(
            "No se pudo identificar al usuario que corrige el pago"
        );
    }

    if (!cuenta_id) {
        throw new Error(
            "Debe seleccionar una cuenta financiera"
        );
    }

    const motivo = String(
        motivo_correccion || ""
    ).trim();

    if (motivo.length < 10) {
        throw new Error(
            "El motivo de corrección debe tener al menos 10 caracteres"
        );
    }

    const nuevoMonto = validarMonto(monto);

    const nuevoConcepto = String(
        concepto || ""
    ).trim().toLowerCase();

    if (
        nuevoConcepto !== "alquiler" &&
        nuevoConcepto !== "anticipo"
    ) {
        throw new Error(
            "El concepto debe ser alquiler o anticipo"
        );
    }

    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        await client.query("BEGIN");
        transaccionIniciada = true;

        // 1. BLOQUEAR CONTRATO

        const contratoRes = await client.query(
            `
            SELECT
                id,
                numero_contrato,
                estado,
                total,
                pagado
            FROM contratos_alquiler
            WHERE id = $1
            FOR UPDATE
            `,
            [contrato_id]
        );

        if (contratoRes.rows.length !== 1) {
            throw new Error("Contrato no encontrado");
        }

        const contrato = contratoRes.rows[0];

        if (contrato.estado !== "activo") {
            throw new Error(
                "Solo se pueden corregir pagos de contratos activos"
            );
        }

        // 2. BLOQUEAR PAGO ORIGINAL

        const pagoRes = await client.query(
            `
            SELECT *
            FROM pagos_contratos
            WHERE id = $1
              AND contrato_id = $2
            FOR UPDATE
            `,
            [pago_id, contrato_id]
        );

        if (pagoRes.rows.length !== 1) {
            throw new Error(
                "El pago no existe o no pertenece al contrato"
            );
        }

        const pagoOriginal = pagoRes.rows[0];

        if (pagoOriginal.estado !== "registrado") {
            throw new Error(
                "Solo se pueden corregir pagos registrados"
            );
        }

        const montoOriginal = validarMonto(
            pagoOriginal.monto
        );

        if (
            !["alquiler", "anticipo"].includes(
                pagoOriginal.concepto
            )
        ) {
            throw new Error(
                "Este concepto no está habilitado para corrección"
            );
        }

        // 3. COMPROBAR CORRECCIÓN EXISTENTE

        const correccionExistente =
            await client.query(
                `
                SELECT id
                FROM pagos_contratos
                WHERE pago_original_id = $1
                LIMIT 1
                `,
                [pago_id]
            );

        if (correccionExistente.rows.length > 0) {
            throw new Error(
                "Este pago ya fue corregido anteriormente"
            );
        }

        // 4. COMPROBAR TRANSACCIÓN ORIGINAL

        const transaccionRes =
            await client.query(
                `
                SELECT
                    id,
                    cuenta_id,
                    monto
                FROM transacciones
                WHERE origen_modulo = 'pagos_contratos'
                  AND origen_id = $1
                  AND tipo = 'ingreso'
                FOR UPDATE
                `,
                [pago_id]
            );

        if (transaccionRes.rows.length !== 1) {
            throw new Error(
                "No se encontró una única transacción original. Se requiere revisión financiera."
            );
        }

        const transaccionOriginal =
            transaccionRes.rows[0];

        if (
            transaccionOriginal.cuenta_id !==
            pagoOriginal.cuenta_id
        ) {
            throw new Error(
                "La cuenta financiera original no coincide"
            );
        }

        if (
            redondear(transaccionOriginal.monto) !==
            montoOriginal
        ) {
            throw new Error(
                "El monto original no coincide con la transacción financiera"
            );
        }

        // 5. EVITAR REVERSIÓN DUPLICADA

        const reversionExistente =
            await client.query(
                `
                SELECT id
                FROM transacciones
                WHERE origen_id = $1
                  AND origen_modulo IN (
                      'anulacion_pago_contrato',
                      'correccion_pago_contrato'
                  )
                LIMIT 1
                `,
                [pago_id]
            );

        if (
            reversionExistente.rows.length > 0 ||
            pagoOriginal.transaccion_reversion_id
        ) {
            throw new Error(
                "Este pago ya tiene una reversión financiera"
            );
        }

        // 6. BLOQUEAR CUENTAS EN ORDEN ESTABLE

        const idsCuentas = [
            ...new Set([
                pagoOriginal.cuenta_id,
                cuenta_id,
            ]),
        ].sort();

        const cuentasRes = await client.query(
            `
            SELECT id, saldo_actual
            FROM cuentas_financieras
            WHERE id = ANY($1::uuid[])
            ORDER BY id
            FOR UPDATE
            `,
            [idsCuentas]
        );

        if (
            cuentasRes.rows.length !==
            idsCuentas.length
        ) {
            throw new Error(
                "Una de las cuentas financieras no existe"
            );
        }

        const cuentaOriginal =
            cuentasRes.rows.find(
                (cuenta) =>
                    cuenta.id === pagoOriginal.cuenta_id
            );

        if (
            Number(cuentaOriginal.saldo_actual) <
            montoOriginal
        ) {
            throw new Error(
                "La cuenta original no tiene saldo suficiente para revertir el pago"
            );
        }

        // 7. VALIDAR NUEVO IMPORTE
        // Se excluye el pago original del cálculo.

        const estadoAnterior =
            await obtenerEstadoFinanciero(
                contrato_id,
                client
            );

        const pagosSinOriginal = redondear(
            estadoAnterior.pagos_aplicables -
            montoOriginal
        );

        const maximoPermitido =
            nuevoConcepto === "alquiler"
                ? Math.max(
                    0,
                    redondear(
                        estadoAnterior.total_efectivo -
                        pagosSinOriginal
                    )
                )
                : Math.max(
                    0,
                    redondear(
                        estadoAnterior.total_previsto -
                        pagosSinOriginal
                    )
                );

        if (nuevoMonto > maximoPermitido) {
            throw new Error(
                `El monto corregido no puede superar $${maximoPermitido.toFixed(2)}`
            );
        }

        // 8. REVERSIÓN FINANCIERA ORIGINAL

        const transaccionReversion =
            await financialService.crearTransaccion(
                {
                    cuenta_id:
                        pagoOriginal.cuenta_id,

                    tipo: "egreso",
                    monto: montoOriginal,

                    descripcion:
                        `CORRECCIÓN PAGO ${pago_id} - ` +
                        `CONTRATO ${contrato.numero_contrato}. ` +
                        `Motivo: ${motivo}`,

                    fecha: new Date(),

                    origen_modulo:
                        "correccion_pago_contrato",

                    origen_id: pago_id,

                    referencia_id:
                        transaccionOriginal.id,
                },
                client
            );

        // 9. ANULAR REGISTRO ORIGINAL

        const pagoAnuladoRes =
            await client.query(
                `
                UPDATE pagos_contratos
                SET
                    estado = 'anulado',
                    motivo_anulacion = $2,
                    fecha_anulacion = NOW(),
                    anulado_por = $3,
                    transaccion_reversion_id = $4
                WHERE id = $1
                  AND estado = 'registrado'
                RETURNING *
                `,
                [
                    pago_id,
                    `Corrección: ${motivo}`,
                    usuario_id,
                    transaccionReversion.id,
                ]
            );

        if (pagoAnuladoRes.rows.length !== 1) {
            throw new Error(
                "No se pudo actualizar el pago original"
            );
        }

        // 10. REGISTRAR NUEVO PAGO

        const resultado =
            await financialService.registrarPagoContrato(
                {
                    contrato_id,
                    cuenta_id,
                    monto: nuevoMonto,

                    fecha:
                        fecha || pagoOriginal.fecha,

                    metodo_pago:
                        metodo_pago ||
                        pagoOriginal.metodo_pago ||
                        "efectivo",

                    concepto: nuevoConcepto,

                    observaciones:
                        observaciones ??
                        pagoOriginal.observaciones,

                    descripcion:
                        `PAGO CORREGIDO CONTRATO ` +
                        `${contrato.numero_contrato} - ` +
                        `PAGO ORIGINAL ${pago_id}`,
                },
                client
            );

        // 11. GUARDAR TRAZABILIDAD

        const pagoCorregidoRes =
            await client.query(
                `
                UPDATE pagos_contratos
                SET
                    pago_original_id = $2,
                    motivo_correccion = $3,
                    corregido_por = $4
                WHERE id = $1
                  AND pago_original_id IS NULL
                RETURNING *
                `,
                [
                    resultado.pago.id,
                    pago_id,
                    motivo,
                    usuario_id,
                ]
            );

        if (
            pagoCorregidoRes.rows.length !== 1
        ) {
            throw new Error(
                "No se pudo vincular el pago corregido"
            );
        }

        // 12. ACTUALIZAR ACUMULADOS
        // Diferencia neta: nuevo pago - pago original.

        const diferencia = redondear(
            nuevoMonto - montoOriginal
        );

        const contratoActualizadoRes =
            await client.query(
                `
                UPDATE contratos_alquiler
                SET
                    pagado = GREATEST(
                        COALESCE(pagado, 0) + $2,
                        0
                    ),

                    saldo_pendiente = GREATEST(
                        COALESCE(total, 0) -
                        GREATEST(
                            COALESCE(pagado, 0) + $2,
                            0
                        ),
                        0
                    )
                WHERE id = $1
                RETURNING *
                `,
                [contrato_id, diferencia]
            );

        const contratoActualizado =
            contratoActualizadoRes.rows[0];

        // 13. RESUMEN FINANCIERO ACTUALIZADO

        const resumen =
            await obtenerEstadoFinanciero(
                contrato_id,
                client
            );

        await client.query("COMMIT");
        transaccionIniciada = false;

        return {
            success: true,
            mensaje: "Pago corregido correctamente",

            contrato_id,

            numero_contrato:
                contratoActualizado.numero_contrato,

            pago_original:
                pagoAnuladoRes.rows[0],

            pago:
                pagoCorregidoRes.rows[0],

            transaccion_reversion:
                transaccionReversion,

            transaccion:
                resultado.transaccion,

            resumen_financiero: resumen,
        };
    } catch (error) {
        if (transaccionIniciada) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

// =====================================================
// LISTAR PAGOS DEL CONTRATO
// =====================================================

const listarPorContrato = async (contrato_id) => {
    const contratoRes = await pool.query(
        `
        SELECT id
        FROM contratos_alquiler
        WHERE id = $1
        `,
        [contrato_id]
    );

    if (contratoRes.rows.length === 0) {
        throw new Error("Contrato no encontrado");
    }

    const result = await pool.query(
        `
        SELECT
            pc.id,
            pc.contrato_id,
            pc.cuenta_id,

            cf.nombre AS cuenta,

            pc.monto,
            pc.fecha,
            pc.metodo_pago,
            pc.concepto,
            pc.observaciones,
            pc.fecha_creacion,

            pc.estado,
            pc.motivo_anulacion,
            pc.fecha_anulacion,
            pc.anulado_por,
            pc.transaccion_reversion_id,

            pc.pago_original_id,
            pc.motivo_correccion,
            pc.corregido_por

        FROM pagos_contratos pc

        LEFT JOIN cuentas_financieras cf
            ON cf.id = pc.cuenta_id

        WHERE pc.contrato_id = $1

        ORDER BY
            pc.fecha DESC,
            pc.fecha_creacion DESC
        `,
        [contrato_id]
    );

    return result.rows;
};

// =====================================================
// RESUMEN FINANCIERO DEL CONTRATO
// =====================================================

const resumenContrato = async (contrato_id) => {
    const estadoFinanciero =
        await obtenerEstadoFinanciero(contrato_id);

    const pagosResult = await pool.query(
        `
        SELECT
            COUNT(id) FILTER (
                WHERE estado = 'registrado'
            )::integer AS cantidad_pagos,

            COUNT(id) FILTER (
                WHERE estado = 'anulado'
            )::integer AS cantidad_pagos_anulados,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                ),
                0
            ) AS total_pagos,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                      AND concepto = 'anticipo'
                ),
                0
            ) AS total_anticipos,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                      AND concepto = 'alquiler'
                ),
                0
            ) AS total_pagos_alquiler,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                      AND concepto = 'abono'
                ),
                0
            ) AS total_abonos,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                      AND concepto = 'saldo'
                ),
                0
            ) AS total_pagos_saldo,

            COALESCE(
                SUM(monto) FILTER (
                    WHERE estado = 'registrado'
                      AND concepto = 'penalidad'
                ),
                0
            ) AS total_penalidades_pagadas

        FROM pagos_contratos
        WHERE contrato_id = $1
        `,
        [contrato_id]
    );

    const pagos = pagosResult.rows[0];

    return {
        id: estadoFinanciero.id,

        numero_contrato:
            estadoFinanciero.numero_contrato,

        estado: estadoFinanciero.estado,

        total:
            estadoFinanciero.total_previsto,

        pagado:
            estadoFinanciero.pagado,

        saldo_pendiente:
            estadoFinanciero.saldo_previsto,

        total_previsto:
            estadoFinanciero.total_previsto,

        total_efectivo:
            estadoFinanciero.total_efectivo,

        pagos_aplicables:
            estadoFinanciero.pagos_aplicables,

        saldo_previsto:
            estadoFinanciero.saldo_previsto,

        saldo_efectivo_pendiente:
            estadoFinanciero.saldo_efectivo_pendiente,

        saldo_a_favor_cliente:
            estadoFinanciero.saldo_a_favor_cliente,

        disponible_anticipo:
            estadoFinanciero.disponible_anticipo,

        cantidad_pagos:
            Number(pagos.cantidad_pagos || 0),

        cantidad_pagos_anulados:
            Number(
                pagos.cantidad_pagos_anulados || 0
            ),

        total_pagos:
            redondear(pagos.total_pagos || 0),

        total_anticipos:
            redondear(pagos.total_anticipos || 0),

        total_pagos_alquiler:
            redondear(
                pagos.total_pagos_alquiler || 0
            ),

        total_abonos:
            redondear(pagos.total_abonos || 0),

        total_pagos_saldo:
            redondear(
                pagos.total_pagos_saldo || 0
            ),

        total_penalidades_pagadas:
            redondear(
                pagos.total_penalidades_pagadas || 0
            ),
    };
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
    registrarPago,
    anularPago,
    corregirPago,
    listarPorContrato,
    resumenContrato,
};
