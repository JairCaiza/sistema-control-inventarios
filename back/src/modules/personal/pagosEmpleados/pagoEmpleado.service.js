const { pool } = require("../../../config/db");

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADO_PENDIENTE = "pendiente";
const ESTADO_PAGADO = "pagado";
const ESTADO_ANULADO = "anulado";

const ORIGEN_PAGO_EMPLEADO = "pago_empleado";
const ORIGEN_ANULACION_PAGO_EMPLEADO =
    "anulacion_pago_empleado";

/* =====================================================
   ERROR DE NEGOCIO
===================================================== */

const crearError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);

    error.statusCode =
        statusCode;

    return error;
};

/* =====================================================
   NORMALIZAR NÚMEROS
===================================================== */

const numero = (valor) => {
    if (
        valor === null ||
        valor === undefined
    ) {
        return 0;
    }

    const convertido =
        Number(valor);

    return Number.isFinite(
        convertido
    )
        ? convertido
        : 0;
};

/* =====================================================
   OBTENER EMPLEADO
===================================================== */

const obtenerEmpleado = async (
    client,
    empleadoId
) => {
    const result =
        await client.query(
            `
            SELECT
                id,
                nombres,
                apellidos,
                cedula,
                cargo,
                tipo_pago,
                salario_base,
                activo
            FROM empleados
            WHERE id = $1
            LIMIT 1
            `,
            [empleadoId]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "El empleado seleccionado no existe.",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR EMPLEADO ACTIVO
===================================================== */

const validarEmpleadoActivo =
    async (
        client,
        empleadoId
    ) => {
        const empleado =
            await obtenerEmpleado(
                client,
                empleadoId
            );

        if (
            empleado.activo !== true
        ) {
            throw crearError(
                "No se puede registrar un pago para un empleado inactivo.",
                409
            );
        }

        return empleado;
    };

/* =====================================================
   OBTENER OBRA
===================================================== */

const obtenerObra = async (
    client,
    obraId
) => {
    if (!obraId) {
        return null;
    }

    const result =
        await client.query(
            `
            SELECT
                id,
                codigo,
                nombre,
                estado
            FROM obras
            WHERE id = $1
            LIMIT 1
            `,
            [obraId]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "La obra seleccionada no existe.",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR / RESOLVER ASIGNACIÓN
===================================================== */

const resolverAsignacion = async (
    client,
    empleadoId,
    obraId,
    asignacionId = null
) => {
    /*
     * Empleado sin obra.
     */
    if (!obraId) {
        if (asignacionId) {
            throw crearError(
                "No puede existir una asignación sin una obra asociada.",
                400
            );
        }

        return null;
    }

    /*
     * Comprobamos que la obra exista.
     */
    await obtenerObra(
        client,
        obraId
    );

    /*
     * Si el frontend envió una asignación,
     * verificamos que corresponda exactamente
     * al empleado y a la obra.
     */
    if (asignacionId) {
        const result =
            await client.query(
                `
                SELECT
                    eo.id,
                    eo.obra_id,
                    eo.empleado_id,
                    eo.activo,
                    eo.cargo_obra,
                    eo.fecha_inicio,
                    eo.fecha_fin,
                    eo.salario_acordado
                FROM empleados_obras eo
                WHERE eo.id = $1
                LIMIT 1
                `,
                [asignacionId]
            );

        if (
            result.rowCount === 0
        ) {
            throw crearError(
                "La asignación seleccionada no existe.",
                404
            );
        }

        const asignacion =
            result.rows[0];

        if (
            asignacion.empleado_id !==
            empleadoId
        ) {
            throw crearError(
                "La asignación no pertenece al empleado seleccionado.",
                409
            );
        }

        if (
            asignacion.obra_id !==
            obraId
        ) {
            throw crearError(
                "La asignación no pertenece a la obra seleccionada.",
                409
            );
        }

        return asignacion;
    }

    /*
     * Si hay obra pero no se mandó asignacion_id,
     * intentamos encontrar automáticamente
     * la asignación activa del empleado.
     */
    const result =
        await client.query(
            `
            SELECT
                eo.id,
                eo.obra_id,
                eo.empleado_id,
                eo.activo,
                eo.cargo_obra,
                eo.fecha_inicio,
                eo.fecha_fin,
                eo.salario_acordado
            FROM empleados_obras eo
            WHERE eo.empleado_id = $1
              AND eo.obra_id = $2
              AND eo.activo = TRUE
            ORDER BY
                eo.fecha_asignacion DESC NULLS LAST,
                eo.fecha_inicio DESC NULLS LAST
            LIMIT 1
            `,
            [
                empleadoId,
                obraId
            ]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "El empleado no tiene una asignación activa en la obra seleccionada.",
            409
        );
    }

    return result.rows[0];
};

/* =====================================================
   OBTENER CUENTA FINANCIERA
===================================================== */

const obtenerCuentaFinanciera =
    async (
        client,
        cuentaId,
        bloquear = false
    ) => {
        const lock =
            bloquear
                ? "FOR UPDATE"
                : "";

        const result =
            await client.query(
                `
                SELECT
                    id,
                    nombre,
                    tipo,
                    saldo_actual,
                    activo
                FROM cuentas_financieras
                WHERE id = $1
                LIMIT 1
                ${lock}
                `,
                [cuentaId]
            );

        if (
            result.rowCount === 0
        ) {
            throw crearError(
                "La cuenta financiera seleccionada no existe.",
                404
            );
        }

        const cuenta =
            result.rows[0];

        if (
            cuenta.activo !== true
        ) {
            throw crearError(
                "La cuenta financiera seleccionada está inactiva.",
                409
            );
        }

        return cuenta;
    };

/* =====================================================
   OBTENER PAGO POR ID
   INTERNO
===================================================== */

const obtenerPagoInterno = async (
    client,
    id,
    bloquear = false
) => {
    const lock =
        bloquear
            ? "FOR UPDATE"
            : "";

    const result =
        await client.query(
            `
            SELECT
                pe.*
            FROM pagos_empleados pe
            WHERE pe.id = $1
            LIMIT 1
            ${lock}
            `,
            [id]
        );

    if (
        result.rowCount === 0
    ) {
        throw crearError(
            "El pago de empleado no existe.",
            404
        );
    }

    return result.rows[0];
};

/* =====================================================
   VALIDAR PERÍODO DE PAGO DISPONIBLE
===================================================== */

const validarPeriodoPagoDisponible = async (
    client,
    {
        empleado_id,
        obra_id = null,
        fecha_inicio_periodo = null,
        fecha_fin_periodo = null,
        excluir_pago_id = null
    }
) => {
    /*
     * Si ambas fechas están vacías dejamos pasar por
     * compatibilidad con registros antiguos.
     *
     * Más adelante el schema obligará las fechas para
     * pagos nuevos.
     */
    if (
        !fecha_inicio_periodo &&
        !fecha_fin_periodo
    ) {
        return null;
    }

    /*
     * No permitimos que llegue solamente una de las fechas.
     */
    if (
        !fecha_inicio_periodo ||
        !fecha_fin_periodo
    ) {
        throw crearError(
            "Debe indicar tanto la fecha de inicio como la fecha de fin del período.",
            400
        );
    }

    const inicio =
        new Date(
            fecha_inicio_periodo
        );

    const fin =
        new Date(
            fecha_fin_periodo
        );

    if (
        Number.isNaN(
            inicio.getTime()
        ) ||
        Number.isNaN(
            fin.getTime()
        )
    ) {
        throw crearError(
            "Las fechas del período no son válidas.",
            400
        );
    }

    if (
        fin < inicio
    ) {
        throw crearError(
            "La fecha de fin del período no puede ser anterior a la fecha de inicio.",
            400
        );
    }

    /*
     * Bloqueo lógico por empleado + obra durante
     * esta transacción.
     *
     * Esto ayuda a evitar dos registros simultáneos
     * para el mismo empleado y obra.
     */
    const claveBloqueo =
        `${empleado_id}:${obra_id || "sin_obra"}`;

    await client.query(
        `
        SELECT pg_advisory_xact_lock(
            hashtext($1)
        )
        `,
        [
            claveBloqueo
        ]
    );

    const condiciones = [
        "pe.empleado_id = $1",

        /*
         * Un pago pendiente ya reserva ese período.
         * Un pago pagado también lo reserva.
         *
         * Los anulados no bloquean.
         */
        "pe.estado <> 'anulado'",

        /*
         * Detectar cualquier solapamiento.
         *
         * Ejemplo:
         *
         * Existente: 07/09 - 13/09
         * Nuevo:     10/09 - 10/09
         *
         * También se considera conflicto.
         */
        `
        pe.fecha_inicio_periodo IS NOT NULL
        AND pe.fecha_fin_periodo IS NOT NULL
        AND pe.fecha_inicio_periodo <= $3::date
        AND pe.fecha_fin_periodo >= $2::date
        `
    ];

    const valores = [
        empleado_id,
        fecha_inicio_periodo,
        fecha_fin_periodo
    ];

    let indice = 4;

    /*
     * Los pagos se comparan dentro de la misma obra.
     *
     * Esto permite que un empleado pueda tener,
     * si realmente corresponde, pagos asociados
     * a obras distintas durante el mismo período.
     */
    if (obra_id) {
        condiciones.push(
            `pe.obra_id = $${indice}`
        );

        valores.push(
            obra_id
        );

        indice++;
    } else {
        /*
         * Pago administrativo / sin obra.
         */
        condiciones.push(
            "pe.obra_id IS NULL"
        );
    }

    /*
     * Al editar debemos excluir el propio pago.
     */
    if (excluir_pago_id) {
        condiciones.push(
            `pe.id <> $${indice}`
        );

        valores.push(
            excluir_pago_id
        );

        indice++;
    }

    const result =
        await client.query(
            `
            SELECT
                pe.id,
                pe.tipo_pago,
                pe.periodo_descripcion,
                pe.fecha_inicio_periodo,
                pe.fecha_fin_periodo,
                pe.monto,
                pe.estado,

                o.codigo
                    AS obra_codigo,

                o.nombre
                    AS obra_nombre

            FROM pagos_empleados pe

            LEFT JOIN obras o
                ON o.id =
                    pe.obra_id

            WHERE
                ${condiciones.join(
                "\nAND "
            )}

            ORDER BY
                pe.fecha_inicio_periodo ASC,
                pe.fecha_creacion ASC

            LIMIT 1
            `,
            valores
        );

    if (
        result.rowCount > 0
    ) {
        const pagoExistente =
            result.rows[0];

        const inicioExistente =
            pagoExistente
                .fecha_inicio_periodo;

        const finExistente =
            pagoExistente
                .fecha_fin_periodo;

        const estado =
            pagoExistente.estado ===
                ESTADO_PAGADO
                ? "pagado"
                : "pendiente";

        throw crearError(
            `El empleado ya tiene un pago ${estado} que coincide total o parcialmente con el período seleccionado (${inicioExistente} al ${finExistente}). Revise el registro "${pagoExistente.periodo_descripcion}".`,
            409
        );
    }

    return null;
};
/* =====================================================
   CREAR PAGO PENDIENTE
===================================================== */

/* =====================================================
   CREAR PAGO PENDIENTE
===================================================== */

const crearPagoEmpleado = async (
    data
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const {
            empleado_id,
            obra_id = null,
            asignacion_id = null,
            tipo_pago,
            periodo_descripcion,
            fecha_inicio_periodo = null,
            fecha_fin_periodo = null,
            monto,
            referencia = null,
            observaciones = null
        } = data;

        /* =============================================
           VALIDACIONES BÁSICAS
        ============================================= */

        if (
            !empleado_id
        ) {
            throw crearError(
                "Debe seleccionar un empleado.",
                400
            );
        }

        if (
            !tipo_pago
        ) {
            throw crearError(
                "Debe indicar el tipo de pago.",
                400
            );
        }

        if (
            !periodo_descripcion ||
            !String(
                periodo_descripcion
            ).trim()
        ) {
            throw crearError(
                "Debe indicar la descripción del período.",
                400
            );
        }

        const montoNumero =
            numero(
                monto
            );

        if (
            montoNumero <= 0
        ) {
            throw crearError(
                "El monto del pago debe ser mayor a cero.",
                400
            );
        }

        /* =============================================
           VALIDAR EMPLEADO
        ============================================= */

        await validarEmpleadoActivo(
            client,
            empleado_id
        );

        /* =============================================
           RESOLVER OBRA / ASIGNACIÓN
        ============================================= */

        const asignacion =
            await resolverAsignacion(
                client,
                empleado_id,
                obra_id,
                asignacion_id
            );

        const asignacionFinalId =
            asignacion
                ? asignacion.id
                : null;

        /* =============================================
           VALIDAR PERÍODO NO DUPLICADO
        ============================================= */

        await validarPeriodoPagoDisponible(
            client,
            {
                empleado_id,
                obra_id,
                fecha_inicio_periodo,
                fecha_fin_periodo
            }
        );

        /* =============================================
           CREAR PAGO
           SIEMPRE PENDIENTE
           NO AFECTA FINANZAS
        ============================================= */

        const result =
            await client.query(
                `
                INSERT INTO pagos_empleados (
                    empleado_id,
                    obra_id,
                    asignacion_id,
                    cuenta_id,
                    transaccion_id,
                    tipo_pago,
                    periodo_descripcion,
                    fecha_inicio_periodo,
                    fecha_fin_periodo,
                    monto,
                    fecha_pago,
                    metodo_pago,
                    estado,
                    referencia,
                    observaciones,
                    fecha_creacion,
                    fecha_actualizacion
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    NULL,
                    NULL,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    NULL,
                    NULL,
                    $9,
                    $10,
                    $11,
                    NOW(),
                    NOW()
                )
                RETURNING *
                `,
                [
                    empleado_id,
                    obra_id,
                    asignacionFinalId,
                    tipo_pago,
                    String(
                        periodo_descripcion
                    ).trim(),
                    fecha_inicio_periodo,
                    fecha_fin_periodo,
                    montoNumero,
                    ESTADO_PENDIENTE,
                    referencia,
                    observaciones
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
   LISTAR PAGOS
===================================================== */

const listarPagosEmpleado =
    async (
        filtros = {}
    ) => {
        const {
            empleado_id,
            obra_id,
            cuenta_id,
            estado,
            tipo_pago,
            fecha_desde,
            fecha_hasta,
            buscar,
            page = 1,
            limit = 20
        } = filtros;

        const condiciones = [];
        const valores = [];

        let indice = 1;

        /* =============================================
           FILTROS
        ============================================= */

        if (empleado_id) {
            condiciones.push(
                `pe.empleado_id = $${indice}`
            );

            valores.push(
                empleado_id
            );

            indice++;
        }

        if (obra_id) {
            condiciones.push(
                `pe.obra_id = $${indice}`
            );

            valores.push(
                obra_id
            );

            indice++;
        }

        if (cuenta_id) {
            condiciones.push(
                `pe.cuenta_id = $${indice}`
            );

            valores.push(
                cuenta_id
            );

            indice++;
        }

        if (estado) {
            condiciones.push(
                `pe.estado = $${indice}`
            );

            valores.push(
                estado
            );

            indice++;
        }

        if (tipo_pago) {
            condiciones.push(
                `pe.tipo_pago = $${indice}`
            );

            valores.push(
                tipo_pago
            );

            indice++;
        }

        if (fecha_desde) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_inicio_periodo,
                    pe.fecha_creacion::date
                ) >= $${indice}
                `
            );

            valores.push(
                fecha_desde
            );

            indice++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_fin_periodo,
                    pe.fecha_creacion::date
                ) <= $${indice}
                `
            );

            valores.push(
                fecha_hasta
            );

            indice++;
        }

        if (
            buscar &&
            buscar.trim()
        ) {
            condiciones.push(
                `
                (
                    CONCAT(
                        e.nombres,
                        ' ',
                        e.apellidos
                    ) ILIKE $${indice}

                    OR e.cedula
                        ILIKE $${indice}

                    OR COALESCE(
                        e.cargo,
                        ''
                    ) ILIKE $${indice}

                    OR COALESCE(
                        o.nombre,
                        ''
                    ) ILIKE $${indice}

                    OR COALESCE(
                        o.codigo,
                        ''
                    ) ILIKE $${indice}

                    OR pe.periodo_descripcion
                        ILIKE $${indice}

                    OR COALESCE(
                        pe.referencia,
                        ''
                    ) ILIKE $${indice}
                )
                `
            );

            valores.push(
                `%${buscar.trim()}%`
            );

            indice++;
        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(
                    " AND "
                )}`
                : "";

        /* =============================================
           PAGINACIÓN
        ============================================= */

        const pagina =
            Math.max(
                Number(page) || 1,
                1
            );

        const limite =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const offset =
            (pagina - 1) *
            limite;

        /* =============================================
           TOTAL
        ============================================= */

        const countQuery = `
            SELECT
                COUNT(*)::INTEGER
                    AS total
            FROM pagos_empleados pe

            INNER JOIN empleados e
                ON e.id =
                    pe.empleado_id

            LEFT JOIN obras o
                ON o.id =
                    pe.obra_id

            ${where}
        `;

        const countResult =
            await pool.query(
                countQuery,
                valores
            );

        const total =
            Number(
                countResult.rows[0]
                    .total
            );

        /* =============================================
           DATOS
        ============================================= */

        const valoresDatos = [
            ...valores,
            limite,
            offset
        ];

        const limitIndex =
            indice;

        const offsetIndex =
            indice + 1;

        const dataQuery = `
            SELECT
                pe.id,

                pe.empleado_id,

                CONCAT(
                    e.nombres,
                    ' ',
                    e.apellidos
                ) AS empleado_nombre,

                e.nombres
                    AS empleado_nombres,

                e.apellidos
                    AS empleado_apellidos,

                e.cedula
                    AS empleado_cedula,

                e.cargo
                    AS empleado_cargo,

                e.tipo_pago
                    AS empleado_tipo_pago,

                pe.obra_id,

                o.codigo
                    AS obra_codigo,

                o.nombre
                    AS obra_nombre,

                pe.asignacion_id,

                eo.cargo_obra,

                eo.salario_acordado,

                pe.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                cf.tipo
                    AS cuenta_tipo,

                pe.transaccion_id,

                pe.tipo_pago,

                pe.periodo_descripcion,

                pe.fecha_inicio_periodo,

                pe.fecha_fin_periodo,

                pe.monto,

                pe.fecha_pago,

                pe.metodo_pago,

                pe.estado,

                pe.referencia,

                pe.observaciones,

                pe.fecha_creacion,

                pe.fecha_actualizacion

            FROM pagos_empleados pe

            INNER JOIN empleados e
                ON e.id =
                    pe.empleado_id

            LEFT JOIN obras o
                ON o.id =
                    pe.obra_id

            LEFT JOIN empleados_obras eo
                ON eo.id =
                    pe.asignacion_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id =
                    pe.cuenta_id

            ${where}

            ORDER BY
                pe.fecha_creacion DESC,
                pe.id DESC

            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
        `;

        const result =
            await pool.query(
                dataQuery,
                valoresDatos
            );

        return {
            data:
                result.rows,

            pagination: {
                page:
                    pagina,

                limit:
                    limite,

                total,

                totalPages:
                    total === 0
                        ? 0
                        : Math.ceil(
                            total /
                            limite
                        )
            }
        };
    };

/* =====================================================
   OBTENER PAGO POR ID
===================================================== */

const obtenerPagoEmpleadoPorId =
    async (
        id
    ) => {
        const result =
            await pool.query(
                `
                SELECT
                    pe.id,

                    pe.empleado_id,

                    CONCAT(
                        e.nombres,
                        ' ',
                        e.apellidos
                    ) AS empleado_nombre,

                    e.nombres
                        AS empleado_nombres,

                    e.apellidos
                        AS empleado_apellidos,

                    e.cedula
                        AS empleado_cedula,

                    e.cargo
                        AS empleado_cargo,

                    e.tipo_pago
                        AS empleado_tipo_pago,

                    e.salario_base,

                    pe.obra_id,

                    o.codigo
                        AS obra_codigo,

                    o.nombre
                        AS obra_nombre,

                    pe.asignacion_id,

                    eo.cargo_obra,

                    eo.salario_acordado,

                    pe.cuenta_id,

                    cf.nombre
                        AS cuenta_nombre,

                    cf.tipo
                        AS cuenta_tipo,

                    cf.saldo_actual
                        AS cuenta_saldo_actual,

                    pe.transaccion_id,

                    t.tipo
                        AS transaccion_tipo,

                    t.monto
                        AS transaccion_monto,

                    t.fecha
                        AS transaccion_fecha,

                    t.descripcion
                        AS transaccion_descripcion,

                    pe.tipo_pago,

                    pe.periodo_descripcion,

                    pe.fecha_inicio_periodo,

                    pe.fecha_fin_periodo,

                    pe.monto,

                    pe.fecha_pago,

                    pe.metodo_pago,

                    pe.estado,

                    pe.referencia,

                    pe.observaciones,

                    pe.fecha_creacion,

                    pe.fecha_actualizacion

                FROM pagos_empleados pe

                INNER JOIN empleados e
                    ON e.id =
                        pe.empleado_id

                LEFT JOIN obras o
                    ON o.id =
                        pe.obra_id

                LEFT JOIN empleados_obras eo
                    ON eo.id =
                        pe.asignacion_id

                LEFT JOIN cuentas_financieras cf
                    ON cf.id =
                        pe.cuenta_id

                LEFT JOIN transacciones t
                    ON t.id =
                        pe.transaccion_id

                WHERE pe.id = $1

                LIMIT 1
                `,
                [id]
            );

        if (
            result.rowCount === 0
        ) {
            throw crearError(
                "El pago de empleado no existe.",
                404
            );
        }

        return result.rows[0];
    };

/* =====================================================
   ACTUALIZAR PAGO PENDIENTE
===================================================== */

/* =====================================================
   ACTUALIZAR PAGO PENDIENTE
===================================================== */

const actualizarPagoEmpleado =
    async (
        id,
        data
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            /* =========================================
               OBTENER Y BLOQUEAR PAGO
            ========================================= */

            const pagoActual =
                await obtenerPagoInterno(
                    client,
                    id,
                    true
                );

            if (
                pagoActual.estado !==
                ESTADO_PENDIENTE
            ) {
                throw crearError(
                    "Solo los pagos pendientes pueden ser modificados.",
                    409
                );
            }

            /* =========================================
               COMBINAR EMPLEADO
            ========================================= */

            const empleadoId =
                data.empleado_id ??
                pagoActual.empleado_id;

            /* =========================================
               COMBINAR OBRA
            ========================================= */

            const obraId =
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "obra_id"
                    )
                    ? data.obra_id
                    : pagoActual.obra_id;

            /* =========================================
               COMBINAR ASIGNACIÓN
            ========================================= */

            let asignacionId;

            if (
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "asignacion_id"
                    )
            ) {
                asignacionId =
                    data.asignacion_id;

            } else {
                asignacionId =
                    pagoActual.asignacion_id;
            }

            /*
             * Si cambia empleado u obra y el frontend
             * no envía una asignación explícita,
             * dejamos que el backend encuentre
             * nuevamente la asignación correcta.
             */
            if (
                (
                    data.empleado_id &&
                    data.empleado_id !==
                    pagoActual.empleado_id
                ) ||
                (
                    Object.prototype
                        .hasOwnProperty.call(
                            data,
                            "obra_id"
                        ) &&
                    data.obra_id !==
                    pagoActual.obra_id
                )
            ) {
                if (
                    !Object.prototype
                        .hasOwnProperty.call(
                            data,
                            "asignacion_id"
                        )
                ) {
                    asignacionId =
                        null;
                }
            }

            /* =========================================
               VALIDAR EMPLEADO
            ========================================= */

            await validarEmpleadoActivo(
                client,
                empleadoId
            );

            /* =========================================
               VALIDAR / RESOLVER ASIGNACIÓN
            ========================================= */

            const asignacion =
                await resolverAsignacion(
                    client,
                    empleadoId,
                    obraId,
                    asignacionId
                );

            const asignacionFinalId =
                asignacion
                    ? asignacion.id
                    : null;

            /* =========================================
               VALORES FINALES
            ========================================= */

            const tipoPago =
                data.tipo_pago ??
                pagoActual.tipo_pago;

            const periodoDescripcion =
                data.periodo_descripcion ??
                pagoActual.periodo_descripcion;

            const fechaInicio =
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "fecha_inicio_periodo"
                    )
                    ? data.fecha_inicio_periodo
                    : pagoActual
                        .fecha_inicio_periodo;

            const fechaFin =
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "fecha_fin_periodo"
                    )
                    ? data.fecha_fin_periodo
                    : pagoActual
                        .fecha_fin_periodo;

            const monto =
                data.monto ??
                pagoActual.monto;

            const referencia =
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "referencia"
                    )
                    ? data.referencia
                    : pagoActual.referencia;

            const observaciones =
                Object.prototype
                    .hasOwnProperty.call(
                        data,
                        "observaciones"
                    )
                    ? data.observaciones
                    : pagoActual.observaciones;

            /* =========================================
               VALIDACIONES
            ========================================= */

            if (
                !periodoDescripcion ||
                !String(
                    periodoDescripcion
                ).trim()
            ) {
                throw crearError(
                    "Debe indicar la descripción del período.",
                    400
                );
            }

            const montoNumero =
                numero(
                    monto
                );

            if (
                montoNumero <= 0
            ) {
                throw crearError(
                    "El monto del pago debe ser mayor a cero.",
                    400
                );
            }

            if (
                fechaInicio &&
                fechaFin &&
                new Date(
                    fechaFin
                ) <
                new Date(
                    fechaInicio
                )
            ) {
                throw crearError(
                    "La fecha de fin del período no puede ser anterior a la fecha de inicio.",
                    400
                );
            }

            /* =========================================
               VALIDAR QUE EL NUEVO PERÍODO
               NO CHOQUE CON OTRO PAGO
            ========================================= */

            await validarPeriodoPagoDisponible(
                client,
                {
                    empleado_id:
                        empleadoId,

                    obra_id:
                        obraId,

                    fecha_inicio_periodo:
                        fechaInicio,

                    fecha_fin_periodo:
                        fechaFin,

                    excluir_pago_id:
                        id
                }
            );

            /* =========================================
               UPDATE
            ========================================= */

            const result =
                await client.query(
                    `
                    UPDATE pagos_empleados

                    SET
                        empleado_id = $1,
                        obra_id = $2,
                        asignacion_id = $3,
                        tipo_pago = $4,
                        periodo_descripcion = $5,
                        fecha_inicio_periodo = $6,
                        fecha_fin_periodo = $7,
                        monto = $8,
                        referencia = $9,
                        observaciones = $10,
                        fecha_actualizacion = NOW()

                    WHERE id = $11

                    RETURNING *
                    `,
                    [
                        empleadoId,
                        obraId,
                        asignacionFinalId,
                        tipoPago,
                        String(
                            periodoDescripcion
                        ).trim(),
                        fechaInicio,
                        fechaFin,
                        montoNumero,
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
   CONFIRMAR PAGO
===================================================== */

const confirmarPagoEmpleado =
    async (
        id,
        data
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            /* =========================================
               BLOQUEAR PAGO
            ========================================= */

            const pago =
                await obtenerPagoInterno(
                    client,
                    id,
                    true
                );

            if (
                pago.estado ===
                ESTADO_PAGADO
            ) {
                throw crearError(
                    "Este pago ya fue confirmado anteriormente.",
                    409
                );
            }

            if (
                pago.estado ===
                ESTADO_ANULADO
            ) {
                throw crearError(
                    "No se puede confirmar un pago anulado.",
                    409
                );
            }

            if (
                pago.transaccion_id
            ) {
                throw crearError(
                    "El pago ya tiene una transacción financiera asociada.",
                    409
                );
            }

            /* =========================================
               VALIDAR EMPLEADO
            ========================================= */

            await validarEmpleadoActivo(
                client,
                pago.empleado_id
            );

            /* =========================================
               VALIDAR RELACIÓN OBRA
            ========================================= */

            await resolverAsignacion(
                client,
                pago.empleado_id,
                pago.obra_id,
                pago.asignacion_id
            );

            /* =========================================
               BLOQUEAR CUENTA
            ========================================= */

            const cuenta =
                await obtenerCuentaFinanciera(
                    client,
                    data.cuenta_id,
                    true
                );

            const saldoActual =
                numero(
                    cuenta.saldo_actual
                );

            const montoPago =
                numero(
                    pago.monto
                );

            if (
                montoPago <= 0
            ) {
                throw crearError(
                    "El monto del pago debe ser mayor a cero.",
                    409
                );
            }

            if (
                saldoActual <
                montoPago
            ) {
                throw crearError(
                    `Saldo insuficiente en la cuenta "${cuenta.nombre}". Saldo disponible: $${saldoActual.toFixed(
                        2
                    )}. Monto requerido: $${montoPago.toFixed(
                        2
                    )}.`,
                    409
                );
            }

            /* =========================================
               OBTENER DATOS EMPLEADO
            ========================================= */

            const empleado =
                await obtenerEmpleado(
                    client,
                    pago.empleado_id
                );

            const nombreEmpleado =
                `${empleado.nombres} ${empleado.apellidos}`
                    .trim();

            /* =========================================
               CREAR TRANSACCIÓN FINANCIERA
            ========================================= */

            const descripcion =
                pago.obra_id
                    ? `Pago a empleado ${nombreEmpleado} - ${pago.periodo_descripcion} - asociado a obra`
                    : `Pago a empleado ${nombreEmpleado} - ${pago.periodo_descripcion}`;

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
                        origen_id,
                        fecha_creacion
                    )
                    VALUES (
                        $1,
                        'egreso',
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        NULL,
                        $7,
                        $8,
                        NOW()
                    )
                    RETURNING *
                    `,
                    [
                        data.cuenta_id,
                        montoPago,
                        descripcion,
                        data.fecha_pago,
                        id,
                        pago.obra_id,
                        ORIGEN_PAGO_EMPLEADO,
                        id
                    ]
                );

            const transaccion =
                transaccionResult.rows[0];

            /* =========================================
               DESCONTAR SALDO
            ========================================= */

            const cuentaActualizada =
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
                        saldo_actual
                    `,
                    [
                        montoPago,
                        data.cuenta_id
                    ]
                );

            /* =========================================
               ACTUALIZAR PAGO
            ========================================= */

            const referenciaFinal =
                Object.prototype.hasOwnProperty.call(
                    data,
                    "referencia"
                )
                    ? data.referencia
                    : pago.referencia;

            let observacionesFinal =
                pago.observaciones;

            if (
                Object.prototype.hasOwnProperty.call(
                    data,
                    "observaciones"
                )
            ) {
                observacionesFinal =
                    data.observaciones;
            }

            const pagoResult =
                await client.query(
                    `
                    UPDATE pagos_empleados

                    SET
                        cuenta_id = $1,
                        transaccion_id = $2,
                        fecha_pago = $3,
                        metodo_pago = $4,
                        estado = $5,
                        referencia = $6,
                        observaciones = $7,
                        fecha_actualizacion = NOW()

                    WHERE id = $8

                    RETURNING *
                    `,
                    [
                        data.cuenta_id,
                        transaccion.id,
                        data.fecha_pago,
                        data.metodo_pago,
                        ESTADO_PAGADO,
                        referenciaFinal,
                        observacionesFinal,
                        id
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return {
                pago:
                    pagoResult.rows[0],

                transaccion,

                cuenta:
                    cuentaActualizada.rows[0]
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
   ANULAR PAGO
===================================================== */

const anularPagoEmpleado =
    async (
        id,
        motivo
    ) => {
        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const pago =
                await obtenerPagoInterno(
                    client,
                    id,
                    true
                );

            /* =========================================
               YA ANULADO
            ========================================= */

            if (
                pago.estado ===
                ESTADO_ANULADO
            ) {
                throw crearError(
                    "Este pago ya se encuentra anulado.",
                    409
                );
            }

            /* =========================================
               PAGO PENDIENTE
               NO HAY DINERO QUE REVERTIR
            ========================================= */

            if (
                pago.estado ===
                ESTADO_PENDIENTE
            ) {
                const observaciones =
                    [
                        pago.observaciones,
                        `ANULACIÓN: ${motivo}`
                    ]
                        .filter(Boolean)
                        .join("\n");

                const result =
                    await client.query(
                        `
                        UPDATE pagos_empleados

                        SET
                            estado = $1,
                            observaciones = $2,
                            fecha_actualizacion = NOW()

                        WHERE id = $3

                        RETURNING *
                        `,
                        [
                            ESTADO_ANULADO,
                            observaciones,
                            id
                        ]
                    );

                await client.query(
                    "COMMIT"
                );

                return {
                    pago:
                        result.rows[0],

                    reversion:
                        null
                };
            }

            /* =========================================
               PAGO PAGADO
               REQUIERE REVERSIÓN FINANCIERA
            ========================================= */

            if (
                pago.estado !==
                ESTADO_PAGADO
            ) {
                throw crearError(
                    "El estado actual del pago no permite su anulación.",
                    409
                );
            }

            if (
                !pago.cuenta_id ||
                !pago.transaccion_id
            ) {
                throw crearError(
                    "El pago figura como pagado pero no tiene la información financiera necesaria para ser revertido.",
                    409
                );
            }

            /* =========================================
               VALIDAR TRANSACCIÓN ORIGINAL
            ========================================= */

            const transaccionOriginalResult =
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
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        pago.transaccion_id
                    ]
                );

            if (
                transaccionOriginalResult
                    .rowCount === 0
            ) {
                throw crearError(
                    "No se encontró la transacción financiera original del pago.",
                    409
                );
            }

            const transaccionOriginal =
                transaccionOriginalResult
                    .rows[0];

            if (
                transaccionOriginal.tipo !==
                "egreso"
            ) {
                throw crearError(
                    "La transacción financiera asociada al pago no es un egreso válido.",
                    409
                );
            }

            if (
                transaccionOriginal.cuenta_id !==
                pago.cuenta_id
            ) {
                throw crearError(
                    "La cuenta de la transacción original no coincide con la cuenta del pago.",
                    409
                );
            }

            /* =========================================
               EVITAR REVERSIÓN DUPLICADA
            ========================================= */

            const reversionExistente =
                await client.query(
                    `
                    SELECT id
                    FROM transacciones
                    WHERE origen_modulo = $1
                      AND origen_id = $2
                    LIMIT 1
                    `,
                    [
                        ORIGEN_ANULACION_PAGO_EMPLEADO,
                        id
                    ]
                );

            if (
                reversionExistente.rowCount >
                0
            ) {
                throw crearError(
                    "Este pago ya posee una reversión financiera registrada.",
                    409
                );
            }

            /* =========================================
               BLOQUEAR CUENTA
            ========================================= */

            const cuenta =
                await obtenerCuentaFinanciera(
                    client,
                    pago.cuenta_id,
                    true
                );

            const montoPago =
                numero(
                    pago.monto
                );

            /* =========================================
               DEVOLVER DINERO A LA CUENTA
            ========================================= */

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
                        saldo_actual
                    `,
                    [
                        montoPago,
                        cuenta.id
                    ]
                );

            /* =========================================
               CREAR TRANSACCIÓN DE REVERSIÓN
            ========================================= */

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
                        origen_id,
                        fecha_creacion
                    )
                    VALUES (
                        $1,
                        'ingreso',
                        $2,
                        $3,
                        CURRENT_DATE,
                        $4,
                        $5,
                        NULL,
                        $6,
                        $7,
                        NOW()
                    )
                    RETURNING *
                    `,
                    [
                        pago.cuenta_id,
                        montoPago,
                        `Reversión de pago a empleado. Motivo: ${motivo}`,
                        pago.transaccion_id,
                        pago.obra_id,
                        ORIGEN_ANULACION_PAGO_EMPLEADO,
                        id
                    ]
                );

            /* =========================================
               MARCAR PAGO ANULADO
            ========================================= */

            const observaciones =
                [
                    pago.observaciones,
                    `ANULACIÓN: ${motivo}`,
                    `Reversión financiera: ${reversionResult.rows[0].id}`
                ]
                    .filter(Boolean)
                    .join("\n");

            const pagoResult =
                await client.query(
                    `
                    UPDATE pagos_empleados

                    SET
                        estado = $1,
                        observaciones = $2,
                        fecha_actualizacion = NOW()

                    WHERE id = $3

                    RETURNING *
                    `,
                    [
                        ESTADO_ANULADO,
                        observaciones,
                        id
                    ]
                );

            await client.query(
                "COMMIT"
            );

            return {
                pago:
                    pagoResult.rows[0],

                reversion:
                    reversionResult.rows[0],

                cuenta:
                    cuentaResult.rows[0]
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
   REPORTE POR EMPLEADO
===================================================== */

const reportePagosPorEmpleado =
    async (
        filtros
    ) => {
        const {
            empleado_id,
            fecha_desde,
            fecha_hasta,
            estado
        } = filtros;

        const condiciones = [
            "pe.empleado_id = $1"
        ];

        const valores = [
            empleado_id
        ];

        let indice = 2;

        if (fecha_desde) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_inicio_periodo,
                    pe.fecha_creacion::date
                ) >= $${indice}
                `
            );

            valores.push(
                fecha_desde
            );

            indice++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_fin_periodo,
                    pe.fecha_creacion::date
                ) <= $${indice}
                `
            );

            valores.push(
                fecha_hasta
            );

            indice++;
        }

        if (estado) {
            condiciones.push(
                `pe.estado = $${indice}`
            );

            valores.push(
                estado
            );
        }

        const where =
            condiciones.join(
                " AND "
            );

        /* =============================================
           VALIDAR EMPLEADO
        ============================================= */

        const empleadoResult =
            await pool.query(
                `
                SELECT
                    id,
                    nombres,
                    apellidos,
                    cedula,
                    cargo,
                    tipo_pago,
                    salario_base,
                    activo
                FROM empleados
                WHERE id = $1
                LIMIT 1
                `,
                [
                    empleado_id
                ]
            );

        if (
            empleadoResult.rowCount ===
            0
        ) {
            throw crearError(
                "El empleado no existe.",
                404
            );
        }

        /* =============================================
           DETALLE
        ============================================= */

        const detalleResult =
            await pool.query(
                `
                SELECT
                    pe.id,
                    pe.periodo_descripcion,
                    pe.tipo_pago,
                    pe.fecha_inicio_periodo,
                    pe.fecha_fin_periodo,
                    pe.fecha_pago,
                    pe.monto,
                    pe.metodo_pago,
                    pe.estado,
                    pe.referencia,

                    o.id
                        AS obra_id,

                    o.codigo
                        AS obra_codigo,

                    o.nombre
                        AS obra_nombre,

                    cf.id
                        AS cuenta_id,

                    cf.nombre
                        AS cuenta_nombre

                FROM pagos_empleados pe

                LEFT JOIN obras o
                    ON o.id =
                        pe.obra_id

                LEFT JOIN cuentas_financieras cf
                    ON cf.id =
                        pe.cuenta_id

                WHERE ${where}

                ORDER BY
                    COALESCE(
                        pe.fecha_pago,
                        pe.fecha_inicio_periodo,
                        pe.fecha_creacion::date
                    ) DESC
                `,
                valores
            );

        /* =============================================
           RESUMEN
        ============================================= */

        const resumenResult =
            await pool.query(
                `
                SELECT
                    COUNT(*)::INTEGER
                        AS total_registros,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'pendiente'
                    )::INTEGER
                        AS total_pendientes,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'pagado'
                    )::INTEGER
                        AS total_pagados,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'anulado'
                    )::INTEGER
                        AS total_anulados,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pagado'
                        ),
                        0
                    )
                        AS monto_pagado,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pendiente'
                        ),
                        0
                    )
                        AS monto_pendiente

                FROM pagos_empleados pe

                WHERE ${where}
                `,
                valores
            );

        return {
            empleado:
                empleadoResult.rows[0],

            resumen:
                resumenResult.rows[0],

            pagos:
                detalleResult.rows
        };
    };

/* =====================================================
   REPORTE POR OBRA
===================================================== */

const reportePagosPorObra =
    async (
        filtros
    ) => {
        const {
            obra_id,
            fecha_desde,
            fecha_hasta,
            estado
        } = filtros;

        const condiciones = [
            "pe.obra_id = $1"
        ];

        const valores = [
            obra_id
        ];

        let indice = 2;

        if (fecha_desde) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_inicio_periodo,
                    pe.fecha_creacion::date
                ) >= $${indice}
                `
            );

            valores.push(
                fecha_desde
            );

            indice++;
        }

        if (fecha_hasta) {
            condiciones.push(
                `
                COALESCE(
                    pe.fecha_pago,
                    pe.fecha_fin_periodo,
                    pe.fecha_creacion::date
                ) <= $${indice}
                `
            );

            valores.push(
                fecha_hasta
            );

            indice++;
        }

        if (estado) {
            condiciones.push(
                `pe.estado = $${indice}`
            );

            valores.push(
                estado
            );
        }

        const where =
            condiciones.join(
                " AND "
            );

        /* =============================================
           OBRA
        ============================================= */

        const obraResult =
            await pool.query(
                `
                SELECT
                    id,
                    codigo,
                    nombre,
                    ubicacion,
                    estado,
                    presupuesto
                FROM obras
                WHERE id = $1
                LIMIT 1
                `,
                [obra_id]
            );

        if (
            obraResult.rowCount ===
            0
        ) {
            throw crearError(
                "La obra no existe.",
                404
            );
        }

        /* =============================================
           DETALLE
        ============================================= */

        const pagosResult =
            await pool.query(
                `
                SELECT
                    pe.id,

                    pe.empleado_id,

                    CONCAT(
                        e.nombres,
                        ' ',
                        e.apellidos
                    ) AS empleado_nombre,

                    e.cedula,

                    e.cargo,

                    eo.cargo_obra,

                    pe.periodo_descripcion,

                    pe.tipo_pago,

                    pe.fecha_inicio_periodo,

                    pe.fecha_fin_periodo,

                    pe.fecha_pago,

                    pe.monto,

                    pe.metodo_pago,

                    pe.estado,

                    pe.referencia,

                    cf.nombre
                        AS cuenta_nombre

                FROM pagos_empleados pe

                INNER JOIN empleados e
                    ON e.id =
                        pe.empleado_id

                LEFT JOIN empleados_obras eo
                    ON eo.id =
                        pe.asignacion_id

                LEFT JOIN cuentas_financieras cf
                    ON cf.id =
                        pe.cuenta_id

                WHERE ${where}

                ORDER BY
                    COALESCE(
                        pe.fecha_pago,
                        pe.fecha_inicio_periodo,
                        pe.fecha_creacion::date
                    ) DESC
                `,
                valores
            );

        /* =============================================
           RESUMEN
        ============================================= */

        const resumenResult =
            await pool.query(
                `
                SELECT
                    COUNT(*)::INTEGER
                        AS total_pagos,

                    COUNT(
                        DISTINCT empleado_id
                    )::INTEGER
                        AS empleados_pagados,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pagado'
                        ),
                        0
                    )
                        AS total_pagado,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pendiente'
                        ),
                        0
                    )
                        AS total_pendiente,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'anulado'
                        ),
                        0
                    )
                        AS total_anulado

                FROM pagos_empleados pe

                WHERE ${where}
                `,
                valores
            );

        return {
            obra:
                obraResult.rows[0],

            resumen:
                resumenResult.rows[0],

            pagos:
                pagosResult.rows
        };
    };

