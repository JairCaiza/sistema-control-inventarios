const { pool } = require("../../../config/db");

/* =====================================================
   ERROR PERSONALIZADO
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
   HELPERS
===================================================== */

const normalizarNumero = (
    value
) => {
    const numero = Number(
        value ?? 0
    );

    return Number.isFinite(numero)
        ? numero
        : 0;
};

/* =====================================================
   OBTENER OBRA
===================================================== */

const obtenerObra = async (
    db,
    obraId
) => {
    const result =
        await db.query(
            `
            SELECT
                o.id,
                o.codigo,
                o.nombre,
                o.ubicacion,
                o.fecha_inicio,
                o.fecha_fin,
                o.presupuesto,
                o.estado,
                o.cliente_id,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(c.nombre, ''),
                            ' ',
                            COALESCE(c.apellido, '')
                        )
                    ),
                    ''
                ) AS cliente_nombre

            FROM obras o

            LEFT JOIN clientes c
                ON c.id = o.cliente_id

            WHERE o.id = $1

            LIMIT 1
            `,
            [
                obraId
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "La obra no existe",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   RESUMEN GENERAL DE OBRAS
===================================================== */

const obtenerResumenGeneral =
    async (
        filtros = {}
    ) => {
        const {
            estado,
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 10
        } = filtros;

        const condiciones = [];
        const valores = [];

        let index = 1;

        /* =============================================
           ESTADO
        ============================================= */

        if (estado) {
            condiciones.push(
                `o.estado = $${index}`
            );

            valores.push(
                estado
            );

            index++;
        }

        /* =============================================
           FECHA DESDE
        ============================================= */

        if (fecha_desde) {
            condiciones.push(
                `o.fecha_inicio >= $${index}`
            );

            valores.push(
                fecha_desde
            );

            index++;
        }

        /* =============================================
           FECHA HASTA
        ============================================= */

        if (fecha_hasta) {
            condiciones.push(
                `o.fecha_inicio <= $${index}`
            );

            valores.push(
                fecha_hasta
            );

            index++;
        }

        /* =============================================
           BUSCADOR
        ============================================= */

        if (buscar) {
            condiciones.push(
                `
                (
                    o.nombre ILIKE $${index}

                    OR o.codigo ILIKE $${index}

                    OR TRIM(
                        CONCAT(
                            COALESCE(c.nombre, ''),
                            ' ',
                            COALESCE(c.apellido, '')
                        )
                    ) ILIKE $${index}

                    OR COALESCE(
                        o.ubicacion,
                        ''
                    ) ILIKE $${index}
                )
                `
            );

            valores.push(
                `%${buscar}%`
            );

            index++;
        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(
                    " AND "
                )}`
                : "";

        const offset =
            (
                Number(page) - 1
            ) *
            Number(limit);

        /* =============================================
           LISTADO
        ============================================= */

        const queryListado = `
            SELECT
                o.id,
                o.codigo,
                o.nombre,
                o.ubicacion,
                o.estado,
                o.fecha_inicio,
                o.fecha_fin,
                o.presupuesto,

                o.cliente_id,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(c.nombre, ''),
                            ' ',
                            COALESCE(c.apellido, '')
                        )
                    ),
                    ''
                ) AS cliente_nombre,

                COALESCE(
                    (
                        SELECT
                            SUM(go.monto)

                        FROM gastos_obra go

                        WHERE go.obra_id = o.id
                          AND go.estado = 'pagado'
                    ),
                    0
                ) AS gastos_pagados,

                COALESCE(
                    (
                        SELECT
                            SUM(go.monto)

                        FROM gastos_obra go

                        WHERE go.obra_id = o.id
                          AND go.estado = 'pendiente'
                    ),
                    0
                ) AS gastos_pendientes,

                COALESCE(
                    (
                        SELECT
                            SUM(pe.monto)

                        FROM pagos_empleados pe

                        WHERE pe.obra_id = o.id
                          AND pe.estado = 'pagado'
                    ),
                    0
                ) AS pagos_personal,

                COALESCE(
                    (
                        SELECT
                            COUNT(*)

                        FROM controles_diarios cd

                        WHERE cd.obra_id = o.id
                    ),
                    0
                ) AS controles_registrados,

                COALESCE(
                    (
                        SELECT
                            COUNT(*)

                        FROM empleados_obras eo

                        WHERE eo.obra_id = o.id
                          AND eo.activo = TRUE
                    ),
                    0
                ) AS empleados_activos

            FROM obras o

            LEFT JOIN clientes c
                ON c.id = o.cliente_id

            ${where}

            ORDER BY
                o.fecha_inicio DESC NULLS LAST,
                o.nombre ASC

            LIMIT $${index}
            OFFSET $${index + 1}
        `;

        const datos =
            await pool.query(
                queryListado,
                [
                    ...valores,
                    Number(limit),
                    offset
                ]
            );

        /* =============================================
           TOTAL REGISTROS
        ============================================= */

        const conteo =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int AS total

                FROM obras o

                LEFT JOIN clientes c
                    ON c.id = o.cliente_id

                ${where}
                `,
                valores
            );

        /* =============================================
           KPIS GENERALES
        ============================================= */

        const resumen =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int
                        AS total_obras,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'planificada'
                        )::int
                        AS planificadas,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'en_proceso'
                        )::int
                        AS en_proceso,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'pausada'
                        )::int
                        AS pausadas,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'finalizada'
                        )::int
                        AS finalizadas,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'cancelada'
                        )::int
                        AS canceladas,

                    COALESCE(
                        SUM(presupuesto),
                        0
                    ) AS presupuesto_total

                FROM obras
                `
            );

        const total =
            Number(
                conteo.rows[0]
                    ?.total ?? 0
            );

        return {
            resumen:
                resumen.rows[0],

            data:
                datos.rows,

            pagination: {
                page:
                    Number(page),

                limit:
                    Number(limit),

                total,

                totalPages:
                    Math.max(
                        1,
                        Math.ceil(
                            total /
                            Number(limit)
                        )
                    )
            }
        };
    };

/* =====================================================
   REPORTE COMPLETO DE UNA OBRA
===================================================== */

const obtenerReporteObra =
    async (
        obraId,
        filtros = {}
    ) => {
        const obra =
            await obtenerObra(
                pool,
                obraId
            );

        const {
            fecha_desde,
            fecha_hasta,
            incluir_gastos = true,
            incluir_personal = true,
            incluir_controles = true,
            incluir_finanzas = true
        } = filtros;

        const resultado = {
            obra,

            resumen_financiero:
                null,

            gastos:
                null,

            personal:
                null,

            controles:
                null,

            finanzas:
                null
        };

        /* =============================================
           RESUMEN FINANCIERO
        ============================================= */

        const resumenFinanciero =
            await pool.query(
                `
                SELECT

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.obra_id = $1
                              AND go.estado = 'pagado'

                              AND (
                                  $2::date IS NULL
                                  OR go.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR go.fecha <= $3
                              )
                        ),
                        0
                    ) AS gastos_pagados,

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.obra_id = $1
                              AND go.estado = 'pendiente'

                              AND (
                                  $2::date IS NULL
                                  OR go.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR go.fecha <= $3
                              )
                        ),
                        0
                    ) AS gastos_pendientes,

                    COALESCE(
                        (
                            SELECT
                                SUM(pe.monto)

                            FROM pagos_empleados pe

                            WHERE pe.obra_id = $1
                              AND pe.estado = 'pagado'

                              AND (
                                  $2::date IS NULL
                                  OR pe.fecha_pago >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR pe.fecha_pago <= $3
                              )
                        ),
                        0
                    ) AS pagos_personal,

                    COALESCE(
                        (
                            SELECT
                                SUM(t.monto)

                            FROM transacciones t

                            WHERE t.obra_id = $1
                              AND t.tipo = 'ingreso'

                              AND (
                                  $2::date IS NULL
                                  OR t.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR t.fecha <= $3
                              )
                        ),
                        0
                    ) AS ingresos,

                    COALESCE(
                        (
                            SELECT
                                SUM(t.monto)

                            FROM transacciones t

                            WHERE t.obra_id = $1
                              AND t.tipo = 'egreso'

                              AND (
                                  $2::date IS NULL
                                  OR t.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR t.fecha <= $3
                              )
                        ),
                        0
                    ) AS egresos
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        const financiero =
            resumenFinanciero.rows[0];

        const presupuesto =
            normalizarNumero(
                obra.presupuesto
            );

        const gastosPagados =
            normalizarNumero(
                financiero.gastos_pagados
            );

        const gastosPendientes =
            normalizarNumero(
                financiero.gastos_pendientes
            );

        const pagosPersonal =
            normalizarNumero(
                financiero.pagos_personal
            );

        const ingresos =
            normalizarNumero(
                financiero.ingresos
            );

        const egresos =
            normalizarNumero(
                financiero.egresos
            );

        /*
         * IMPORTANTE:
         *
         * No usamos "egresos" de transacciones
         * para calcular total_ejecutado.
         *
         * Gastos y pagos ya generan sus respectivas
         * transacciones financieras.
         *
         * Sumarlos nuevamente produciría
         * doble contabilización.
         */

        const totalEjecutado =
            gastosPagados +
            pagosPersonal;

        const comprometido =
            totalEjecutado +
            gastosPendientes;

        resultado.resumen_financiero = {
            presupuesto,

            gastos_pagados:
                gastosPagados,

            gastos_pendientes:
                gastosPendientes,

            pagos_personal:
                pagosPersonal,

            total_ejecutado:
                totalEjecutado,

            total_comprometido:
                comprometido,

            presupuesto_disponible:
                presupuesto -
                totalEjecutado,

            presupuesto_disponible_comprometido:
                presupuesto -
                comprometido,

            porcentaje_ejecutado:
                presupuesto > 0
                    ? Number(
                        (
                            (
                                totalEjecutado /
                                presupuesto
                            ) *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            porcentaje_comprometido:
                presupuesto > 0
                    ? Number(
                        (
                            (
                                comprometido /
                                presupuesto
                            ) *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            ingresos,

            egresos,

            flujo_neto:
                ingresos -
                egresos
        };

        /* =============================================
           GASTOS
        ============================================= */

        if (
            incluir_gastos
        ) {
            resultado.gastos =
                await obtenerGastosPorObra(
                    obraId,
                    {
                        fecha_desde,
                        fecha_hasta,
                        page: 1,
                        limit: 100
                    }
                );
        }

        /* =============================================
           PERSONAL
        ============================================= */

        if (
            incluir_personal
        ) {
            resultado.personal =
                await obtenerPersonalPorObra(
                    obraId,
                    {
                        fecha_desde,
                        fecha_hasta,
                        page: 1,
                        limit: 100
                    }
                );
        }

        /* =============================================
           CONTROLES
        ============================================= */

        if (
            incluir_controles
        ) {
            resultado.controles =
                await obtenerControlesPorObra(
                    obraId,
                    {
                        fecha_desde,
                        fecha_hasta,
                        page: 1,
                        limit: 100
                    }
                );
        }

        /* =============================================
           FINANZAS
        ============================================= */

        if (
            incluir_finanzas
        ) {
            resultado.finanzas =
                await obtenerFinanzasPorObra(
                    obraId,
                    {
                        fecha_desde,
                        fecha_hasta,
                        page: 1,
                        limit: 100
                    }
                );
        }

        return resultado;
    };

/* =====================================================
   GASTOS POR OBRA
===================================================== */

const obtenerGastosPorObra =
    async (
        obraId,
        filtros = {}
    ) => {
        await obtenerObra(
            pool,
            obraId
        );

        const {
            estado,
            tipo,
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 20
        } = filtros;

        const condiciones = [
            "go.obra_id = $1"
        ];

        const valores = [
            obraId
        ];

        let index = 2;

        /* =============================================
           ESTADO
        ============================================= */

        if (estado) {
            condiciones.push(
                `go.estado = $${index}`
            );

            valores.push(
                estado
            );

            index++;
        }

        /* =============================================
           TIPO
        ============================================= */

        if (tipo) {
            condiciones.push(
                `go.tipo = $${index}`
            );

            valores.push(
                tipo
            );

            index++;
        }

        /* =============================================
           FECHAS
        ============================================= */

        if (fecha_desde) {
            condiciones.push(
                `go.fecha >= $${index}`
            );

            valores.push(
                fecha_desde
            );

            index++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `go.fecha <= $${index}`
            );

            valores.push(
                fecha_hasta
            );

            index++;
        }

        /* =============================================
           BUSCADOR
        ============================================= */

        if (buscar) {
            condiciones.push(
                `
                (
                    go.descripcion ILIKE $${index}

                    OR COALESCE(
                        go.referencia,
                        ''
                    ) ILIKE $${index}

                    OR COALESCE(
                        go.observaciones,
                        ''
                    ) ILIKE $${index}
                )
                `
            );

            valores.push(
                `%${buscar}%`
            );

            index++;
        }

        const where =
            condiciones.join(
                " AND "
            );

        const offset =
            (
                Number(page) -
                1
            ) *
            Number(limit);

        /* =============================================
           DATOS
        ============================================= */

        const data =
            await pool.query(
                `
                SELECT
                    go.id,
                    go.obra_id,
                    go.control_diario_id,
                    go.tipo,
                    go.descripcion,
                    go.monto,
                    go.fecha,
                    go.cuenta_id,
                    go.transaccion_id,
                    go.fecha_pago,
                    go.metodo_pago,
                    go.estado,
                    go.referencia,
                    go.observaciones,
                    go.fecha_creacion,
                    go.fecha_actualizacion,

                    cf.nombre AS cuenta_nombre,
                    cf.tipo AS cuenta_tipo,

                    cd.fecha AS control_fecha,
                    cd.actividad AS control_actividad,
                    cd.descripcion AS control_descripcion,

                    t.tipo AS transaccion_tipo,
                    t.fecha AS transaccion_fecha,
                    t.descripcion AS transaccion_descripcion,
                    t.origen_modulo,
                    t.origen_id

                FROM gastos_obra go

                LEFT JOIN cuentas_financieras cf
                    ON cf.id = go.cuenta_id

                LEFT JOIN controles_diarios cd
                    ON cd.id = go.control_diario_id

                LEFT JOIN transacciones t
                    ON t.id = go.transaccion_id

                WHERE ${where}

                ORDER BY
                    go.fecha DESC,
                    go.fecha_creacion DESC

                LIMIT $${index}
                OFFSET $${index + 1}
                `,
                [
                    ...valores,
                    Number(limit),
                    offset
                ]
            );

        /* =============================================
           TOTAL
        ============================================= */

        const count =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int AS total

                FROM gastos_obra go

                WHERE ${where}
                `,
                valores
            );

        /* =============================================
           RESUMEN
        ============================================= */

        const resumen =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int
                        AS total_registros,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'pendiente'
                        )::int
                        AS pendientes,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'pagado'
                        )::int
                        AS pagados,

                    COUNT(*)
                        FILTER (
                            WHERE estado = 'anulado'
                        )::int
                        AS anulados,

                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE estado = 'pagado'
                            ),
                        0
                    ) AS total_pagado,

                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE estado = 'pendiente'
                            ),
                        0
                    ) AS total_pendiente

                FROM gastos_obra

                WHERE obra_id = $1

                  AND (
                      $2::date IS NULL
                      OR fecha >= $2
                  )

                  AND (
                      $3::date IS NULL
                      OR fecha <= $3
                  )
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        /* =============================================
           DISTRIBUCIÓN POR TIPO
        ============================================= */

        const distribucion =
            await pool.query(
                `
                SELECT
                    tipo,

                    COUNT(*)::int
                        AS cantidad,

                    COALESCE(
                        SUM(monto),
                        0
                    ) AS total

                FROM gastos_obra

                WHERE obra_id = $1

                  AND estado <> 'anulado'

                  AND (
                      $2::date IS NULL
                      OR fecha >= $2
                  )

                  AND (
                      $3::date IS NULL
                      OR fecha <= $3
                  )

                GROUP BY tipo

                ORDER BY
                    total DESC,
                    tipo ASC
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        const total =
            Number(
                count.rows[0]
                    ?.total ?? 0
            );

        return {
            resumen:
                resumen.rows[0],

            distribucion:
                distribucion.rows,

            data:
                data.rows,

            pagination: {
                page:
                    Number(page),

                limit:
                    Number(limit),

                total,

                totalPages:
                    Math.max(
                        1,
                        Math.ceil(
                            total /
                            Number(limit)
                        )
                    )
            }
        };
    };

/* =====================================================
   PERSONAL POR OBRA
===================================================== */

const obtenerPersonalPorObra =
    async (
        obraId,
        filtros = {}
    ) => {
        await obtenerObra(
            pool,
            obraId
        );

        const {
            activo,
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 20
        } = filtros;

        const condiciones = [
            "eo.obra_id = $1"
        ];

        const valores = [
            obraId
        ];

        let index = 2;

        /* =============================================
           ACTIVO
        ============================================= */

        if (
            activo !== undefined
        ) {
            condiciones.push(
                `eo.activo = $${index}`
            );

            valores.push(
                activo
            );

            index++;
        }

        /* =============================================
           FECHA DESDE
        ============================================= */

        if (fecha_desde) {
            condiciones.push(
                `
                COALESCE(
                    eo.fecha_inicio,
                    eo.fecha_asignacion
                ) >= $${index}
                `
            );

            valores.push(
                fecha_desde
            );

            index++;
        }

        /* =============================================
           FECHA HASTA
        ============================================= */

        if (fecha_hasta) {
            condiciones.push(
                `
                COALESCE(
                    eo.fecha_inicio,
                    eo.fecha_asignacion
                ) <= $${index}
                `
            );

            valores.push(
                fecha_hasta
            );

            index++;
        }

        /* =============================================
           BUSCADOR
        ============================================= */

        if (buscar) {
            condiciones.push(
                `
                (
                    e.nombres ILIKE $${index}

                    OR e.apellidos ILIKE $${index}

                    OR TRIM(
                        CONCAT(
                            e.nombres,
                            ' ',
                            e.apellidos
                        )
                    ) ILIKE $${index}

                    OR e.cedula ILIKE $${index}

                    OR COALESCE(
                        eo.cargo_obra,
                        ''
                    ) ILIKE $${index}
                )
                `
            );

            valores.push(
                `%${buscar}%`
            );

            index++;
        }

        const where =
            condiciones.join(
                " AND "
            );

        const offset =
            (
                Number(page) -
                1
            ) *
            Number(limit);

        /* =============================================
           PERSONAL
        ============================================= */

        const data =
            await pool.query(
                `
                SELECT
                    eo.id AS asignacion_id,
                    eo.obra_id,
                    eo.empleado_id,
                    eo.fecha_asignacion,
                    eo.fecha_inicio,
                    eo.fecha_fin,
                    eo.cargo_obra,
                    eo.salario_acordado,
                    eo.activo,
                    eo.observaciones,

                    e.cedula,
                    e.nombres,
                    e.apellidos,
                    e.telefono,
                    e.correo,
                    e.cargo,
                    e.tipo_pago,
                    e.salario_base,

                    COALESCE(
                        (
                            SELECT
                                SUM(pe.monto)

                            FROM pagos_empleados pe

                            WHERE pe.asignacion_id = eo.id
                              AND pe.estado = 'pagado'

                              AND (
                                  $${index}::date IS NULL
                                  OR pe.fecha_pago >= $${index}
                              )

                              AND (
                                  $${index + 1}::date IS NULL
                                  OR pe.fecha_pago <= $${index + 1}
                              )
                        ),
                        0
                    ) AS total_pagado,

                    COALESCE(
                        (
                            SELECT
                                COUNT(*)

                            FROM pagos_empleados pe

                            WHERE pe.asignacion_id = eo.id
                              AND pe.estado = 'pagado'

                              AND (
                                  $${index}::date IS NULL
                                  OR pe.fecha_pago >= $${index}
                              )

                              AND (
                                  $${index + 1}::date IS NULL
                                  OR pe.fecha_pago <= $${index + 1}
                              )
                        ),
                        0
                    )::int AS cantidad_pagos

                FROM empleados_obras eo

                INNER JOIN empleados e
                    ON e.id = eo.empleado_id

                WHERE ${where}

                ORDER BY
                    eo.activo DESC,
                    e.apellidos ASC,
                    e.nombres ASC

                LIMIT $${index + 2}
                OFFSET $${index + 3}
                `,
                [
                    ...valores,

                    fecha_desde ||
                    null,

                    fecha_hasta ||
                    null,

                    Number(limit),

                    offset
                ]
            );

        /* =============================================
           COUNT
        ============================================= */

        const count =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int AS total

                FROM empleados_obras eo

                INNER JOIN empleados e
                    ON e.id = eo.empleado_id

                WHERE ${where}
                `,
                valores
            );

        /* =============================================
           RESUMEN
        ============================================= */

        const resumen =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT eo.empleado_id
                    )::int
                        AS empleados_asignados,

                    COUNT(
                        DISTINCT eo.empleado_id
                    )
                        FILTER (
                            WHERE eo.activo = TRUE
                        )::int
                        AS empleados_activos,

                    COALESCE(
                        (
                            SELECT
                                SUM(pe.monto)

                            FROM pagos_empleados pe

                            WHERE pe.obra_id = $1
                              AND pe.estado = 'pagado'

                              AND (
                                  $2::date IS NULL
                                  OR pe.fecha_pago >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR pe.fecha_pago <= $3
                              )
                        ),
                        0
                    ) AS total_pagado_personal

                FROM empleados_obras eo

                WHERE eo.obra_id = $1
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        const total =
            Number(
                count.rows[0]
                    ?.total ?? 0
            );

        return {
            resumen:
                resumen.rows[0],

            data:
                data.rows,

            pagination: {
                page:
                    Number(page),

                limit:
                    Number(limit),

                total,

                totalPages:
                    Math.max(
                        1,
                        Math.ceil(
                            total /
                            Number(limit)
                        )
                    )
            }
        };
    };

/* =====================================================
   CONTROLES DIARIOS POR OBRA
===================================================== */

const obtenerControlesPorObra =
    async (
        obraId,
        filtros = {}
    ) => {
        await obtenerObra(
            pool,
            obraId
        );

        const {
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 20
        } = filtros;

        const condiciones = [
            "cd.obra_id = $1"
        ];

        const valores = [
            obraId
        ];

        let index = 2;

        if (fecha_desde) {
            condiciones.push(
                `cd.fecha >= $${index}`
            );

            valores.push(
                fecha_desde
            );

            index++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `cd.fecha <= $${index}`
            );

            valores.push(
                fecha_hasta
            );

            index++;
        }

        if (buscar) {
            condiciones.push(
                `
                (
                    COALESCE(
                        cd.actividad,
                        ''
                    ) ILIKE $${index}

                    OR COALESCE(
                        cd.descripcion,
                        ''
                    ) ILIKE $${index}

                    OR COALESCE(
                        cd.clima,
                        ''
                    ) ILIKE $${index}
                )
                `
            );

            valores.push(
                `%${buscar}%`
            );

            index++;
        }

        const where =
            condiciones.join(
                " AND "
            );

        const offset =
            (
                Number(page) -
                1
            ) *
            Number(limit);

        const data =
            await pool.query(
                `
                SELECT
                    cd.*,

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.control_diario_id = cd.id
                              AND go.estado = 'pagado'
                        ),
                        0
                    ) AS gastos_pagados,

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.control_diario_id = cd.id
                              AND go.estado = 'pendiente'
                        ),
                        0
                    ) AS gastos_pendientes

                FROM controles_diarios cd

                WHERE ${where}

                ORDER BY
                    cd.fecha DESC

                LIMIT $${index}
                OFFSET $${index + 1}
                `,
                [
                    ...valores,
                    Number(limit),
                    offset
                ]
            );

        const count =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int AS total

                FROM controles_diarios cd

                WHERE ${where}
                `,
                valores
            );

        const total =
            Number(
                count.rows[0]
                    ?.total ?? 0
            );

        return {
            data:
                data.rows,

            pagination: {
                page:
                    Number(page),

                limit:
                    Number(limit),

                total,

                totalPages:
                    Math.max(
                        1,
                        Math.ceil(
                            total /
                            Number(limit)
                        )
                    )
            }
        };
    };

