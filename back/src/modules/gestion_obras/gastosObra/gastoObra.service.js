const { pool } = require("../../../config/db");

/* =====================================================
   HELPERS
===================================================== */

const crearError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};


/* =====================================================
   NORMALIZAR VALORES OPCIONALES
===================================================== */

const normalizarTextoOpcional = (
    value
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const texto = String(value).trim();

    return texto || null;
};


/* =====================================================
   OBTENER OBRA
===================================================== */

const obtenerObra = async (
    db,
    obraId
) => {
    const result = await db.query(
        `
        SELECT
            id,
            codigo,
            nombre,
            estado,
            presupuesto,
            fecha_inicio,
            fecha_fin
        FROM obras
        WHERE id = $1
        LIMIT 1
        `,
        [obraId]
    );

    if (result.rows.length === 0) {
        throw crearError(
            "La obra seleccionada no existe.",
            404
        );
    }

    const obra = result.rows[0];

    /*
     * No permitimos registrar nuevos gastos
     * en una obra cancelada.
     *
     * Una obra finalizada sí podría requerir
     * registrar un ajuste/gasto pendiente,
     * por eso no la bloqueamos aquí.
     */

    if (obra.estado === "cancelada") {
        throw crearError(
            "No se pueden registrar gastos en una obra cancelada.",
            409
        );
    }

    return obra;
};


/* =====================================================
   VALIDAR CONTROL DIARIO
===================================================== */

const obtenerControlDiario = async (
    db,
    controlDiarioId,
    obraId
) => {
    if (!controlDiarioId) {
        return null;
    }

    const result = await db.query(
        `
        SELECT
            id,
            obra_id,
            fecha,
            actividad,
            descripcion
        FROM controles_diarios
        WHERE id = $1
        LIMIT 1
        `,
        [controlDiarioId]
    );

    if (result.rows.length === 0) {
        throw crearError(
            "El control diario seleccionado no existe.",
            404
        );
    }

    const control = result.rows[0];

    if (control.obra_id !== obraId) {
        throw crearError(
            "El control diario seleccionado no pertenece a la obra indicada.",
            409
        );
    }

    return control;
};


/* =====================================================
   OBTENER CUENTA FINANCIERA CON BLOQUEO
===================================================== */

const obtenerCuentaParaMovimiento = async (
    client,
    cuentaId
) => {
    const result = await client.query(
        `
        SELECT
            id,
            nombre,
            tipo,
            saldo_actual,
            activo
        FROM cuentas_financieras
        WHERE id = $1
        FOR UPDATE
        `,
        [cuentaId]
    );

    if (result.rows.length === 0) {
        throw crearError(
            "La cuenta financiera seleccionada no existe.",
            404
        );
    }

    const cuenta = result.rows[0];

    if (cuenta.activo !== true) {
        throw crearError(
            "La cuenta financiera seleccionada está inactiva.",
            409
        );
    }

    return cuenta;
};


/* =====================================================
   OBTENER GASTO BLOQUEADO
===================================================== */

const obtenerGastoBloqueado = async (
    client,
    gastoId
) => {
    const result = await client.query(
        `
        SELECT
            id,
            obra_id,
            control_diario_id,
            cuenta_id,
            transaccion_id,
            tipo,
            descripcion,
            monto,
            fecha,
            fecha_pago,
            metodo_pago,
            estado,
            referencia,
            observaciones,
            fecha_creacion,
            fecha_actualizacion
        FROM gastos_obra
        WHERE id = $1
        FOR UPDATE
        `,
        [gastoId]
    );

    if (result.rows.length === 0) {
        throw crearError(
            "El gasto de obra no existe.",
            404
        );
    }

    return result.rows[0];
};


/* =====================================================
   CREAR GASTO
===================================================== */