/* =====================================================
   RESUMEN GENERAL DE PAGOS
===================================================== */

const obtenerResumenPagos =
    async () => {
        const result =
            await pool.query(
                `
                SELECT
                    COUNT(*)::INTEGER
                        AS total_registros,

                    COUNT(
                        DISTINCT empleado_id
                    )::INTEGER
                        AS empleados_con_pagos,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'pagado'
                    )::INTEGER
                        AS pagos_confirmados,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'pendiente'
                    )::INTEGER
                        AS pagos_pendientes,

                    COUNT(*) FILTER (
                        WHERE estado =
                            'anulado'
                    )::INTEGER
                        AS pagos_anulados,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pagado'
                        ),
                        0
                    )
                        AS total_pagado,

                    COALESCE(
                        SUM(monto) FILTER (
                            WHERE estado =
                                'pendiente'
                        ),
                        0
                    )
                        AS total_pendiente,

                    COUNT(*) FILTER (
                        WHERE obra_id IS NOT NULL
                          AND estado !=
                              'anulado'
                    )::INTEGER
                        AS pagos_vinculados_obra

                FROM pagos_empleados
                `
            );

        return result.rows[0];
    };
/* =====================================================
OBTENER ASIGNACIONES ACTIVAS PARA PAGO
===================================================== */