/* =====================================================
   FINANZAS POR OBRA
===================================================== */

const obtenerFinanzasPorObra =
    async (
        obraId,
        filtros = {}
    ) => {
        await obtenerObra(
            pool,
            obraId
        );

        const {
            tipo,
            origen_modulo,
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 20
        } = filtros;

        const condiciones = [
            "t.obra_id = $1"
        ];

        const valores = [
            obraId
        ];

        let index = 2;

        /* =============================================
           TIPO TRANSACCIÓN
        ============================================= */

        if (tipo) {
            condiciones.push(
                `t.tipo = $${index}`
            );

            valores.push(
                tipo
            );

            index++;
        }

        /* =============================================
           ORIGEN
        ============================================= */

        if (
            origen_modulo
        ) {
            condiciones.push(
                `t.origen_modulo = $${index}`
            );

            valores.push(
                origen_modulo
            );

            index++;
        }

        /* =============================================
           FECHAS
        ============================================= */

        if (fecha_desde) {
            condiciones.push(
                `t.fecha >= $${index}`
            );

            valores.push(
                fecha_desde
            );

            index++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `t.fecha <= $${index}`
            );

            valores.push(
                fecha_hasta
            );

            index++;
        }

        /* =============================================
           BUSCAR
        ============================================= */

        if (buscar) {
            condiciones.push(
                `
                (
                    COALESCE(
                        t.descripcion,
                        ''
                    ) ILIKE $${index}

                    OR COALESCE(
                        t.origen_modulo,
                        ''
                    ) ILIKE $${index}

                    OR COALESCE(
                        cf.nombre,
                        ''
                    ) ILIKE $${index}
                )
                `
            );

            valores.push(
                `%${buscar}%`
            );

            index++;
        }

        const where =
            condiciones.join(
                " AND "
            );

        const offset =
            (
                Number(page) -
                1
            ) *
            Number(limit);

        /* =============================================
           TRANSACCIONES
        ============================================= */

        const data =
            await pool.query(
                `
                SELECT
                    t.id,
                    t.cuenta_id,
                    t.tipo,
                    t.monto,
                    t.descripcion,
                    t.fecha,
                    t.referencia_id,
                    t.fecha_creacion,
                    t.obra_id,
                    t.control_diario_id,
                    t.origen_modulo,
                    t.origen_id,

                    cf.nombre AS cuenta_nombre,
                    cf.tipo AS cuenta_tipo

                FROM transacciones t

                LEFT JOIN cuentas_financieras cf
                    ON cf.id = t.cuenta_id

                WHERE ${where}

                ORDER BY
                    t.fecha DESC,
                    t.fecha_creacion DESC

                LIMIT $${index}
                OFFSET $${index + 1}
                `,
                [
                    ...valores,
                    Number(limit),
                    offset
                ]
            );

        /* =============================================
           COUNT
        ============================================= */

        const count =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int AS total

                FROM transacciones t

                LEFT JOIN cuentas_financieras cf
                    ON cf.id = t.cuenta_id

                WHERE ${where}
                `,
                valores
            );

        /* =============================================
           RESUMEN FINANCIERO
        ============================================= */

        const resumen =
            await pool.query(
                `
                SELECT
                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE tipo = 'ingreso'
                            ),
                        0
                    ) AS ingresos,

                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE tipo = 'egreso'
                            ),
                        0
                    ) AS egresos,

                    COUNT(*)
                        FILTER (
                            WHERE tipo = 'ingreso'
                        )::int
                        AS cantidad_ingresos,

                    COUNT(*)
                        FILTER (
                            WHERE tipo = 'egreso'
                        )::int
                        AS cantidad_egresos

                FROM transacciones

                WHERE obra_id = $1

                  AND (
                      $2::date IS NULL
                      OR fecha >= $2
                  )

                  AND (
                      $3::date IS NULL
                      OR fecha <= $3
                  )
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        const resumenRow =
            resumen.rows[0];

        const ingresos =
            normalizarNumero(
                resumenRow.ingresos
            );

        const egresos =
            normalizarNumero(
                resumenRow.egresos
            );

        const total =
            Number(
                count.rows[0]
                    ?.total ?? 0
            );

        return {
            resumen: {
                ...resumenRow,

                flujo_neto:
                    ingresos -
                    egresos
            },

            data:
                data.rows,

            pagination: {
                page:
                    Number(page),

                limit:
                    Number(limit),

                total,

                totalPages:
                    Math.max(
                        1,
                        Math.ceil(
                            total /
                            Number(limit)
                        )
                    )
            }
        };
    };