const crearGastoObra = async (
    data
) => {
    const {
        obra_id,
        control_diario_id = null,
        tipo,
        descripcion,
        monto,
        fecha,
        referencia = null,
        observaciones = null
    } = data;

    /*
     * Validamos la obra.
     */

    await obtenerObra(
        pool,
        obra_id
    );

    /*
     * Si existe control diario,
     * debe pertenecer a la misma obra.
     */

    await obtenerControlDiario(
        pool,
        control_diario_id,
        obra_id
    );

    /*
     * MUY IMPORTANTE:
     *
     * Al crear un gasto:
     *
     * estado = pendiente
     * cuenta_id = NULL
     * transaccion_id = NULL
     * fecha_pago = NULL
     * metodo_pago = NULL
     *
     * Todavía NO sale dinero.
     */

    const result = await pool.query(
        `
        INSERT INTO gastos_obra (
            obra_id,
            control_diario_id,
            tipo,
            descripcion,
            monto,
            fecha,
            estado,
            referencia,
            observaciones
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'pendiente',
            $7,
            $8
        )
        RETURNING *
        `,
        [
            obra_id,
            control_diario_id,
            tipo,
            descripcion,
            monto,
            fecha,
            normalizarTextoOpcional(
                referencia
            ),
            normalizarTextoOpcional(
                observaciones
            )
        ]
    );

    return result.rows[0];
};


/* =====================================================
   LISTAR GASTOS
===================================================== */

