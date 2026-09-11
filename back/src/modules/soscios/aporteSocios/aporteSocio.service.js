const { pool } = require("../../../config/db");

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

/**
 * Convierte valores vacíos en null.
 */
const normalizarTexto = (valor) => {
    if (valor === undefined || valor === null) {
        return null;
    }

    const texto = String(valor).trim();

    return texto === "" ? null : texto;
};

/**
 * Obtiene un aporte o retiro por ID utilizando
 * un cliente de PostgreSQL.
 */
const obtenerMovimientoPorIdConCliente = async (
    client,
    movimientoId
) => {
    const resultado = await client.query(
        `
        SELECT
            ap.id,
            ap.socio_id,
            s.nombre AS socio_nombre,
            s.identificacion AS socio_identificacion,

            ap.cuenta_id,
            cf.nombre AS cuenta_nombre,
            cf.tipo AS cuenta_tipo,

            ap.tipo,
            ap.monto,
            ap.fecha,
            ap.metodo_pago,
            ap.referencia,
            ap.estado,
            ap.observaciones,
            ap.transaccion_id,
            ap.fecha_creacion,
            ap.fecha_actualizacion

        FROM aportes_socios ap

        INNER JOIN socios s
            ON s.id = ap.socio_id

        LEFT JOIN cuentas_financieras cf
            ON cf.id = ap.cuenta_id

        WHERE ap.id = $1
        `,
        [movimientoId]
    );

    return resultado.rows[0] || null;
};

/**
 * Verifica que el socio exista y esté activo.
 */
const validarSocioActivo = async (
    client,
    socioId
) => {
    const resultado = await client.query(
        `
        SELECT
            id,
            nombre,
            activo

        FROM socios

        WHERE id = $1
        `,
        [socioId]
    );

    if (resultado.rowCount === 0) {
        const error = new Error(
            "El socio seleccionado no existe."
        );

        error.statusCode = 404;

        throw error;
    }

    const socio = resultado.rows[0];

    if (!socio.activo) {
        const error = new Error(
            "El socio seleccionado está inactivo."
        );

        error.statusCode = 400;

        throw error;
    }

    return socio;
};

/**
 * Verifica que la cuenta financiera exista y esté activa.
 */
