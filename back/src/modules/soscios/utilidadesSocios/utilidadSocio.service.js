const { pool } = require("../../../config/db");

/* =====================================================
   CREAR ERROR HTTP
===================================================== */

const crearError = (
    mensaje,
    statusCode = 400
) => {
    const error = new Error(mensaje);

    error.statusCode = statusCode;

    return error;
};

/* =====================================================
   NORMALIZAR DISTRIBUCIÓN
===================================================== */

const normalizarDistribucion = (
    distribucion
) => {
    if (!distribucion) {
        return null;
    }

    return {
        ...distribucion,

        utilidad_periodo:
            Number(
                distribucion.utilidad_periodo || 0
            ),

        utilidad_base:
            Number(
                distribucion.utilidad_base || 0
            ),

        porcentaje_aplicado:
            Number(
                distribucion.porcentaje_aplicado || 0
            ),

        monto:
            Number(
                distribucion.monto || 0
            )
    };
};

/* =====================================================
   VALIDAR PERIODO YYYY-MM
===================================================== */

const validarPeriodo = (
    periodo
) => {
    if (
        !periodo ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)
    ) {
        throw crearError(
            "El período debe tener el formato YYYY-MM",
            400
        );
    }
};

/* =====================================================
   OBTENER RANGO DEL PERIODO
===================================================== */

const obtenerRangoPeriodo = (
    periodo
) => {
    validarPeriodo(periodo);

    const [
        anioTexto,
        mesTexto
    ] = periodo.split("-");

    const anio =
        Number(anioTexto);

    const mes =
        Number(mesTexto);

    const fechaInicio =
        `${anioTexto}-${mesTexto}-01`;

    let siguienteAnio =
        anio;

    let siguienteMes =
        mes + 1;

    if (
        siguienteMes === 13
    ) {
        siguienteMes = 1;

        siguienteAnio += 1;
    }

    const fechaFin =
        `${siguienteAnio}-${String(
            siguienteMes
        ).padStart(
            2,
            "0"
        )}-01`;

    return {
        fechaInicio,
        fechaFin
    };
};

/* =====================================================
   CALCULAR UTILIDAD REAL DEL PERIODO
===================================================== */

/*
 * IMPORTANTE:
 *
 * No todos los "ingresos" de caja representan
 * utilidad empresarial.
 *
 * Los aportes de socios incrementan caja,
 * pero son capital, no ingresos operativos.
 *
 * Los pagos de utilidades reducen caja,
 * pero tampoco deben considerarse un gasto
 * operativo para calcular nuevamente la utilidad.
 *
 * Las transferencias tampoco intervienen.
 */