const listarGastosObra = async (
    filtros = {}
) => {
    const {
        obra_id,
        control_diario_id,
        cuenta_id,
        estado,
        tipo,
        fecha_desde,
        fecha_hasta,
        buscar,
        page = 1,
        limit = 10
    } = filtros;

    const condiciones = [];

    const valores = [];

    let index = 1;

    /* =================================================
       FILTRO OBRA
    ================================================= */

    if (obra_id) {
        condiciones.push(
            `g.obra_id = $${index}`
        );

        valores.push(
            obra_id
        );

        index++;
    }

    /* =================================================
       FILTRO CONTROL DIARIO
    ================================================= */

    if (control_diario_id) {
        condiciones.push(
            `g.control_diario_id = $${index}`
        );

        valores.push(
            control_diario_id
        );

        index++;
    }

    /* =================================================
       FILTRO CUENTA
    ================================================= */

    if (cuenta_id) {
        condiciones.push(
            `g.cuenta_id = $${index}`
        );

        valores.push(
            cuenta_id
        );

        index++;
    }

    /* =================================================
       FILTRO ESTADO
    ================================================= */

    if (estado) {
        condiciones.push(
            `g.estado = $${index}`
        );

        valores.push(
            estado
        );

        index++;
    }

    /* =================================================
       FILTRO TIPO
    ================================================= */

    if (tipo) {
        condiciones.push(
            `g.tipo = $${index}`
        );

        valores.push(
            tipo
        );

        index++;
    }

    /* =================================================
       FECHA DESDE
    ================================================= */

    if (fecha_desde) {
        condiciones.push(
            `g.fecha >= $${index}`
        );

        valores.push(
            fecha_desde
        );

        index++;
    }

    /* =================================================
       FECHA HASTA
    ================================================= */

    if (fecha_hasta) {
        condiciones.push(
            `g.fecha <= $${index}`
        );

        valores.push(
            fecha_hasta
        );

        index++;
    }

    /* =================================================
       BÚSQUEDA
    ================================================= */

    if (
        buscar &&
        String(buscar).trim()
    ) {
        condiciones.push(
            `
            (
                g.descripcion ILIKE $${index}
                OR g.tipo ILIKE $${index}
                OR COALESCE(g.referencia, '') ILIKE $${index}
                OR COALESCE(g.observaciones, '') ILIKE $${index}
                OR o.nombre ILIKE $${index}
                OR o.codigo ILIKE $${index}
            )
            `
        );

        valores.push(
            `%${String(buscar).trim()}%`
        );

        index++;
    }

    const where =
        condiciones.length > 0
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

    /* =================================================
       CONTAR TOTAL
    ================================================= */

    const countResult = await pool.query(
        `
        SELECT
            COUNT(*)::INTEGER AS total
        FROM gastos_obra g

        INNER JOIN obras o
            ON o.id = g.obra_id

        LEFT JOIN controles_diarios cd
            ON cd.id = g.control_diario_id

        LEFT JOIN cuentas_financieras cf
            ON cf.id = g.cuenta_id

        ${where}
        `,
        valores
    );

    const total =
        Number(
            countResult.rows[0]?.total || 0
        );

    /* =================================================
       PAGINACIÓN
    ================================================= */

    const offset =
        (Number(page) - 1) *
        Number(limit);

    const valoresConsulta = [
        ...valores,
        Number(limit),
        offset
    ];

    const limitIndex =
        index;

    const offsetIndex =
        index + 1;

    /* =================================================
       CONSULTA
    ================================================= */

    const result = await pool.query(
        `
        SELECT
            g.id,
            g.obra_id,
            g.control_diario_id,
            g.cuenta_id,
            g.transaccion_id,

            g.tipo,
            g.descripcion,
            g.monto,
            g.fecha,

            g.fecha_pago,
            g.metodo_pago,
            g.estado,

            g.referencia,
            g.observaciones,

            g.fecha_creacion,
            g.fecha_actualizacion,

            o.codigo AS obra_codigo,
            o.nombre AS obra_nombre,
            o.estado AS obra_estado,
            o.presupuesto AS obra_presupuesto,

            cd.fecha AS control_diario_fecha,
            cd.actividad AS control_diario_actividad,

            cf.nombre AS cuenta_nombre,
            cf.tipo AS cuenta_tipo,

            t.tipo AS transaccion_tipo,
            t.fecha AS transaccion_fecha,
            t.descripcion AS transaccion_descripcion

        FROM gastos_obra g

        INNER JOIN obras o
            ON o.id = g.obra_id

        LEFT JOIN controles_diarios cd
            ON cd.id = g.control_diario_id

        LEFT JOIN cuentas_financieras cf
            ON cf.id = g.cuenta_id

        LEFT JOIN transacciones t
            ON t.id = g.transaccion_id

        ${where}

        ORDER BY
            g.fecha DESC,
            g.fecha_creacion DESC

        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
        valoresConsulta
    );

    const totalPages =
        total > 0
            ? Math.ceil(
                total /
                Number(limit)
            )
            : 0;

    return {
        data: result.rows,

        pagination: {
            page:
                Number(page),

            limit:
                Number(limit),

            total,

            totalPages
        }
    };
};


/* =====================================================
   OBTENER GASTO POR ID
===================================================== */

const obtenerGastoObraPorId = async (
    id
) => {
    const result = await pool.query(
        `
        SELECT
            g.id,
            g.obra_id,
            g.control_diario_id,
            g.cuenta_id,
            g.transaccion_id,

            g.tipo,
            g.descripcion,
            g.monto,
            g.fecha,

            g.fecha_pago,
            g.metodo_pago,
            g.estado,

            g.referencia,
            g.observaciones,

            g.fecha_creacion,
            g.fecha_actualizacion,

            o.codigo AS obra_codigo,
            o.nombre AS obra_nombre,
            o.estado AS obra_estado,
            o.presupuesto AS obra_presupuesto,
            o.fecha_inicio AS obra_fecha_inicio,
            o.fecha_fin AS obra_fecha_fin,

            cd.fecha AS control_diario_fecha,
            cd.actividad AS control_diario_actividad,
            cd.descripcion AS control_diario_descripcion,

            cf.nombre AS cuenta_nombre,
            cf.tipo AS cuenta_tipo,

            t.tipo AS transaccion_tipo,
            t.monto AS transaccion_monto,
            t.fecha AS transaccion_fecha,
            t.descripcion AS transaccion_descripcion,
            t.origen_modulo AS transaccion_origen_modulo,
            t.origen_id AS transaccion_origen_id

        FROM gastos_obra g

        INNER JOIN obras o
            ON o.id = g.obra_id

        LEFT JOIN controles_diarios cd
            ON cd.id = g.control_diario_id

        LEFT JOIN cuentas_financieras cf
            ON cf.id = g.cuenta_id

        LEFT JOIN transacciones t
            ON t.id = g.transaccion_id

        WHERE g.id = $1

        LIMIT 1
        `,
        [id]
    );

    if (result.rows.length === 0) {
        throw crearError(
            "El gasto de obra no existe.",
            404
        );
    }

    return result.rows[0];
};


/* =====================================================
   ACTUALIZAR GASTO
===================================================== */

const actualizarGastoObra = async (
    id,
    data
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const gasto =
            await obtenerGastoBloqueado(
                client,
                id
            );

        /* =================================================
           SOLO PENDIENTE SE PUEDE EDITAR
        ================================================= */

        if (
            gasto.estado !==
            "pendiente"
        ) {
            throw crearError(
                "Solo los gastos pendientes pueden modificarse.",
                409
            );
        }

        if (
            gasto.transaccion_id
        ) {
            throw crearError(
                "El gasto ya tiene una transacción financiera asociada y no puede modificarse.",
                409
            );
        }

        /* =================================================
           VALORES FINALES
        ================================================= */

        const obraId =
            data.obra_id ??
            gasto.obra_id;

        const controlDiarioId =
            data.control_diario_id !==
                undefined
                ? data.control_diario_id
                : gasto.control_diario_id;

        const tipo =
            data.tipo ??
            gasto.tipo;

        const descripcion =
            data.descripcion ??
            gasto.descripcion;

        const monto =
            data.monto ??
            gasto.monto;

        const fechaGasto =
            data.fecha ??
            gasto.fecha;

        const referencia =
            data.referencia !==
                undefined
                ? normalizarTextoOpcional(
                    data.referencia
                )
                : gasto.referencia;

        const observaciones =
            data.observaciones !==
                undefined
                ? normalizarTextoOpcional(
                    data.observaciones
                )
                : gasto.observaciones;

        /* =================================================
           VALIDAR OBRA
        ================================================= */

        await obtenerObra(
            client,
            obraId
        );

        /* =================================================
           VALIDAR CONTROL DIARIO
        ================================================= */

        await obtenerControlDiario(
            client,
            controlDiarioId,
            obraId
        );

        /* =================================================
           UPDATE
        ================================================= */

        const result =
            await client.query(
                `
                UPDATE gastos_obra
                SET
                    obra_id = $1,
                    control_diario_id = $2,
                    tipo = $3,
                    descripcion = $4,
                    monto = $5,
                    fecha = $6,
                    referencia = $7,
                    observaciones = $8,
                    fecha_actualizacion = NOW()

                WHERE id = $9

                RETURNING *
                `,
                [
                    obraId,
                    controlDiarioId,
                    tipo,
                    descripcion,
                    monto,
                    fechaGasto,
                    referencia,
                    observaciones,
                    id
                ]
            );

        await client.query(
            "COMMIT"
        );

        return result.rows[0];

    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {
        client.release();
    }
};


/* =====================================================
   CONFIRMAR GASTO
===================================================== */

const confirmarGastoObra = async (
    id,
    data
) => {
    const {
        cuenta_id,
        fecha_pago,
        metodo_pago,
        referencia,
        observaciones
    } = data;

    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        /* =================================================
           BLOQUEAR GASTO
        ================================================= */

        const gasto =
            await obtenerGastoBloqueado(
                client,
                id
            );

        /* =================================================
           VALIDAR ESTADO
        ================================================= */

        if (
            gasto.estado ===
            "pagado"
        ) {
            throw crearError(
                "El gasto ya fue confirmado anteriormente.",
                409
            );
        }

        if (
            gasto.estado ===
            "anulado"
        ) {
            throw crearError(
                "No se puede confirmar un gasto anulado.",
                409
            );
        }

        if (
            gasto.estado !==
            "pendiente"
        ) {
            throw crearError(
                "El gasto no se encuentra en estado pendiente.",
                409
            );
        }

        if (
            gasto.transaccion_id
        ) {
            throw crearError(
                "El gasto ya tiene una transacción financiera asociada.",
                409
            );
        }

        /* =================================================
           VALIDAR OBRA
        ================================================= */

        const obra =
            await obtenerObra(
                client,
                gasto.obra_id
            );

        /* =================================================
           VALIDAR CONTROL DIARIO
        ================================================= */

        await obtenerControlDiario(
            client,
            gasto.control_diario_id,
            gasto.obra_id
        );

        /* =================================================
           BLOQUEAR CUENTA
        ================================================= */

        const cuenta =
            await obtenerCuentaParaMovimiento(
                client,
                cuenta_id
            );

        const saldoActual =
            Number(
                cuenta.saldo_actual
            );

        const monto =
            Number(
                gasto.monto
            );

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            throw crearError(
                "El monto del gasto no es válido.",
                409
            );
        }

        /* =================================================
           VALIDAR SALDO
        ================================================= */

        if (
            saldoActual <
            monto
        ) {
            throw crearError(
                `Saldo insuficiente en la cuenta "${cuenta.nombre}". Saldo disponible: $${saldoActual.toFixed(
                    2
                )}. Monto del gasto: $${monto.toFixed(
                    2
                )}.`,
                409
            );
        }

        /* =================================================
           PREPARAR TEXTOS
        ================================================= */

        const referenciaFinal =
            referencia !== undefined
                ? normalizarTextoOpcional(
                    referencia
                )
                : gasto.referencia;

        const observacionesFinales =
            observaciones !== undefined
                ? normalizarTextoOpcional(
                    observaciones
                )
                : gasto.observaciones;

        const descripcionTransaccion =
            `Gasto de obra ${obra.codigo} - ${obra.nombre}: ${gasto.descripcion}`;

        /* =================================================
           CREAR TRANSACCIÓN FINANCIERA

           origen_modulo = gasto_obra
           origen_id     = gasto.id
        ================================================= */

        const transaccionResult =
            await client.query(
                `
                INSERT INTO transacciones (
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
                VALUES (
                    $1,
                    'egreso',
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'gasto_obra',
                    $8
                )
                RETURNING *
                `,
                [
                    cuenta_id,
                    monto,
                    descripcionTransaccion,
                    fecha_pago,
                    gasto.id,
                    gasto.obra_id,
                    gasto.control_diario_id,
                    gasto.id
                ]
            );

        const transaccion =
            transaccionResult.rows[0];

        /* =================================================
           DESCONTAR SALDO
        ================================================= */

        const cuentaResult =
            await client.query(
                `
                UPDATE cuentas_financieras
                SET
                    saldo_actual =
                        saldo_actual - $1,

                    fecha_actualizacion =
                        NOW()

                WHERE id = $2

                RETURNING
                    id,
                    nombre,
                    tipo,
                    saldo_actual,
                    activo
                `,
                [
                    monto,
                    cuenta_id
                ]
            );

        const cuentaActualizada =
            cuentaResult.rows[0];

        /* =================================================
           ACTUALIZAR GASTO
        ================================================= */

        const gastoResult =
            await client.query(
                `
                UPDATE gastos_obra
                SET
                    cuenta_id = $1,
                    transaccion_id = $2,
                    fecha_pago = $3,
                    metodo_pago = $4,
                    estado = 'pagado',
                    referencia = $5,
                    observaciones = $6,
                    fecha_actualizacion = NOW()

                WHERE id = $7

                RETURNING *
                `,
                [
                    cuenta_id,
                    transaccion.id,
                    fecha_pago,
                    metodo_pago,
                    referenciaFinal,
                    observacionesFinales,
                    gasto.id
                ]
            );

        await client.query(
            "COMMIT"
        );

        return {
            gasto:
                gastoResult.rows[0],

            cuenta:
                cuentaActualizada,

            transaccion
        };

    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {
        client.release();
    }
};


/* =====================================================
   ANULAR GASTO
===================================================== */

const anularGastoObra = async (
    id,
    motivo
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        /* =================================================
           BLOQUEAR GASTO
        ================================================= */

        const gasto =
            await obtenerGastoBloqueado(
                client,
                id
            );

        /* =================================================
           YA ANULADO
        ================================================= */

        if (
            gasto.estado ===
            "anulado"
        ) {
            throw crearError(
                "El gasto ya se encuentra anulado.",
                409
            );
        }

        const motivoLimpio =
            String(motivo).trim();

        /* =================================================
           GASTO PENDIENTE
           NO HAY MOVIMIENTO FINANCIERO
        ================================================= */

        if (
            gasto.estado ===
            "pendiente"
        ) {
            const observaciones =
                [
                    gasto.observaciones,
                    `ANULACIÓN: ${motivoLimpio}`
                ]
                    .filter(Boolean)
                    .join("\n");

            const result =
                await client.query(
                    `
                    UPDATE gastos_obra
                    SET
                        estado = 'anulado',
                        observaciones = $1,
                        fecha_actualizacion = NOW()

                    WHERE id = $2

                    RETURNING *
                    `,
                    [
                        observaciones,
                        gasto.id
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return {
                gasto:
                    result.rows[0],

                reversion: null
            };
        }

        /* =================================================
           SI NO ES PAGADO, NO ES ESTADO VÁLIDO
        ================================================= */

        if (
            gasto.estado !==
            "pagado"
        ) {
            throw crearError(
                "El gasto no se encuentra en un estado válido para ser anulado.",
                409
            );
        }

        /* =================================================
           DEBE TENER CUENTA Y TRANSACCIÓN
        ================================================= */

        if (
            !gasto.cuenta_id ||
            !gasto.transaccion_id
        ) {
            throw crearError(
                "El gasto pagado no tiene información financiera completa y no puede revertirse automáticamente.",
                409
            );
        }

        /* =================================================
           BUSCAR TRANSACCIÓN ORIGINAL
        ================================================= */

        const transaccionOriginalResult =
            await client.query(
                `
                SELECT
                    id,
                    cuenta_id,
                    tipo,
                    monto,
                    descripcion,
                    fecha,
                    obra_id,
                    control_diario_id,
                    origen_modulo,
                    origen_id
                FROM transacciones
                WHERE id = $1
                LIMIT 1
                `,
                [
                    gasto.transaccion_id
                ]
            );

        if (
            transaccionOriginalResult.rows.length ===
            0
        ) {
            throw crearError(
                "No se encontró la transacción financiera original del gasto.",
                409
            );
        }

        const transaccionOriginal =
            transaccionOriginalResult.rows[0];

        if (
            transaccionOriginal.tipo !==
            "egreso"
        ) {
            throw crearError(
                "La transacción original del gasto no corresponde a un egreso.",
                409
            );
        }

        if (
            transaccionOriginal.cuenta_id !==
            gasto.cuenta_id
        ) {
            throw crearError(
                "La cuenta financiera del gasto no coincide con la transacción original.",
                409
            );
        }

        /* =================================================
           EVITAR DOBLE REVERSIÓN
        ================================================= */

        const reversionExistenteResult =
            await client.query(
                `
                SELECT
                    id,
                    cuenta_id,
                    tipo,
                    monto,
                    fecha,
                    descripcion
                FROM transacciones
                WHERE origen_modulo = 'anulacion_gasto_obra'
                  AND origen_id = $1
                LIMIT 1
                `,
                [
                    gasto.id
                ]
            );

        if (
            reversionExistenteResult.rows.length >
            0
        ) {
            throw crearError(
                "Este gasto ya posee una reversión financiera registrada.",
                409
            );
        }

        /* =================================================
           BLOQUEAR CUENTA
        ================================================= */

        const cuenta =
            await obtenerCuentaParaMovimiento(
                client,
                gasto.cuenta_id
            );

        const monto =
            Number(
                gasto.monto
            );

        /* =================================================
           DEVOLVER DINERO A LA CUENTA
        ================================================= */

        const cuentaResult =
            await client.query(
                `
                UPDATE cuentas_financieras
                SET
                    saldo_actual =
                        saldo_actual + $1,

                    fecha_actualizacion =
                        NOW()

                WHERE id = $2

                RETURNING
                    id,
                    nombre,
                    tipo,
                    saldo_actual,
                    activo
                `,
                [
                    monto,
                    cuenta.id
                ]
            );

        const cuentaActualizada =
            cuentaResult.rows[0];

        /* =================================================
           CREAR TRANSACCIÓN DE REVERSIÓN

           IMPORTANTE:
           No eliminamos el egreso original.

           Creamos un ingreso compensatorio.
        ================================================= */

        const descripcionReversion =
            `Reversión de gasto de obra: ${gasto.descripcion}. Motivo: ${motivoLimpio}`;

        const reversionResult =
            await client.query(
                `
                INSERT INTO transacciones (
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
                VALUES (
                    $1,
                    'ingreso',
                    $2,
                    $3,
                    CURRENT_DATE,
                    $4,
                    $5,
                    $6,
                    'anulacion_gasto_obra',
                    $7
                )
                RETURNING *
                `,
                [
                    gasto.cuenta_id,
                    monto,
                    descripcionReversion,
                    gasto.transaccion_id,
                    gasto.obra_id,
                    gasto.control_diario_id,
                    gasto.id
                ]
            );

        const reversion =
            reversionResult.rows[0];

        /* =================================================
           MARCAR GASTO ANULADO
        ================================================= */

        const observacionesFinales =
            [
                gasto.observaciones,
                `ANULACIÓN: ${motivoLimpio}`,
                `TRANSACCIÓN DE REVERSIÓN: ${reversion.id}`
            ]
                .filter(Boolean)
                .join("\n");

        const gastoResult =
            await client.query(
                `
                UPDATE gastos_obra
                SET
                    estado = 'anulado',
                    observaciones = $1,
                    fecha_actualizacion = NOW()

                WHERE id = $2

                RETURNING *
                `,
                [
                    observacionesFinales,
                    gasto.id
                ]
            );

        await client.query(
            "COMMIT"
        );

        return {
            gasto:
                gastoResult.rows[0],

            cuenta:
                cuentaActualizada,

            transaccion_original:
                transaccionOriginal,

            reversion
        };

    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {
        client.release();
    }
};


/* =====================================================
   REPORTE DE GASTOS POR OBRA
===================================================== */

const reporteGastosPorObra = async (
    obraId,
    filtros = {}
) => {
    const {
        fecha_desde,
        fecha_hasta
    } = filtros;

    /* =================================================
       VALIDAR OBRA
    ================================================= */

    const obra =
        await obtenerObra(
            pool,
            obraId
        );

    const condiciones = [
        "g.obra_id = $1"
    ];

    const valores = [
        obraId
    ];

    let index = 2;

    if (fecha_desde) {
        condiciones.push(
            `g.fecha >= $${index}`
        );

        valores.push(
            fecha_desde
        );

        index++;
    }

    if (fecha_hasta) {
        condiciones.push(
            `g.fecha <= $${index}`
        );

        valores.push(
            fecha_hasta
        );

        index++;
    }

    const where =
        condiciones.join(
            " AND "
        );

    /* =================================================
       LISTADO
    ================================================= */

    const gastosResult =
        await pool.query(
            `
            SELECT
                g.id,
                g.tipo,
                g.descripcion,
                g.monto,
                g.fecha,
                g.fecha_pago,
                g.estado,
                g.metodo_pago,
                g.referencia,
                g.observaciones,

                g.control_diario_id,
                g.cuenta_id,
                g.transaccion_id,

                cd.fecha AS control_diario_fecha,
                cd.actividad AS control_diario_actividad,

                cf.nombre AS cuenta_nombre,
                cf.tipo AS cuenta_tipo

            FROM gastos_obra g

            LEFT JOIN controles_diarios cd
                ON cd.id = g.control_diario_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = g.cuenta_id

            WHERE ${where}

            ORDER BY
                g.fecha DESC,
                g.fecha_creacion DESC
            `,
            valores
        );

    /* =================================================
       RESUMEN
    ================================================= */

    const resumenResult =
        await pool.query(
            `
            SELECT
                COUNT(*)::INTEGER
                    AS total_registros,

                COUNT(*) FILTER (
                    WHERE estado = 'pendiente'
                )::INTEGER
                    AS gastos_pendientes,

                COUNT(*) FILTER (
                    WHERE estado = 'pagado'
                )::INTEGER
                    AS gastos_pagados,

                COUNT(*) FILTER (
                    WHERE estado = 'anulado'
                )::INTEGER
                    AS gastos_anulados,

                COALESCE(
                    SUM(monto) FILTER (
                        WHERE estado = 'pagado'
                    ),
                    0
                ) AS total_pagado,

                COALESCE(
                    SUM(monto) FILTER (
                        WHERE estado = 'pendiente'
                    ),
                    0
                ) AS total_pendiente

            FROM gastos_obra g

            WHERE ${where}
            `,
            valores
        );

    /* =================================================
       DISTRIBUCIÓN POR TIPO
    ================================================= */

    const tiposResult =
        await pool.query(
            `
            SELECT
                tipo,

                COUNT(*)::INTEGER
                    AS cantidad,

                COALESCE(
                    SUM(monto),
                    0
                ) AS total

            FROM gastos_obra g

            WHERE ${where}
              AND estado = 'pagado'

            GROUP BY tipo

            ORDER BY total DESC
            `,
            valores
        );

    const presupuesto =
        Number(
            obra.presupuesto || 0
        );

    const totalPagado =
        Number(
            resumenResult.rows[0]
                ?.total_pagado || 0
        );

    return {
        obra,

        resumen: {
            ...resumenResult.rows[0],

            presupuesto,

            total_gastos:
                totalPagado,

            presupuesto_restante:
                presupuesto -
                totalPagado,

            porcentaje_ejecutado:
                presupuesto > 0
                    ? Number(
                        (
                            (
                                totalPagado /
                                presupuesto
                            ) *
                            100
                        ).toFixed(2)
                    )
                    : 0
        },

        distribucion_tipos:
            tiposResult.rows,

        gastos:
            gastosResult.rows
    };
};


/* =====================================================
   RESUMEN GENERAL DE GASTOS
===================================================== */

const obtenerResumenGastos = async (
    filtros = {}
) => {
    const {
        obra_id,
        fecha_desde,
        fecha_hasta
    } = filtros;

    const condiciones = [];

    const valores = [];

    let index = 1;

    if (obra_id) {
        condiciones.push(
            `g.obra_id = $${index}`
        );

        valores.push(
            obra_id
        );

        index++;
    }

    if (fecha_desde) {
        condiciones.push(
            `g.fecha >= $${index}`
        );

        valores.push(
            fecha_desde
        );

        index++;
    }

    if (fecha_hasta) {
        condiciones.push(
            `g.fecha <= $${index}`
        );

        valores.push(
            fecha_hasta
        );

        index++;
    }

    const where =
        condiciones.length > 0
            ? `WHERE ${condiciones.join(
                " AND "
            )}`
            : "";

    /* =================================================
       KPIS
    ================================================= */

    const resumenResult =
        await pool.query(
            `
            SELECT
                COUNT(*)::INTEGER
                    AS total_registros,

                COUNT(
                    DISTINCT g.obra_id
                )::INTEGER
                    AS obras_con_gastos,

                COUNT(*) FILTER (
                    WHERE g.estado = 'pendiente'
                )::INTEGER
                    AS gastos_pendientes,

                COUNT(*) FILTER (
                    WHERE g.estado = 'pagado'
                )::INTEGER
                    AS gastos_pagados,

                COUNT(*) FILTER (
                    WHERE g.estado = 'anulado'
                )::INTEGER
                    AS gastos_anulados,

                COALESCE(
                    SUM(g.monto) FILTER (
                        WHERE g.estado = 'pagado'
                    ),
                    0
                ) AS total_pagado,

                COALESCE(
                    SUM(g.monto) FILTER (
                        WHERE g.estado = 'pendiente'
                    ),
                    0
                ) AS total_pendiente

            FROM gastos_obra g

            ${where}
            `,
            valores
        );

    /* =================================================
       DISTRIBUCIÓN POR TIPO
    ================================================= */

    const tiposResult =
        await pool.query(
            `
            SELECT
                g.tipo,

                COUNT(*)::INTEGER
                    AS cantidad,

                COALESCE(
                    SUM(g.monto),
                    0
                ) AS total

            FROM gastos_obra g

            ${where}
            ${where
                ? "AND"
                : "WHERE"
            }
                g.estado = 'pagado'

            GROUP BY
                g.tipo

            ORDER BY
                total DESC
            `,
            valores
        );

    /* =================================================
       DISTRIBUCIÓN POR OBRA
    ================================================= */

    const obrasResult =
        await pool.query(
            `
            SELECT
                o.id AS obra_id,
                o.codigo AS obra_codigo,
                o.nombre AS obra_nombre,

                COUNT(g.id)::INTEGER
                    AS cantidad_gastos,

                COALESCE(
                    SUM(g.monto),
                    0
                ) AS total

            FROM gastos_obra g

            INNER JOIN obras o
                ON o.id = g.obra_id

            ${where}
            ${where
                ? "AND"
                : "WHERE"
            }
                g.estado = 'pagado'

            GROUP BY
                o.id,
                o.codigo,
                o.nombre

            ORDER BY
                total DESC
            `,
            valores
        );

    return {
        resumen:
            resumenResult.rows[0],

        distribucion_tipos:
            tiposResult.rows,

        distribucion_obras:
            obrasResult.rows
    };
};


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    crearGastoObra,

    listarGastosObra,

    obtenerGastoObraPorId,

    actualizarGastoObra,

    confirmarGastoObra,

    anularGastoObra,

    reporteGastosPorObra,

    obtenerResumenGastos
};