const validarCuentaActiva = async (
    client,
    cuentaId
) => {
    const resultado = await client.query(
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

    if (resultado.rowCount === 0) {
        const error = new Error(
            "La cuenta financiera seleccionada no existe."
        );

        error.statusCode = 404;

        throw error;
    }

    const cuenta = resultado.rows[0];

    if (!cuenta.activo) {
        const error = new Error(
            "La cuenta financiera seleccionada está inactiva."
        );

        error.statusCode = 400;

        throw error;
    }

    return cuenta;
};

/**
 * Genera una transacción financiera y actualiza
 * el saldo de la cuenta.
 *
 * aporte -> ingreso
 * retiro -> egreso
 */
const generarMovimientoFinanciero = async ({
    client,
    aporteSocioId,
    socioNombre,
    cuentaId,
    tipoMovimiento,
    monto,
    fecha,
    referencia,
    descripcionAdicional
}) => {
    const cuenta = await validarCuentaActiva(
        client,
        cuentaId
    );

    const montoNumerico = Number(monto);

    if (
        !Number.isFinite(montoNumerico) ||
        montoNumerico <= 0
    ) {
        const error = new Error(
            "El monto debe ser mayor que cero."
        );

        error.statusCode = 400;

        throw error;
    }

    const esAporte =
        tipoMovimiento === "aporte";

    const tipoTransaccion =
        esAporte
            ? "ingreso"
            : "egreso";

    const saldoActual =
        Number(cuenta.saldo_actual);

    if (
        tipoMovimiento === "retiro" &&
        saldoActual < montoNumerico
    ) {
        const error = new Error(
            `La cuenta ${cuenta.nombre} no tiene saldo suficiente para realizar el retiro.`
        );

        error.statusCode = 400;

        throw error;
    }

    const descripcionBase =
        esAporte
            ? `Aporte realizado por el socio ${socioNombre}`
            : `Retiro realizado por el socio ${socioNombre}`;

    const descripcion = [
        descripcionBase,

        referencia
            ? `Referencia: ${referencia}`
            : null,

        descripcionAdicional
    ]
        .filter(Boolean)
        .join(". ");

    const transaccionResultado =
        await client.query(
            `
            INSERT INTO transacciones (
                cuenta_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                origen_modulo,
                origen_id
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )

            RETURNING *
            `,
            [
                cuentaId,
                tipoTransaccion,
                montoNumerico,
                descripcion,
                fecha,
                aporteSocioId,
                "aportes_socios",
                aporteSocioId
            ]
        );

    if (esAporte) {
        await client.query(
            `
            UPDATE cuentas_financieras

            SET
                saldo_actual =
                    saldo_actual + $1,

                fecha_actualizacion = NOW()

            WHERE id = $2
            `,
            [
                montoNumerico,
                cuentaId
            ]
        );
    } else {
        await client.query(
            `
            UPDATE cuentas_financieras

            SET
                saldo_actual =
                    saldo_actual - $1,

                fecha_actualizacion = NOW()

            WHERE id = $2
            `,
            [
                montoNumerico,
                cuentaId
            ]
        );
    }

    return transaccionResultado.rows[0];
};

/**
 * Revierte financieramente un aporte o retiro confirmado.
 *
 * No elimina la transacción original.
 * Registra una transacción inversa para conservar auditoría.
 */
const revertirMovimientoFinanciero = async ({
    client,
    movimiento
}) => {
    if (!movimiento.transaccion_id) {
        return null;
    }

    const cuenta = await validarCuentaActiva(
        client,
        movimiento.cuenta_id
    );

    const monto =
        Number(movimiento.monto);

    const eraAporte =
        movimiento.tipo === "aporte";

    const tipoReversion =
        eraAporte
            ? "egreso"
            : "ingreso";

    /*
     * Si se anula un aporte, se debe descontar
     * el dinero que había ingresado.
     */
    if (
        eraAporte &&
        Number(cuenta.saldo_actual) < monto
    ) {
        const error = new Error(
            `La cuenta ${cuenta.nombre} no tiene saldo suficiente para anular este aporte.`
        );

        error.statusCode = 400;

        throw error;
    }

    const descripcion =
        eraAporte
            ? `Anulación del aporte del socio ${movimiento.socio_nombre}`
            : `Anulación del retiro del socio ${movimiento.socio_nombre}`;

    const reversionResultado =
        await client.query(
            `
            INSERT INTO transacciones (
                cuenta_id,
                tipo,
                monto,
                descripcion,
                fecha,
                referencia_id,
                origen_modulo,
                origen_id
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                CURRENT_DATE,
                $5,
                $6,
                $7
            )

            RETURNING *
            `,
            [
                movimiento.cuenta_id,
                tipoReversion,
                monto,
                descripcion,
                movimiento.id,
                "anulacion_aportes_socios",
                movimiento.id
            ]
        );

    if (eraAporte) {
        await client.query(
            `
            UPDATE cuentas_financieras

            SET
                saldo_actual =
                    saldo_actual - $1,

                fecha_actualizacion = NOW()

            WHERE id = $2
            `,
            [
                monto,
                movimiento.cuenta_id
            ]
        );
    } else {
        await client.query(
            `
            UPDATE cuentas_financieras

            SET
                saldo_actual =
                    saldo_actual + $1,

                fecha_actualizacion = NOW()

            WHERE id = $2
            `,
            [
                monto,
                movimiento.cuenta_id
            ]
        );
    }

    return reversionResultado.rows[0];
};

/* =====================================================
   CREAR APORTE O RETIRO
===================================================== */

const crearAporteSocio = async (
    datos
) => {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            socio_id,
            cuenta_id,
            tipo,
            monto,
            fecha,
            metodo_pago,
            referencia,
            estado = "confirmado",
            observaciones
        } = datos;

        const socio =
            await validarSocioActivo(
                client,
                socio_id
            );

        /*
         * Aunque el movimiento sea pendiente,
         * verificamos que la cuenta exista.
         */
        await validarCuentaActiva(
            client,
            cuenta_id
        );

        const resultado =
            await client.query(
                `
                INSERT INTO aportes_socios (
                    socio_id,
                    cuenta_id,
                    tipo,
                    monto,
                    fecha,
                    metodo_pago,
                    referencia,
                    estado,
                    observaciones
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )

                RETURNING *
                `,
                [
                    socio_id,
                    cuenta_id,
                    tipo,
                    Number(monto),
                    fecha,

                    normalizarTexto(
                        metodo_pago
                    ),

                    normalizarTexto(
                        referencia
                    ),

                    estado,

                    normalizarTexto(
                        observaciones
                    )
                ]
            );

        const movimiento =
            resultado.rows[0];

        /*
         * Un movimiento pendiente no modifica
         * las finanzas hasta ser confirmado.
         */
        if (estado === "confirmado") {
            const transaccion =
                await generarMovimientoFinanciero({
                    client,

                    aporteSocioId:
                        movimiento.id,

                    socioNombre:
                        socio.nombre,

                    cuentaId:
                        cuenta_id,

                    tipoMovimiento:
                        tipo,

                    monto,

                    fecha,

                    referencia:
                        normalizarTexto(
                            referencia
                        ),

                    descripcionAdicional:
                        normalizarTexto(
                            observaciones
                        )
                });

            await client.query(
                `
                UPDATE aportes_socios

                SET
                    transaccion_id = $1,
                    fecha_actualizacion = NOW()

                WHERE id = $2
                `,
                [
                    transaccion.id,
                    movimiento.id
                ]
            );
        }

        await client.query(
            "COMMIT"
        );

        return await obtenerMovimientoPorId(
            movimiento.id
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
   LISTAR APORTES Y RETIROS
===================================================== */

const listarAportesSocios = async (
    filtros = {}
) => {
    const {
        buscar,
        socio_id,
        cuenta_id,
        tipo,
        estado,
        fecha_desde,
        fecha_hasta
    } = filtros;

    const condiciones = [];
    const valores = [];

    const agregarCondicion = (
        condicion,
        valor
    ) => {
        valores.push(
            valor
        );

        condiciones.push(
            condicion.replace(
                "?",
                `$${valores.length}`
            )
        );
    };

    if (buscar) {
        valores.push(
            `%${String(
                buscar
            ).trim()}%`
        );

        const posicion =
            `$${valores.length}`;

        condiciones.push(
            `
            (
                s.nombre ILIKE ${posicion}

                OR

                s.identificacion ILIKE ${posicion}

                OR

                ap.referencia ILIKE ${posicion}

                OR

                cf.nombre ILIKE ${posicion}
            )
            `
        );
    }

    if (socio_id) {
        agregarCondicion(
            "ap.socio_id = ?",
            socio_id
        );
    }

    if (cuenta_id) {
        agregarCondicion(
            "ap.cuenta_id = ?",
            cuenta_id
        );
    }

    if (tipo) {
        agregarCondicion(
            "ap.tipo = ?",
            tipo
        );
    }

    if (estado) {
        agregarCondicion(
            "ap.estado = ?",
            estado
        );
    }

    if (fecha_desde) {
        agregarCondicion(
            "ap.fecha >= ?",
            fecha_desde
        );
    }

    if (fecha_hasta) {
        agregarCondicion(
            "ap.fecha <= ?",
            fecha_hasta
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
                ap.id,
                ap.socio_id,

                s.nombre
                    AS socio_nombre,

                s.identificacion
                    AS socio_identificacion,

                ap.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                cf.tipo
                    AS cuenta_tipo,

                ap.tipo,
                ap.monto,
                ap.fecha,
                ap.metodo_pago,
                ap.referencia,
                ap.estado,
                ap.observaciones,
                ap.transaccion_id,
                ap.fecha_creacion,
                ap.fecha_actualizacion

            FROM aportes_socios ap

            INNER JOIN socios s
                ON s.id = ap.socio_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = ap.cuenta_id

            ${where}

            ORDER BY
                ap.fecha DESC,
                ap.fecha_creacion DESC
            `,
            valores
        );

    return resultado.rows;
};

/* =====================================================
   OBTENER MIS APORTES Y RETIROS
   PORTAL DEL SOCIO
===================================================== */

/**
 * Obtiene exclusivamente los movimientos
 * correspondientes al usuario autenticado.
 *
 * El frontend NO envía socio_id.
 *
 * Flujo:
 *
 * usuarios.id
 *      ↓
 * socios.usuario_id
 *      ↓
 * socios.id
 *      ↓
 * aportes_socios.socio_id
 */
const obtenerMisAportes = async (
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
        const error = new Error(
            "El usuario autenticado no está vinculado a ningún socio."
        );

        error.statusCode = 404;

        throw error;
    }

    const socio =
        socioResultado.rows[0];

    /* =================================================
       OBTENER MOVIMIENTOS DEL SOCIO
    ================================================= */

    const resultado =
        await pool.query(
            `
            SELECT
                ap.id,

                ap.socio_id,

                s.nombre
                    AS socio_nombre,

                s.identificacion
                    AS socio_identificacion,

                ap.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                cf.tipo
                    AS cuenta_tipo,

                ap.tipo,

                ap.monto,

                ap.fecha,

                ap.metodo_pago,

                ap.referencia,

                ap.estado,

                ap.observaciones,

                ap.fecha_creacion,

                ap.fecha_actualizacion

            FROM aportes_socios ap

            INNER JOIN socios s
                ON s.id = ap.socio_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = ap.cuenta_id

            WHERE ap.socio_id = $1

            ORDER BY
                ap.fecha DESC,
                ap.fecha_creacion DESC
            `,
            [
                socio.id
            ]
        );

    return resultado.rows.map(
        (movimiento) => ({
            ...movimiento,

            monto:
                Number(
                    movimiento.monto || 0
                )
        })
    );
};

/* =====================================================
   OBTENER APORTE O RETIRO POR ID
===================================================== */

const obtenerMovimientoPorId = async (
    movimientoId
) => {
    const resultado =
        await pool.query(
            `
            SELECT
                ap.id,
                ap.socio_id,

                s.nombre
                    AS socio_nombre,

                s.identificacion
                    AS socio_identificacion,

                ap.cuenta_id,

                cf.nombre
                    AS cuenta_nombre,

                cf.tipo
                    AS cuenta_tipo,

                cf.saldo_actual
                    AS cuenta_saldo_actual,

                ap.tipo,
                ap.monto,
                ap.fecha,
                ap.metodo_pago,
                ap.referencia,
                ap.estado,
                ap.observaciones,
                ap.transaccion_id,
                ap.fecha_creacion,
                ap.fecha_actualizacion

            FROM aportes_socios ap

            INNER JOIN socios s
                ON s.id = ap.socio_id

            LEFT JOIN cuentas_financieras cf
                ON cf.id = ap.cuenta_id

            WHERE ap.id = $1
            `,
            [
                movimientoId
            ]
        );

    if (
        resultado.rowCount === 0
    ) {
        const error = new Error(
            "El aporte o retiro no existe."
        );

        error.statusCode = 404;

        throw error;
    }

    return resultado.rows[0];
};

/* =====================================================
   ACTUALIZAR APORTE O RETIRO PENDIENTE
===================================================== */

const actualizarAporteSocio = async (
    movimientoId,
    datos
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const movimientoActual =
            await obtenerMovimientoPorIdConCliente(
                client,
                movimientoId
            );

        if (!movimientoActual) {
            const error = new Error(
                "El aporte o retiro no existe."
            );

            error.statusCode = 404;

            throw error;
        }

        if (
            movimientoActual.estado !==
            "pendiente"
        ) {
            const error = new Error(
                "Solo se pueden editar movimientos que estén pendientes."
            );

            error.statusCode = 400;

            throw error;
        }

        const socioId =
            datos.socio_id ??
            movimientoActual.socio_id;

        const cuentaId =
            datos.cuenta_id ??
            movimientoActual.cuenta_id;

        await validarSocioActivo(
            client,
            socioId
        );

        await validarCuentaActiva(
            client,
            cuentaId
        );

        const resultado =
            await client.query(
                `
                UPDATE aportes_socios

                SET
                    socio_id = $1,
                    cuenta_id = $2,
                    tipo = $3,
                    monto = $4,
                    fecha = $5,
                    metodo_pago = $6,
                    referencia = $7,
                    observaciones = $8,
                    fecha_actualizacion = NOW()

                WHERE id = $9

                RETURNING *
                `,
                [
                    socioId,

                    cuentaId,

                    datos.tipo ??
                    movimientoActual.tipo,

                    Number(
                        datos.monto ??
                        movimientoActual.monto
                    ),

                    datos.fecha ??
                    movimientoActual.fecha,

                    datos.metodo_pago !==
                        undefined
                        ? normalizarTexto(
                            datos.metodo_pago
                        )
                        : movimientoActual.metodo_pago,

                    datos.referencia !==
                        undefined
                        ? normalizarTexto(
                            datos.referencia
                        )
                        : movimientoActual.referencia,

                    datos.observaciones !==
                        undefined
                        ? normalizarTexto(
                            datos.observaciones
                        )
                        : movimientoActual.observaciones,

                    movimientoId
                ]
            );

        await client.query(
            "COMMIT"
        );

        return await obtenerMovimientoPorId(
            resultado.rows[0].id
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
   CAMBIAR ESTADO
===================================================== */

const cambiarEstadoAporteSocio = async (
    movimientoId,
    nuevoEstado
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const movimiento =
            await obtenerMovimientoPorIdConCliente(
                client,
                movimientoId
            );

        if (!movimiento) {
            const error = new Error(
                "El aporte o retiro no existe."
            );

            error.statusCode = 404;

            throw error;
        }

        if (
            movimiento.estado ===
            nuevoEstado
        ) {
            const error = new Error(
                `El movimiento ya se encuentra en estado ${nuevoEstado}.`
            );

            error.statusCode = 400;

            throw error;
        }

        /*
         * Un movimiento anulado ya no puede
         * cambiar nuevamente de estado.
         */
        if (
            movimiento.estado ===
            "anulado"
        ) {
            const error = new Error(
                "Un movimiento anulado no puede modificarse."
            );

            error.statusCode = 400;

            throw error;
        }

        /*
         * Confirmar movimiento pendiente.
         */
        if (
            movimiento.estado ===
            "pendiente" &&
            nuevoEstado ===
            "confirmado"
        ) {
            const transaccion =
                await generarMovimientoFinanciero({
                    client,

                    aporteSocioId:
                        movimiento.id,

                    socioNombre:
                        movimiento.socio_nombre,

                    cuentaId:
                        movimiento.cuenta_id,

                    tipoMovimiento:
                        movimiento.tipo,

                    monto:
                        movimiento.monto,

                    fecha:
                        movimiento.fecha,

                    referencia:
                        movimiento.referencia,

                    descripcionAdicional:
                        movimiento.observaciones
                });

            await client.query(
                `
                UPDATE aportes_socios

                SET
                    estado = 'confirmado',
                    transaccion_id = $1,
                    fecha_actualizacion = NOW()

                WHERE id = $2
                `,
                [
                    transaccion.id,
                    movimientoId
                ]
            );
        }

        /*
         * Anular movimiento confirmado.
         */
        else if (
            movimiento.estado ===
            "confirmado" &&
            nuevoEstado ===
            "anulado"
        ) {
            await revertirMovimientoFinanciero({
                client,
                movimiento
            });

            await client.query(
                `
                UPDATE aportes_socios

                SET
                    estado = 'anulado',
                    fecha_actualizacion = NOW()

                WHERE id = $1
                `,
                [
                    movimientoId
                ]
            );
        }

        /*
         * Anular movimiento pendiente.
         * No necesita reversión financiera.
         */
        else if (
            movimiento.estado ===
            "pendiente" &&
            nuevoEstado ===
            "anulado"
        ) {
            await client.query(
                `
                UPDATE aportes_socios

                SET
                    estado = 'anulado',
                    fecha_actualizacion = NOW()

                WHERE id = $1
                `,
                [
                    movimientoId
                ]
            );
        } else {
            const error = new Error(
                `No se puede cambiar el movimiento de ${movimiento.estado} a ${nuevoEstado}.`
            );

            error.statusCode = 400;

            throw error;
        }

        await client.query(
            "COMMIT"
        );

        return await obtenerMovimientoPorId(
            movimientoId
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
   ELIMINAR APORTE PENDIENTE
===================================================== */

const eliminarAporteSocio = async (
    movimientoId
) => {
    const client =
        await pool.connect();

    try {
        await client.query(
            "BEGIN"
        );

        const movimiento =
            await obtenerMovimientoPorIdConCliente(
                client,
                movimientoId
            );

        if (!movimiento) {
            const error = new Error(
                "El aporte o retiro no existe."
            );

            error.statusCode = 404;

            throw error;
        }

        if (
            movimiento.estado !==
            "pendiente"
        ) {
            const error = new Error(
                "Solo pueden eliminarse movimientos pendientes. Los movimientos confirmados deben anularse."
            );

            error.statusCode = 400;

            throw error;
        }

        await client.query(
            `
            DELETE FROM aportes_socios

            WHERE id = $1
            `,
            [
                movimientoId
            ]
        );

        await client.query(
            "COMMIT"
        );

        return {
            message:
                "El movimiento pendiente fue eliminado correctamente."
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
   RESUMEN DE APORTES
===================================================== */

const obtenerResumenAportes = async (
    filtros = {}
) => {
    const {
        socio_id,
        fecha_desde,
        fecha_hasta
    } = filtros;

    const condiciones = [
        "estado = 'confirmado'"
    ];

    const valores = [];

    if (socio_id) {
        valores.push(
            socio_id
        );

        condiciones.push(
            `socio_id = $${valores.length}`
        );
    }

    if (fecha_desde) {
        valores.push(
            fecha_desde
        );

        condiciones.push(
            `fecha >= $${valores.length}`
        );
    }

    if (fecha_hasta) {
        valores.push(
            fecha_hasta
        );

        condiciones.push(
            `fecha <= $${valores.length}`
        );
    }

    const resultado =
        await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'aporte'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_aportes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'retiro'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_retiros,

                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'aporte'
                            THEN monto

                            WHEN tipo = 'retiro'
                            THEN -monto

                            ELSE 0
                        END
                    ),
                    0
                ) AS capital_neto,

                COUNT(*) FILTER (
                    WHERE tipo = 'aporte'
                ) AS cantidad_aportes,

                COUNT(*) FILTER (
                    WHERE tipo = 'retiro'
                ) AS cantidad_retiros

            FROM aportes_socios

            WHERE ${condiciones.join(
                " AND "
            )}
            `,
            valores
        );

    return {
        total_aportes:
            Number(
                resultado.rows[0]
                    .total_aportes || 0
            ),

        total_retiros:
            Number(
                resultado.rows[0]
                    .total_retiros || 0
            ),

        capital_neto:
            Number(
                resultado.rows[0]
                    .capital_neto || 0
            ),

        cantidad_aportes:
            Number(
                resultado.rows[0]
                    .cantidad_aportes || 0
            ),

        cantidad_retiros:
            Number(
                resultado.rows[0]
                    .cantidad_retiros || 0
            )
    };
};

/* =====================================================
   EXPORTACIONES
===================================================== */

module.exports = {
    crearAporteSocio,

    listarAportesSocios,

    obtenerMisAportes,

    obtenerMovimientoPorId,

    actualizarAporteSocio,

    cambiarEstadoAporteSocio,

    eliminarAporteSocio,

    obtenerResumenAportes
};