const calcularUtilidadPeriodo = async (
    periodo,
    db = pool
) => {
    const {
        fechaInicio,
        fechaFin
    } = obtenerRangoPeriodo(
        periodo
    );

    const resultado =
        await db.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'ingreso'
                             AND COALESCE(
                                    t.origen_modulo,
                                    'manual'
                                 ) NOT IN (
                                    'aportes_socios'
                                 )
                            THEN t.monto
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_ingresos,

                COALESCE(
                    SUM(
                        CASE
                            WHEN t.tipo = 'egreso'
                             AND COALESCE(
                                    t.origen_modulo,
                                    'manual'
                                 ) NOT IN (
                                    'aportes_socios',
                                    'utilidades_socios'
                                 )
                            THEN t.monto
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_egresos

            FROM transacciones t

            WHERE t.fecha >= $1
              AND t.fecha < $2
            `,
            [
                fechaInicio,
                fechaFin
            ]
        );

    const totalIngresos =
        Number(
            resultado.rows[0]
                .total_ingresos || 0
        );

    const totalEgresos =
        Number(
            resultado.rows[0]
                .total_egresos || 0
        );

    const utilidad =
        Number(
            (
                totalIngresos -
                totalEgresos
            ).toFixed(2)
        );

    return {
        periodo,

        fecha_inicio:
            fechaInicio,

        fecha_fin:
            fechaFin,

        total_ingresos:
            totalIngresos,

        total_egresos:
            totalEgresos,

        utilidad
    };
};

/* =====================================================
   OBTENER CAPITAL DE SOCIOS ACTIVOS
===================================================== */

/*
 * Para generar una NUEVA distribución utilizamos
 * únicamente socios activos.
 *
 * Capital neto =
 * aportes confirmados - retiros confirmados.
 */
const obtenerCapitalSociosActivos =
    async (
        db = pool
    ) => {
        const resultado =
            await db.query(
                `
                SELECT
                    s.id AS socio_id,
                    s.nombre,
                    s.identificacion,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN ap.estado = 'confirmado'
                                 AND ap.tipo = 'aporte'
                                THEN ap.monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_aportes,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN ap.estado = 'confirmado'
                                 AND ap.tipo = 'retiro'
                                THEN ap.monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_retiros

                FROM socios s

                LEFT JOIN aportes_socios ap
                    ON ap.socio_id = s.id

                WHERE s.activo = TRUE

                GROUP BY
                    s.id,
                    s.nombre,
                    s.identificacion

                ORDER BY
                    s.nombre ASC
                `
            );

        return resultado.rows
            .map(
                (socio) => {
                    const totalAportes =
                        Number(
                            socio.total_aportes ||
                            0
                        );

                    const totalRetiros =
                        Number(
                            socio.total_retiros ||
                            0
                        );

                    return {
                        socio_id:
                            socio.socio_id,

                        nombre:
                            socio.nombre,

                        identificacion:
                            socio.identificacion,

                        total_aportes:
                            totalAportes,

                        total_retiros:
                            totalRetiros,

                        capital_neto:
                            Number(
                                (
                                    totalAportes -
                                    totalRetiros
                                ).toFixed(2)
                            )
                    };
                }
            )
            .filter(
                (socio) =>
                    socio.capital_neto > 0
            );
    };

/* =====================================================
   CALCULAR DISTRIBUCIÓN SIN GUARDAR
===================================================== */

/*
 * Este método sirve para la pantalla de consulta.
 *
 * NO guarda nada.
 *
 * GET:
 * /api/utilidades-socios/calculo?periodo=2026-07
 *
 * También puede recibir montoDistribuir para hacer
 * una simulación.
 */
const calcularDistribucion = async (
    periodo,
    montoDistribuir = null
) => {
    validarPeriodo(
        periodo
    );

    const utilidadPeriodo =
        await calcularUtilidadPeriodo(
            periodo
        );

    const socios =
        await obtenerCapitalSociosActivos();

    if (
        socios.length === 0
    ) {
        throw crearError(
            "No existen socios activos con capital neto positivo",
            400
        );
    }

    const capitalTotal =
        socios.reduce(
            (
                acumulado,
                socio
            ) =>
                acumulado +
                socio.capital_neto,
            0
        );

    if (
        capitalTotal <= 0
    ) {
        throw crearError(
            "El capital neto total de los socios debe ser mayor que cero",
            400
        );
    }

    /*
     * Por defecto simulamos la distribución
     * de toda la utilidad positiva.
     */
    const montoBase =
        montoDistribuir !== null &&
            montoDistribuir !== undefined
            ? Number(
                montoDistribuir
            )
            : Math.max(
                utilidadPeriodo.utilidad,
                0
            );

    if (
        montoBase < 0
    ) {
        throw crearError(
            "El monto a distribuir no puede ser negativo",
            400
        );
    }

    if (
        montoBase >
        utilidadPeriodo.utilidad
    ) {
        throw crearError(
            "El monto a distribuir no puede superar la utilidad real del período",
            400
        );
    }

    /*
     * Trabajamos en centavos para evitar
     * diferencias por redondeo.
     */
    const totalCentavos =
        Math.round(
            montoBase * 100
        );

    let centavosAsignados =
        0;

    const distribucion =
        socios.map(
            (
                socio,
                indice
            ) => {
                const proporcion =
                    socio.capital_neto /
                    capitalTotal;

                const porcentaje =
                    Number(
                        (
                            proporcion *
                            100
                        ).toFixed(2)
                    );

                let montoCentavos;

                /*
                 * Al último socio le asignamos
                 * los centavos restantes.
                 *
                 * Así la suma siempre coincide
                 * exactamente con montoBase.
                 */
                if (
                    indice ===
                    socios.length - 1
                ) {
                    montoCentavos =
                        totalCentavos -
                        centavosAsignados;
                } else {
                    montoCentavos =
                        Math.round(
                            totalCentavos *
                            proporcion
                        );

                    centavosAsignados +=
                        montoCentavos;
                }

                return {
                    socio_id:
                        socio.socio_id,

                    nombre:
                        socio.nombre,

                    identificacion:
                        socio.identificacion,

                    total_aportes:
                        socio.total_aportes,

                    total_retiros:
                        socio.total_retiros,

                    capital_neto:
                        socio.capital_neto,

                    porcentaje_participacion:
                        porcentaje,

                    monto_estimado:
                        Number(
                            (
                                montoCentavos /
                                100
                            ).toFixed(2)
                        )
                };
            }
        );

    return {
        periodo,

        total_ingresos:
            utilidadPeriodo
                .total_ingresos,

        total_egresos:
            utilidadPeriodo
                .total_egresos,

        utilidad_periodo:
            utilidadPeriodo
                .utilidad,

        monto_distribuir:
            Number(
                montoBase.toFixed(2)
            ),

        capital_total:
            Number(
                capitalTotal.toFixed(2)
            ),

        total_socios:
            distribucion.length,

        socios:
            distribucion
    };
};

/* =====================================================
   VALIDAR DISTRIBUCIÓN EXISTENTE
===================================================== */

const validarPeriodoNoGenerado =
    async (
        periodo,
        client
    ) => {
        const resultado =
            await client.query(
                `
                SELECT
                    id

                FROM distribuciones_utilidades

                WHERE periodo = $1
                  AND estado <> 'anulado'

                LIMIT 1
                `,
                [
                    periodo
                ]
            );

        if (
            resultado.rows.length > 0
        ) {
            throw crearError(
                `Ya existe una distribución de utilidades para el período ${periodo}`,
                409
            );
        }
    };

/* =====================================================
   GENERAR DISTRIBUCIONES
===================================================== */

/*
 * Genera un registro por socio.
 *
 * El porcentaje se obtiene del capital real.
 *
 * El frontend NO decide el porcentaje.
 *
 * Tampoco confiamos en utilidad_periodo enviada
 * por el frontend; se recalcula desde transacciones.
 */
const generarDistribucion = async (
    data
) => {
    validarPeriodo(
        data.periodo
    );

    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        await validarPeriodoNoGenerado(
            data.periodo,
            client
        );

        const utilidadPeriodo =
            await calcularUtilidadPeriodo(
                data.periodo,
                client
            );

        if (
            utilidadPeriodo.utilidad <= 0
        ) {
            throw crearError(
                "El período no tiene una utilidad positiva para distribuir",
                400
            );
        }

        const montoDistribuir =
            Number(
                data.monto_distribuir
            );

        if (
            !Number.isFinite(
                montoDistribuir
            ) ||
            montoDistribuir <= 0
        ) {
            throw crearError(
                "El monto a distribuir debe ser mayor que cero",
                400
            );
        }

        if (
            montoDistribuir >
            utilidadPeriodo.utilidad
        ) {
            throw crearError(
                `El monto a distribuir no puede superar la utilidad del período ($${utilidadPeriodo.utilidad.toFixed(
                    2
                )})`,
                400
            );
        }

        const socios =
            await obtenerCapitalSociosActivos(
                client
            );

        if (
            socios.length === 0
        ) {
            throw crearError(
                "No existen socios activos con capital para distribuir utilidades",
                400
            );
        }

        const capitalTotal =
            socios.reduce(
                (
                    acumulado,
                    socio
                ) =>
                    acumulado +
                    socio.capital_neto,
                0
            );

        if (
            capitalTotal <= 0
        ) {
            throw crearError(
                "El capital neto total debe ser mayor que cero",
                400
            );
        }

        const totalCentavos =
            Math.round(
                montoDistribuir *
                100
            );

        let centavosAsignados =
            0;

        const distribuciones =
            [];

        for (
            let i = 0;
            i < socios.length;
            i++
        ) {
            const socio =
                socios[i];

            const proporcion =
                socio.capital_neto /
                capitalTotal;

            const porcentaje =
                Number(
                    (
                        proporcion *
                        100
                    ).toFixed(2)
                );

            let montoCentavos;

            if (
                i ===
                socios.length - 1
            ) {
                montoCentavos =
                    totalCentavos -
                    centavosAsignados;
            } else {
                montoCentavos =
                    Math.round(
                        totalCentavos *
                        proporcion
                    );

                centavosAsignados +=
                    montoCentavos;
            }

            const montoSocio =
                Number(
                    (
                        montoCentavos /
                        100
                    ).toFixed(2)
                );

            const resultado =
                await client.query(
                    `
                    INSERT INTO distribuciones_utilidades
                    (
                        socio_id,
                        periodo,
                        utilidad_periodo,
                        utilidad_base,
                        porcentaje_aplicado,
                        monto,
                        estado,
                        observaciones
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        'pendiente',
                        $7
                    )
                    RETURNING *
                    `,
                    [
                        socio.socio_id,

                        data.periodo,

                        utilidadPeriodo.utilidad,

                        montoDistribuir,

                        porcentaje,

                        montoSocio,

                        data.observaciones
                            ? data.observaciones.trim()
                            : null
                    ]
                );

            distribuciones.push({
                ...normalizarDistribucion(
                    resultado.rows[0]
                ),

                socio_nombre:
                    socio.nombre,

                socio_identificacion:
                    socio.identificacion,

                capital_neto:
                    socio.capital_neto
            });
        }

        await client.query(
            "COMMIT"
        );

        return {
            periodo:
                data.periodo,

            total_ingresos:
                utilidadPeriodo
                    .total_ingresos,

            total_egresos:
                utilidadPeriodo
                    .total_egresos,

            utilidad_periodo:
                utilidadPeriodo
                    .utilidad,

            monto_distribuido:
                montoDistribuir,

            capital_total:
                Number(
                    capitalTotal.toFixed(
                        2
                    )
                ),

            total_socios:
                distribuciones.length,

            distribuciones
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
   LISTAR DISTRIBUCIONES
===================================================== */

const listarDistribuciones = async ({
    periodo,
    socio_id,
    estado,
    fecha_desde,
    fecha_hasta
} = {}) => {
    const condiciones = [];

    const valores = [];

    if (periodo) {
        valores.push(
            periodo
        );

        condiciones.push(
            `du.periodo = $${valores.length}`
        );
    }

    if (socio_id) {
        valores.push(
            socio_id
        );

        condiciones.push(
            `du.socio_id = $${valores.length}`
        );
    }

    if (estado) {
        valores.push(
            estado
        );

        condiciones.push(
            `du.estado = $${valores.length}`
        );
    }

    if (fecha_desde) {
        valores.push(
            fecha_desde
        );

        condiciones.push(
            `du.fecha_creacion::DATE >= $${valores.length}`
        );
    }

    if (fecha_hasta) {
        valores.push(
            fecha_hasta
        );

        condiciones.push(
            `du.fecha_creacion::DATE <= $${valores.length}`
        );
    }

    const where =
        condiciones.length > 0
            ? `WHERE ${condiciones.join(
                " AND "
            )}`
            : "";

    const resultado =
        await pool.query(
            `
            SELECT
                du.id,
                du.socio_id,

                s.nombre
                    AS socio_nombre,

                s.identificacion
                    AS socio_identificacion,

                du.periodo,

                du.utilidad_periodo,

                du.utilidad_base,

                du.porcentaje_aplicado,

                du.monto,

                du.estado,

                du.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                du.metodo_pago,

                du.referencia,

                du.fecha_pago,

                du.transaccion_id,

                du.observaciones,

                du.fecha_creacion,

                du.fecha_actualizacion

            FROM distribuciones_utilidades du

            INNER JOIN socios s
                ON s.id = du.socio_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = du.cuenta_id

            ${where}

            ORDER BY
                du.periodo DESC,
                s.nombre ASC
            `,
            valores
        );

    return resultado.rows.map(
        normalizarDistribucion
    );
};

/* =====================================================
   OBTENER MIS UTILIDADES
   PORTAL DEL SOCIO
===================================================== */

/**
 * Obtiene únicamente las distribuciones de utilidad
 * correspondientes al socio vinculado con el
 * usuario autenticado.
 *
 * NO recibe socio_id desde el frontend.
 *
 * Flujo:
 *
 * usuarioId
 *    ↓
 * socios.usuario_id
 *    ↓
 * socios.id
 *    ↓
 * distribuciones_utilidades.socio_id
 */
const obtenerMisUtilidades = async (
    usuarioId
) => {
    /* =================================================
       BUSCAR SOCIO VINCULADO AL USUARIO
    ================================================= */

    const socioResultado =
        await pool.query(
            `
            SELECT
                id,
                nombre,
                identificacion,
                activo

            FROM socios

            WHERE usuario_id = $1

            LIMIT 1
            `,
            [
                usuarioId
            ]
        );

    if (
        socioResultado.rowCount === 0
    ) {
        throw crearError(
            "El usuario autenticado no está vinculado a ningún socio.",
            404
        );
    }

    const socio =
        socioResultado.rows[0];

    /* =================================================
       OBTENER DISTRIBUCIONES DEL SOCIO
    ================================================= */

    const resultado =
        await pool.query(
            `
            SELECT
                du.id,

                du.socio_id,

                s.nombre
                    AS socio_nombre,

                s.identificacion
                    AS socio_identificacion,

                du.periodo,

                du.utilidad_periodo,

                du.utilidad_base,

                du.porcentaje_aplicado,

                du.monto,

                du.estado,

                du.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                cf.tipo
                    AS cuenta_tipo,

                du.metodo_pago,

                du.referencia,

                du.fecha_pago,

                du.transaccion_id,

                du.observaciones,

                du.fecha_creacion,

                du.fecha_actualizacion

            FROM distribuciones_utilidades du

            INNER JOIN socios s
                ON s.id = du.socio_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = du.cuenta_id

            WHERE du.socio_id = $1

            ORDER BY
                du.periodo DESC,
                du.fecha_creacion DESC
            `,
            [
                socio.id
            ]
        );

    return resultado.rows.map(
        normalizarDistribucion
    );
};

/* =====================================================
   OBTENER DISTRIBUCIÓN POR ID
===================================================== */

const obtenerDistribucionPorId =
    async (
        id,
        db = pool
    ) => {
        const resultado =
            await db.query(
                `
                SELECT
                    du.id,

                    du.socio_id,

                    s.nombre
                        AS socio_nombre,

                    s.identificacion
                        AS socio_identificacion,

                    du.periodo,

                    du.utilidad_periodo,

                    du.utilidad_base,

                    du.porcentaje_aplicado,

                    du.monto,

                    du.estado,

                    du.cuenta_id,

                    cf.nombre
                        AS cuenta_nombre,

                    cf.tipo
                        AS cuenta_tipo,

                    du.metodo_pago,

                    du.referencia,

                    du.fecha_pago,

                    du.transaccion_id,

                    du.observaciones,

                    du.fecha_creacion,

                    du.fecha_actualizacion

                FROM distribuciones_utilidades du

                INNER JOIN socios s
                    ON s.id = du.socio_id

                LEFT JOIN cuentas_financieras cf
                    ON cf.id = du.cuenta_id

                WHERE du.id = $1
                `,
                [
                    id
                ]
            );

        if (
            resultado.rows.length === 0
        ) {
            return null;
        }

        return normalizarDistribucion(
            resultado.rows[0]
        );
    };

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

const pagarUtilidad = async (
    id,
    data
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        /*
         * 1. Bloquear distribución.
         */
        const distribucionRes =
            await client.query(
                `
                SELECT
                    du.*,
                    s.nombre
                        AS socio_nombre

                FROM distribuciones_utilidades du

                INNER JOIN socios s
                    ON s.id = du.socio_id

                WHERE du.id = $1

                FOR UPDATE
                `,
                [
                    id
                ]
            );

        if (
            distribucionRes.rows.length === 0
        ) {
            throw crearError(
                "La distribución de utilidad no existe",
                404
            );
        }

        const distribucion =
            distribucionRes.rows[0];

        if (
            distribucion.estado ===
            "pagado"
        ) {
            throw crearError(
                "Esta utilidad ya fue pagada",
                409
            );
        }

        if (
            distribucion.estado ===
            "anulado"
        ) {
            throw crearError(
                "No se puede pagar una distribución anulada",
                400
            );
        }

        const monto =
            Number(
                distribucion.monto
            );

        /*
         * 2. Bloquear cuenta.
         */
        const cuentaRes =
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

                FOR UPDATE
                `,
                [
                    data.cuenta_id
                ]
            );

        if (
            cuentaRes.rows.length === 0
        ) {
            throw crearError(
                "La cuenta financiera no existe",
                404
            );
        }

        const cuenta =
            cuentaRes.rows[0];

        if (
            !cuenta.activo
        ) {
            throw crearError(
                "No se puede realizar el pago desde una cuenta inactiva",
                400
            );
        }

        const saldoActual =
            Number(
                cuenta.saldo_actual
            );

        if (
            saldoActual <
            monto
        ) {
            throw crearError(
                `Saldo insuficiente. La cuenta dispone de $${saldoActual.toFixed(
                    2
                )}`,
                400
            );
        }

        /*
         * 3. Crear transacción financiera.
         */
        const transaccionRes =
            await client.query(
                `
                INSERT INTO transacciones
                (
                    cuenta_id,
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
                    'egreso',
                    $2,
                    $3,
                    $4,
                    $5,
                    'utilidades_socios',
                    $6
                )
                RETURNING *
                `,
                [
                    data.cuenta_id,

                    monto,

                    `Pago de utilidad ${distribucion.periodo} al socio ${distribucion.socio_nombre}`,

                    data.fecha_pago,

                    distribucion.id,

                    distribucion.id
                ]
            );

        const transaccion =
            transaccionRes.rows[0];

        /*
         * 4. Disminuir saldo.
         */
        await client.query(
            `
            UPDATE cuentas_financieras

            SET
                saldo_actual =
                    saldo_actual - $1,

                fecha_actualizacion =
                    NOW()

            WHERE id = $2
            `,
            [
                monto,
                data.cuenta_id
            ]
        );

        /*
         * 5. Marcar distribución como pagada.
         */
        await client.query(
            `
            UPDATE distribuciones_utilidades

            SET
                cuenta_id = $1,

                estado = 'pagado',

                metodo_pago = $2,

                referencia = $3,

                fecha_pago = $4,

                transaccion_id = $5,

                observaciones =
                    COALESCE(
                        $6,
                        observaciones
                    ),

                fecha_actualizacion =
                    NOW()

            WHERE id = $7
            `,
            [
                data.cuenta_id,

                data.metodo_pago,

                data.referencia
                    ? data.referencia.trim()
                    : null,

                data.fecha_pago,

                transaccion.id,

                data.observaciones
                    ? data.observaciones.trim()
                    : null,

                id
            ]
        );

        await client.query(
            "COMMIT"
        );

        return await obtenerDistribucionPorId(
            id
        );
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
   ANULAR DISTRIBUCIÓN
===================================================== */

const anularDistribucion = async (
    id
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const resultado =
            await client.query(
                `
                SELECT *

                FROM distribuciones_utilidades

                WHERE id = $1

                FOR UPDATE
                `,
                [
                    id
                ]
            );

        if (
            resultado.rows.length === 0
        ) {
            throw crearError(
                "La distribución de utilidad no existe",
                404
            );
        }

        const distribucion =
            resultado.rows[0];

        /*
         * Para mantener inicialmente una lógica segura,
         * solo anulamos distribuciones NO pagadas.
         *
         * Si una utilidad ya fue pagada, posteriormente
         * podemos crear una función específica de reverso.
         */
        if (
            distribucion.estado ===
            "pagado"
        ) {
            throw crearError(
                "Una utilidad pagada no puede anularse directamente. Debe realizarse una reversión financiera.",
                409
            );
        }

        if (
            distribucion.estado ===
            "anulado"
        ) {
            throw crearError(
                "La distribución ya se encuentra anulada",
                409
            );
        }

        await client.query(
            `
            UPDATE distribuciones_utilidades

            SET
                estado = 'anulado',

                fecha_actualizacion =
                    NOW()

            WHERE id = $1
            `,
            [
                id
            ]
        );

        await client.query(
            "COMMIT"
        );

        return await obtenerDistribucionPorId(
            id
        );
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
   RESUMEN DE DISTRIBUCIONES
===================================================== */

const obtenerResumenDistribuciones =
    async (
        periodo = null
    ) => {
        const valores =
            [];

        let filtroPeriodo =
            "";

        if (
            periodo
        ) {
            validarPeriodo(
                periodo
            );

            valores.push(
                periodo
            );

            filtroPeriodo =
                `WHERE du.periodo = $1`;
        }

        const resultado =
            await pool.query(
                `
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN du.estado <> 'anulado'
                                THEN du.monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_distribuido,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN du.estado = 'pagado'
                                THEN du.monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_pagado,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN du.estado = 'pendiente'
                                THEN du.monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_pendiente,

                    COUNT(
                        *
                    ) FILTER (
                        WHERE du.estado = 'pagado'
                    ) AS cantidad_pagadas,

                    COUNT(
                        *
                    ) FILTER (
                        WHERE du.estado = 'pendiente'
                    ) AS cantidad_pendientes

                FROM distribuciones_utilidades du

                ${filtroPeriodo}
                `,
                valores
            );

        return {
            total_distribuido:
                Number(
                    resultado.rows[0]
                        .total_distribuido ||
                    0
                ),

            total_pagado:
                Number(
                    resultado.rows[0]
                        .total_pagado ||
                    0
                ),

            total_pendiente:
                Number(
                    resultado.rows[0]
                        .total_pendiente ||
                    0
                ),

            cantidad_pagadas:
                Number(
                    resultado.rows[0]
                        .cantidad_pagadas ||
                    0
                ),

            cantidad_pendientes:
                Number(
                    resultado.rows[0]
                        .cantidad_pendientes ||
                    0
                )
        };
    };

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    calcularUtilidadPeriodo,
    calcularDistribucion,
    generarDistribucion,
    listarDistribuciones,
    obtenerMisUtilidades,
    obtenerDistribucionPorId,
    pagarUtilidad,
    anularDistribucion,
    obtenerResumenDistribuciones
};