/* =====================================================
   OBTENER ASIGNACIONES ACTIVAS PARA PAGO
===================================================== */

const obtenerAsignacionesActivasPago = async (
    empleadoId,
    obraId
) => {
    const result =
        await pool.query(
            `
            SELECT
                eo.id,
                eo.empleado_id,
                eo.obra_id,
                eo.fecha_asignacion,
                eo.fecha_inicio,
                eo.fecha_fin,
                eo.cargo_obra,
                eo.salario_acordado,
                eo.activo,
                eo.observaciones,

                e.nombres AS empleado_nombres,
                e.apellidos AS empleado_apellidos,
                e.cedula AS empleado_cedula,
                e.cargo AS empleado_cargo,

                o.codigo AS obra_codigo,
                o.nombre AS obra_nombre

            FROM empleados_obras eo

            INNER JOIN empleados e
                ON e.id = eo.empleado_id

            INNER JOIN obras o
                ON o.id = eo.obra_id

            WHERE eo.empleado_id = $1
              AND eo.obra_id = $2
              AND eo.activo = TRUE
              AND e.activo = TRUE

            ORDER BY
                eo.fecha_asignacion DESC NULLS LAST,
                eo.fecha_inicio DESC NULLS LAST
            `,
            [
                empleadoId,
                obraId
            ]
        );

    return result.rows;
};
/* =====================================================
   REPORTE GENERAL DE PERSONAL
===================================================== */

