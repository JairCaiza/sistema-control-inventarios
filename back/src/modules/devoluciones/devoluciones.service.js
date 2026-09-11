const { pool } = require("../../config/db");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADO_ACTIVO = "activo";
const ESTADO_FINALIZADO = "finalizado";

/* =====================================================
   ERROR DE NEGOCIO
===================================================== */

const crearError = (
    message,
    statusCode = 400
) => {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
};

/* =====================================================
   NORMALIZAR NÚMERO
===================================================== */

const numero = (valor) => {
    const convertido =
        Number(valor ?? 0);

    return Number.isFinite(
        convertido
    )
        ? convertido
        : 0;
};

/* =====================================================
   REDONDEAR MONTO
===================================================== */

const monto = (valor) => {
    return Number(
        numero(valor).toFixed(2)
    );
};

/* =====================================================
   REGISTRAR DEVOLUCIÓN
===================================================== */

const registrar = async (
    data
) => {

    const client =
        await pool.connect();

    try {

        await client.query(
            "BEGIN"
        );

        /* =================================================
           1. VALIDAR DATOS BÁSICOS
        ================================================= */

        if (
            !data ||
            !data.contrato_id
        ) {
            throw crearError(
                "Debe seleccionar un contrato.",
                400
            );
        }

        if (
            !data.fecha_devolucion
        ) {
            throw crearError(
                "Debe indicar la fecha de devolución.",
                400
            );
        }

        /* =================================================
           2. OBTENER Y BLOQUEAR CONTRATO
        ================================================= */

        const contratoRes =
            await client.query(
                `
                SELECT
                    id,
                    numero_contrato,
                    fecha_inicio,
                    fecha_fin,
                    estado,
                    total,
                    pagado,
                    saldo_pendiente

                FROM contratos_alquiler

                WHERE id = $1

                LIMIT 1

                FOR UPDATE
                `,
                [
                    data.contrato_id
                ]
            );

        if (
            contratoRes.rowCount === 0
        ) {
            throw crearError(
                "El contrato seleccionado no existe.",
                404
            );
        }

        const contrato =
            contratoRes.rows[0];

        /* =================================================
           3. VALIDAR ESTADO DEL CONTRATO
        ================================================= */

        if (
            contrato.estado !==
            ESTADO_ACTIVO
        ) {

            if (
                contrato.estado ===
                ESTADO_FINALIZADO
            ) {
                throw crearError(
                    "No se puede registrar una devolución porque el contrato ya está finalizado.",
                    409
                );
            }

            throw crearError(
                `El contrato se encuentra en estado "${contrato.estado}" y no permite registrar una devolución.`,
                409
            );
        }

        /* =================================================
           4. VALIDAR DEVOLUCIÓN PREVIA
        ================================================= */

        const devolucionExiste =
            await client.query(
                `
                SELECT id

                FROM devoluciones

                WHERE contrato_id = $1

                LIMIT 1
                `,
                [
                    data.contrato_id
                ]
            );

        if (
            devolucionExiste.rowCount >
            0
        ) {
            throw crearError(
                "Este contrato ya tiene una devolución registrada.",
                409
            );
        }

        /* =================================================
           5. VALIDAR FECHA DE DEVOLUCIÓN
        ================================================= */

        const fechaValidacion =
            await client.query(
                `
                SELECT
                    $1::date
                        AS fecha_devolucion,

                    $2::date
                        AS fecha_inicio,

                    $3::date
                        AS fecha_fin,

                    CASE
                        WHEN $1::date < $2::date
                            THEN TRUE
                        ELSE FALSE
                    END
                        AS fecha_invalida,

                    GREATEST(
                        $1::date -
                        $3::date,
                        0
                    )::INTEGER
                        AS dias_retraso
                `,
                [
                    data.fecha_devolucion,
                    contrato.fecha_inicio,
                    contrato.fecha_fin
                ]
            );

        const calculoFecha =
            fechaValidacion.rows[0];

        if (
            calculoFecha
                .fecha_invalida ===
            true
        ) {
            throw crearError(
                "La fecha de devolución no puede ser anterior a la fecha de inicio del contrato.",
                400
            );
        }

        const diasRetraso =
            Number(
                calculoFecha
                    .dias_retraso ??
                0
            );

        /* =================================================
           6. OBTENER ACTIVOS DEL CONTRATO
        ================================================= */

        const activosRes =
            await client.query(
                `
                SELECT
                    dc.activo_id,
                    dc.cantidad,
                    dc.precio_diario,

                    a.nombre
                        AS activo_nombre,

                    a.codigo
                        AS activo_codigo

                FROM detalles_contrato dc

                INNER JOIN activos a
                    ON a.id =
                        dc.activo_id

                WHERE
                    dc.contrato_id =
                        $1
                `,
                [
                    data.contrato_id
                ]
            );

        if (
            activosRes.rowCount === 0
        ) {
            throw crearError(
                "El contrato no tiene activos asociados y no puede registrarse la devolución.",
                409
            );
        }

        /* =================================================
           7. CALCULAR PENALIDAD
        ================================================= */

        let penalidadTotal =
            0;

        if (
            diasRetraso > 0
        ) {

            for (
                const activo of
                activosRes.rows
            ) {

                const cantidad =
                    numero(
                        activo.cantidad
                    );

                const precioDiario =
                    numero(
                        activo
                            .precio_diario
                    );

                penalidadTotal +=
                    diasRetraso *
                    precioDiario *
                    cantidad;
            }
        }

        penalidadTotal =
            monto(
                penalidadTotal
            );

        /* =================================================
           8. INSERTAR DEVOLUCIÓN
        ================================================= */

        const insertRes =
            await client.query(
                `
                INSERT INTO devoluciones (
                    contrato_id,
                    fecha_devolucion,
                    dias_retraso,
                    penalidad_total
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )

                RETURNING *
                `,
                [
                    data.contrato_id,
                    data.fecha_devolucion,
                    diasRetraso,
                    penalidadTotal
                ]
            );

        const devolucion =
            insertRes.rows[0];

        /* =================================================
           9. FINALIZAR CONTRATO
              + PENALIDAD PENDIENTE
        ================================================= */

        const contratoActualizado =
            await client.query(
                `
                UPDATE contratos_alquiler

                SET
                    estado =
                        $2,

                    saldo_pendiente =
                        COALESCE(
                            saldo_pendiente,
                            0
                        ) + $3

                WHERE id = $1

                RETURNING
                    id,
                    numero_contrato,
                    estado,
                    total,
                    pagado,
                    saldo_pendiente
                `,
                [
                    data.contrato_id,
                    ESTADO_FINALIZADO,
                    penalidadTotal
                ]
            );

        /* =================================================
           10. DEVOLVER STOCK
        ================================================= */

        for (
            const activo of
            activosRes.rows
        ) {

            const cantidad =
                numero(
                    activo.cantidad
                );

            /* =============================================
               DEVOLVER CANTIDAD
            ============================================= */

            await client.query(
                `
                UPDATE activos

                SET
                    cantidad_total =
                        cantidad_total + $1,

                    estado =
                        'disponible'

                WHERE id = $2
                `,
                [
                    cantidad,
                    activo.activo_id
                ]
            );

            /* =============================================
               KARDEX / MOVIMIENTO DE ENTRADA
            ============================================= */

            await client.query(
                `
                INSERT INTO movimientos_inventario (
                    activo_id,
                    tipo_movimiento,
                    cantidad,
                    motivo,
                    referencia
                )

                VALUES (
                    $1,
                    'entrada',
                    $2,
                    $3,
                    $4
                )
                `,
                [
                    activo.activo_id,

                    cantidad,

                    "Devolución de contrato",

                    `Contrato ${contrato
                        .numero_contrato ||
                    data.contrato_id
                    }`
                ]
            );
        }

        /* =================================================
           11. COMMIT
        ================================================= */

        await client.query(
            "COMMIT"
        );

        /* =================================================
           12. RESPUESTA
        ================================================= */

        return {
            ...devolucion,

            numero_contrato:
                contrato
                    .numero_contrato,

            valor_contrato:
                monto(
                    contrato.total
                ),

            penalidad_total:
                penalidadTotal,

            total_generado:
                monto(
                    numero(
                        contrato.total
                    ) +
                    penalidadTotal
                ),

            contrato:
                contratoActualizado
                    .rows[0],

            mensaje:
                penalidadTotal > 0
                    ? "Devolución registrada correctamente. El contrato fue finalizado y la penalidad quedó pendiente de cobro."
                    : "Devolución registrada correctamente. El contrato fue finalizado sin penalidad."
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
   LISTAR DEVOLUCIONES
===================================================== */

const listar = async () => {

    const result =
        await pool.query(
            `
            SELECT
                d.id,

                d.contrato_id,

                d.fecha_devolucion,

                d.dias_retraso,

                d.penalidad_total,

                c.numero_contrato,

                c.total
                    AS valor_contrato,

                c.pagado
                    AS contrato_pagado,

                c.saldo_pendiente,

                c.estado
                    AS estado_contrato,

                cl.nombre
                    AS cliente,

                /* =====================================
                   TOTAL GENERADO POR EL CONTRATO
                   ALQUILER + PENALIDAD
                ===================================== */

                (
                    COALESCE(
                        c.total,
                        0
                    ) +
                    COALESCE(
                        d.penalidad_total,
                        0
                    )
                )::NUMERIC
                    AS total_generado,

                /* =====================================
                   TODOS LOS PAGOS DEL CONTRATO
                ===================================== */

                COALESCE(
                    pagos.total_cobrado,
                    0
                )::NUMERIC
                    AS total_cobrado,

                /* =====================================
                   PAGOS IDENTIFICADOS COMO PENALIDAD
                ===================================== */

                LEAST(
                    COALESCE(
                        pagos.penalidad_pagada,
                        0
                    ),
                    COALESCE(
                        d.penalidad_total,
                        0
                    )
                )::NUMERIC
                    AS penalidad_pagada,

                /* =====================================
                   PENALIDAD PENDIENTE
                ===================================== */

                GREATEST(
                    COALESCE(
                        d.penalidad_total,
                        0
                    ) -
                    COALESCE(
                        pagos.penalidad_pagada,
                        0
                    ),
                    0
                )::NUMERIC
                    AS penalidad_pendiente,

                /* =====================================
                   ESTADO DE LA PENALIDAD
                ===================================== */

                CASE

                    WHEN
                        COALESCE(
                            d.penalidad_total,
                            0
                        ) <= 0

                        THEN
                            'sin_penalidad'

                    WHEN
                        COALESCE(
                            pagos.penalidad_pagada,
                            0
                        ) <= 0

                        THEN
                            'pendiente'

                    WHEN
                        COALESCE(
                            pagos.penalidad_pagada,
                            0
                        ) <
                        COALESCE(
                            d.penalidad_total,
                            0
                        )

                        THEN
                            'parcial'

                    ELSE
                        'pagada'

                END
                    AS estado_penalidad

            FROM devoluciones d

            INNER JOIN contratos_alquiler c
                ON c.id =
                    d.contrato_id

            INNER JOIN clientes cl
                ON cl.id =
                    c.cliente_id

            /* =========================================
               RESUMEN DE PAGOS DEL CONTRATO
            ========================================= */

            LEFT JOIN LATERAL (
                SELECT

                    COALESCE(
                        SUM(
                            pc.monto
                        ),
                        0
                    )::NUMERIC
                        AS total_cobrado,

                    COALESCE(
                        SUM(
                            pc.monto
                        ) FILTER (
                            WHERE
                                pc.concepto =
                                    'penalidad'
                        ),
                        0
                    )::NUMERIC
                        AS penalidad_pagada

                FROM pagos_contratos pc

                WHERE
                    pc.contrato_id =
                        d.contrato_id

            ) pagos
                ON TRUE

            ORDER BY
                d.fecha_devolucion DESC,
                d.id DESC
            `
        );

    return result.rows.map(
        (row) => ({
            ...row,

            dias_retraso:
                numero(
                    row.dias_retraso
                ),

            valor_contrato:
                monto(
                    row.valor_contrato
                ),

            penalidad_total:
                monto(
                    row.penalidad_total
                ),

            total_generado:
                monto(
                    row.total_generado
                ),

            total_cobrado:
                monto(
                    row.total_cobrado
                ),

            contrato_pagado:
                monto(
                    row.contrato_pagado
                ),

            saldo_pendiente:
                monto(
                    row.saldo_pendiente
                ),

            penalidad_pagada:
                monto(
                    row.penalidad_pagada
                ),

            penalidad_pendiente:
                monto(
                    row.penalidad_pendiente
                )
        })
    );
};

/* =====================================================
   OBTENER DEVOLUCIÓN POR ID
===================================================== */

const obtenerPorId = async (
    id
) => {

    const result =
        await pool.query(
            `
            SELECT
                d.id,

                d.contrato_id,

                d.fecha_devolucion,

                d.dias_retraso,

                d.penalidad_total,

                c.numero_contrato,

                c.total
                    AS valor_contrato,

                c.pagado
                    AS contrato_pagado,

                c.saldo_pendiente,

                c.estado
                    AS estado_contrato,

                cl.nombre
                    AS cliente,

                (
                    COALESCE(
                        c.total,
                        0
                    ) +
                    COALESCE(
                        d.penalidad_total,
                        0
                    )
                )::NUMERIC
                    AS total_generado,

                COALESCE(
                    pagos.total_cobrado,
                    0
                )::NUMERIC
                    AS total_cobrado,

                LEAST(
                    COALESCE(
                        pagos.penalidad_pagada,
                        0
                    ),
                    COALESCE(
                        d.penalidad_total,
                        0
                    )
                )::NUMERIC
                    AS penalidad_pagada,

                GREATEST(
                    COALESCE(
                        d.penalidad_total,
                        0
                    ) -
                    COALESCE(
                        pagos.penalidad_pagada,
                        0
                    ),
                    0
                )::NUMERIC
                    AS penalidad_pendiente,

                CASE

                    WHEN
                        COALESCE(
                            d.penalidad_total,
                            0
                        ) <= 0

                        THEN
                            'sin_penalidad'

                    WHEN
                        COALESCE(
                            pagos.penalidad_pagada,
                            0
                        ) <= 0

                        THEN
                            'pendiente'

                    WHEN
                        COALESCE(
                            pagos.penalidad_pagada,
                            0
                        ) <
                        COALESCE(
                            d.penalidad_total,
                            0
                        )

                        THEN
                            'parcial'

                    ELSE
                        'pagada'

                END
                    AS estado_penalidad

            FROM devoluciones d

            INNER JOIN contratos_alquiler c
                ON c.id =
                    d.contrato_id

            INNER JOIN clientes cl
                ON cl.id =
                    c.cliente_id

            LEFT JOIN LATERAL (
                SELECT

                    COALESCE(
                        SUM(
                            pc.monto
                        ),
                        0
                    )::NUMERIC
                        AS total_cobrado,

                    COALESCE(
                        SUM(
                            pc.monto
                        ) FILTER (
                            WHERE
                                pc.concepto =
                                    'penalidad'
                        ),
                        0
                    )::NUMERIC
                        AS penalidad_pagada

                FROM pagos_contratos pc

                WHERE
                    pc.contrato_id =
                        d.contrato_id

            ) pagos
                ON TRUE

            WHERE
                d.id = $1

            LIMIT 1
            `,
            [
                id
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "La devolución no existe.",
            404
        );
    }

    const row =
        result.rows[0];

    return {
        ...row,

        dias_retraso:
            numero(
                row.dias_retraso
            ),

        valor_contrato:
            monto(
                row.valor_contrato
            ),

        penalidad_total:
            monto(
                row.penalidad_total
            ),

        total_generado:
            monto(
                row.total_generado
            ),

        total_cobrado:
            monto(
                row.total_cobrado
            ),

        contrato_pagado:
            monto(
                row.contrato_pagado
            ),

        saldo_pendiente:
            monto(
                row.saldo_pendiente
            ),

        penalidad_pagada:
            monto(
                row.penalidad_pagada
            ),

        penalidad_pendiente:
            monto(
                row.penalidad_pendiente
            )
    };
};

/* =====================================================
   RESUMEN GENERAL DE DEVOLUCIONES
===================================================== */

const obtenerResumen = async () => {

    const result =
        await pool.query(
            `
            SELECT

                COUNT(*)::INTEGER
                    AS total_devoluciones,

                COUNT(*) FILTER (
                    WHERE
                        d.dias_retraso = 0
                )::INTEGER
                    AS sin_retraso,

                COUNT(*) FILTER (
                    WHERE
                        d.dias_retraso > 0
                )::INTEGER
                    AS con_retraso,

                COALESCE(
                    SUM(
                        d.penalidad_total
                    ),
                    0
                )::NUMERIC
                    AS penalidades_generadas,

                COALESCE(
                    SUM(
                        LEAST(
                            COALESCE(
                                pagos.penalidad_pagada,
                                0
                            ),
                            COALESCE(
                                d.penalidad_total,
                                0
                            )
                        )
                    ),
                    0
                )::NUMERIC
                    AS penalidades_cobradas,

                COALESCE(
                    SUM(
                        GREATEST(
                            COALESCE(
                                d.penalidad_total,
                                0
                            ) -
                            COALESCE(
                                pagos.penalidad_pagada,
                                0
                            ),
                            0
                        )
                    ),
                    0
                )::NUMERIC
                    AS penalidades_pendientes,

                COALESCE(
                    SUM(
                        COALESCE(
                            c.total,
                            0
                        ) +
                        COALESCE(
                            d.penalidad_total,
                            0
                        )
                    ),
                    0
                )::NUMERIC
                    AS total_generado

            FROM devoluciones d

            INNER JOIN contratos_alquiler c
                ON c.id =
                    d.contrato_id

            LEFT JOIN LATERAL (
                SELECT

                    COALESCE(
                        SUM(
                            pc.monto
                        ) FILTER (
                            WHERE
                                pc.concepto =
                                    'penalidad'
                        ),
                        0
                    )::NUMERIC
                        AS penalidad_pagada

                FROM pagos_contratos pc

                WHERE
                    pc.contrato_id =
                        d.contrato_id

            ) pagos
                ON TRUE
            `
        );

    const row =
        result.rows[0];

    return {
        total_devoluciones:
            numero(
                row.total_devoluciones
            ),

        sin_retraso:
            numero(
                row.sin_retraso
            ),

        con_retraso:
            numero(
                row.con_retraso
            ),

        penalidades_generadas:
            monto(
                row.penalidades_generadas
            ),

        penalidades_cobradas:
            monto(
                row.penalidades_cobradas
            ),

        penalidades_pendientes:
            monto(
                row.penalidades_pendientes
            ),

        total_generado:
            monto(
                row.total_generado
            )
    };
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    registrar,
    listar,
    obtenerPorId,
    obtenerResumen
};