/* =====================================================
   EVOLUCIÓN DE COSTOS
===================================================== */

const obtenerEvolucionCostos =
    async (
        obraId,
        filtros = {}
    ) => {
        await obtenerObra(
            pool,
            obraId
        );

        const {
            fecha_desde,
            fecha_hasta,
            agrupar_por = "mes"
        } = filtros;

        let trunc;

        switch (
        agrupar_por
        ) {
            case "dia":
                trunc = "day";
                break;

            case "semana":
                trunc = "week";
                break;

            case "mes":
            default:
                trunc = "month";
                break;
        }

        const result =
            await pool.query(
                `
                WITH movimientos AS (

                    SELECT
                        go.fecha,
                        go.monto,
                        'gasto_obra'::text
                            AS origen

                    FROM gastos_obra go

                    WHERE go.obra_id = $1
                      AND go.estado = 'pagado'

                      AND (
                          $2::date IS NULL
                          OR go.fecha >= $2
                      )

                      AND (
                          $3::date IS NULL
                          OR go.fecha <= $3
                      )

                    UNION ALL

                    SELECT
                        pe.fecha_pago AS fecha,
                        pe.monto,
                        'pago_empleado'::text
                            AS origen

                    FROM pagos_empleados pe

                    WHERE pe.obra_id = $1
                      AND pe.estado = 'pagado'
                      AND pe.fecha_pago IS NOT NULL

                      AND (
                          $2::date IS NULL
                          OR pe.fecha_pago >= $2
                      )

                      AND (
                          $3::date IS NULL
                          OR pe.fecha_pago <= $3
                      )
                )

                SELECT
                    DATE_TRUNC(
                        '${trunc}',
                        fecha
                    )::date AS periodo,

                    COALESCE(
                        SUM(monto),
                        0
                    ) AS total,

                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE origen = 'gasto_obra'
                            ),
                        0
                    ) AS gastos_obra,

                    COALESCE(
                        SUM(monto)
                            FILTER (
                                WHERE origen = 'pago_empleado'
                            ),
                        0
                    ) AS pagos_personal

                FROM movimientos

                GROUP BY
                    DATE_TRUNC(
                        '${trunc}',
                        fecha
                    )

                ORDER BY
                    periodo ASC
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        return {
            agrupar_por,

            data:
                result.rows
        };
    };

/* =====================================================
   PRESUPUESTO VS EJECUTADO
===================================================== */

const obtenerPresupuestoObra =
    async (
        obraId,
        filtros = {}
    ) => {
        const obra =
            await obtenerObra(
                pool,
                obraId
            );

        const {
            fecha_desde,
            fecha_hasta,
            incluir_pendientes = true
        } = filtros;

        const result =
            await pool.query(
                `
                SELECT

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.obra_id = $1
                              AND go.estado = 'pagado'

                              AND (
                                  $2::date IS NULL
                                  OR go.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR go.fecha <= $3
                              )
                        ),
                        0
                    ) AS gastos_pagados,

                    COALESCE(
                        (
                            SELECT
                                SUM(go.monto)

                            FROM gastos_obra go

                            WHERE go.obra_id = $1
                              AND go.estado = 'pendiente'

                              AND (
                                  $2::date IS NULL
                                  OR go.fecha >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR go.fecha <= $3
                              )
                        ),
                        0
                    ) AS gastos_pendientes,

                    COALESCE(
                        (
                            SELECT
                                SUM(pe.monto)

                            FROM pagos_empleados pe

                            WHERE pe.obra_id = $1
                              AND pe.estado = 'pagado'

                              AND (
                                  $2::date IS NULL
                                  OR pe.fecha_pago >= $2
                              )

                              AND (
                                  $3::date IS NULL
                                  OR pe.fecha_pago <= $3
                              )
                        ),
                        0
                    ) AS pagos_personal
                `,
                [
                    obraId,
                    fecha_desde || null,
                    fecha_hasta || null
                ]
            );

        const datos =
            result.rows[0];

        const presupuesto =
            normalizarNumero(
                obra.presupuesto
            );

        const gastosPagados =
            normalizarNumero(
                datos.gastos_pagados
            );

        const gastosPendientes =
            normalizarNumero(
                datos.gastos_pendientes
            );

        const pagosPersonal =
            normalizarNumero(
                datos.pagos_personal
            );

        const ejecutado =
            gastosPagados +
            pagosPersonal;

        const comprometido =
            incluir_pendientes
                ? ejecutado +
                gastosPendientes
                : ejecutado;

        return {
            obra: {
                id:
                    obra.id,

                codigo:
                    obra.codigo,

                nombre:
                    obra.nombre,

                estado:
                    obra.estado,

                presupuesto
            },

            gastos_pagados:
                gastosPagados,

            gastos_pendientes:
                gastosPendientes,

            pagos_personal:
                pagosPersonal,

            total_ejecutado:
                ejecutado,

            total_comprometido:
                comprometido,

            saldo_presupuesto:
                presupuesto -
                ejecutado,

            saldo_presupuesto_comprometido:
                presupuesto -
                comprometido,

            porcentaje_ejecutado:
                presupuesto > 0
                    ? Number(
                        (
                            (
                                ejecutado /
                                presupuesto
                            ) *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            porcentaje_comprometido:
                presupuesto > 0
                    ? Number(
                        (
                            (
                                comprometido /
                                presupuesto
                            ) *
                            100
                        ).toFixed(2)
                    )
                    : 0
        };
    };

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    obtenerResumenGeneral,
    obtenerReporteObra,
    obtenerGastosPorObra,
    obtenerPersonalPorObra,
    obtenerControlesPorObra,
    obtenerFinanzasPorObra,
    obtenerEvolucionCostos,
    obtenerPresupuestoObra
};