const reporteGeneralPersonal =
    async () => {

        /*
         * Este reporte consolida:
         *
         * - empleados
         * - asignaciones a obras
         * - obra actual
         * - pagos realizados
         * - pagos pendientes
         *
         * IMPORTANTE:
         *
         * Los valores financieros se obtienen
         * únicamente desde pagos_empleados.
         *
         * No volvemos a sumar transacciones porque
         * eso duplicaría el valor del pago.
         */

        const result =
            await pool.query(
                `
                SELECT
                    e.id,

                    e.nombres,

                    e.apellidos,

                    CONCAT(
                        e.nombres,
                        ' ',
                        e.apellidos
                    ) AS empleado_nombre,

                    e.cedula,

                    e.cargo,

                    e.tipo_pago,

                    e.salario_base,

                    e.fecha_ingreso,

                    e.activo,

                    /* =====================================
                       OBRA ACTUAL
                    ===================================== */

                    obra_actual.obra_id,

                    obra_actual.obra_codigo,

                    obra_actual.obra_nombre,

                    obra_actual.cargo_obra,

                    obra_actual.fecha_asignacion,

                    obra_actual.fecha_inicio,

                    /* =====================================
                       ASIGNACIONES
                    ===================================== */

                    COALESCE(
                        resumen_obras.total_asignaciones,
                        0
                    )::INTEGER
                        AS total_asignaciones,

                    COALESCE(
                        resumen_obras.obras_activas,
                        0
                    )::INTEGER
                        AS obras_activas,

                    /* =====================================
                       PAGOS
                    ===================================== */

                    COALESCE(
                        resumen_pagos.total_pagado,
                        0
                    )::NUMERIC
                        AS total_pagado,

                    COALESCE(
                        resumen_pagos.total_pendiente,
                        0
                    )::NUMERIC
                        AS pagos_pendientes,

                    COALESCE(
                        resumen_pagos.pagos_realizados,
                        0
                    )::INTEGER
                        AS pagos_realizados,

                    COALESCE(
                        resumen_pagos.pagos_pendientes_cantidad,
                        0
                    )::INTEGER
                        AS pagos_pendientes_cantidad,

                    COALESCE(
                        resumen_pagos.pagos_anulados,
                        0
                    )::INTEGER
                        AS pagos_anulados

                FROM empleados e

                /* =========================================
                   OBTENER ASIGNACIÓN ACTUAL / MÁS RECIENTE
                ========================================= */

                LEFT JOIN LATERAL (
                    SELECT
                        eo.obra_id,

                        o.codigo
                            AS obra_codigo,

                        o.nombre
                            AS obra_nombre,

                        eo.cargo_obra,

                        eo.fecha_asignacion,

                        eo.fecha_inicio

                    FROM empleados_obras eo

                    INNER JOIN obras o
                        ON o.id =
                            eo.obra_id

                    WHERE
                        eo.empleado_id =
                            e.id

                    ORDER BY
                        eo.activo DESC,

                        COALESCE(
                            eo.fecha_inicio,
                            eo.fecha_asignacion
                        ) DESC NULLS LAST,

                        eo.id DESC

                    LIMIT 1

                ) obra_actual
                    ON TRUE

                /* =========================================
                   RESUMEN DE ASIGNACIONES
                ========================================= */

                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(*)::INTEGER
                            AS total_asignaciones,

                        COUNT(*) FILTER (
                            WHERE
                                eo.activo = TRUE
                        )::INTEGER
                            AS obras_activas

                    FROM empleados_obras eo

                    WHERE
                        eo.empleado_id =
                            e.id

                ) resumen_obras
                    ON TRUE

                /* =========================================
                   RESUMEN DE PAGOS
                ========================================= */

                LEFT JOIN LATERAL (
                    SELECT

                        COALESCE(
                            SUM(
                                pe.monto
                            ) FILTER (
                                WHERE
                                    pe.estado =
                                        'pagado'
                            ),
                            0
                        )
                            AS total_pagado,

                        COALESCE(
                            SUM(
                                pe.monto
                            ) FILTER (
                                WHERE
                                    pe.estado =
                                        'pendiente'
                            ),
                            0
                        )
                            AS total_pendiente,

                        COUNT(*) FILTER (
                            WHERE
                                pe.estado =
                                    'pagado'
                        )::INTEGER
                            AS pagos_realizados,

                        COUNT(*) FILTER (
                            WHERE
                                pe.estado =
                                    'pendiente'
                        )::INTEGER
                            AS pagos_pendientes_cantidad,

                        COUNT(*) FILTER (
                            WHERE
                                pe.estado =
                                    'anulado'
                        )::INTEGER
                            AS pagos_anulados

                    FROM pagos_empleados pe

                    WHERE
                        pe.empleado_id =
                            e.id

                ) resumen_pagos
                    ON TRUE

                ORDER BY
                    e.activo DESC,
                    e.apellidos ASC,
                    e.nombres ASC
                `
            );

        /* =============================================
           RESUMEN GENERAL
        ============================================= */

        const empleados =
            result.rows.map(
                (row) => ({
                    ...row,

                    total_pagado:
                        numero(
                            row.total_pagado
                        ),

                    pagos_pendientes:
                        numero(
                            row.pagos_pendientes
                        ),

                    total_asignaciones:
                        numero(
                            row.total_asignaciones
                        ),

                    obras_activas:
                        numero(
                            row.obras_activas
                        ),

                    pagos_realizados:
                        numero(
                            row.pagos_realizados
                        ),

                    pagos_pendientes_cantidad:
                        numero(
                            row.pagos_pendientes_cantidad
                        ),

                    pagos_anulados:
                        numero(
                            row.pagos_anulados
                        )
                })
            );

        const resumen =
            empleados.reduce(
                (
                    acumulado,
                    empleado
                ) => {

                    acumulado.total_personal +=
                        1;

                    if (
                        empleado.activo ===
                        true
                    ) {
                        acumulado.activos +=
                            1;
                    } else {
                        acumulado.inactivos +=
                            1;
                    }

                    if (
                        empleado.obras_activas >
                        0
                    ) {
                        acumulado.empleados_en_obra +=
                            1;
                    }

                    acumulado.total_pagado +=
                        numero(
                            empleado.total_pagado
                        );

                    acumulado.total_pendiente +=
                        numero(
                            empleado.pagos_pendientes
                        );

                    acumulado.pagos_realizados +=
                        numero(
                            empleado.pagos_realizados
                        );

                    acumulado.pagos_pendientes +=
                        numero(
                            empleado
                                .pagos_pendientes_cantidad
                        );

                    return acumulado;
                },
                {
                    total_personal: 0,

                    activos: 0,

                    inactivos: 0,

                    empleados_en_obra: 0,

                    total_pagado: 0,

                    total_pendiente: 0,

                    pagos_realizados: 0,

                    pagos_pendientes: 0
                }
            );

        return {
            resumen,
            empleados
        };
    };

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    crearPagoEmpleado,
    listarPagosEmpleado,
    obtenerPagoEmpleadoPorId,
    actualizarPagoEmpleado,
    confirmarPagoEmpleado,
    anularPagoEmpleado,
    obtenerAsignacionesActivasPago,
    reportePagosPorEmpleado,
    reportePagosPorObra,
    obtenerResumenPagos,
    reporteGeneralPersonal
};