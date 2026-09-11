const { pool } = require("../../config/db");

/* =====================================================
   CREAR CUENTA
===================================================== */
const crearCuenta = async (data) => {
    const nombre = data.nombre.trim();
    const tipo = data.tipo;
    const saldoInicial = Number(data.saldo_inicial || 0);
    const observaciones =
        data.observaciones?.trim() || null;

    const cuentaExistente = await pool.query(
        `SELECT id
         FROM cuentas_financieras
         WHERE LOWER(nombre) = LOWER($1)
         LIMIT 1`,
        [nombre]
    );

    if (cuentaExistente.rows.length > 0) {
        throw new Error(
            "Ya existe una cuenta financiera con ese nombre"
        );
    }

    const resultado = await pool.query(
        `INSERT INTO cuentas_financieras
        (
            nombre,
            tipo,
            saldo_actual,
            activo,
            observaciones
        )
        VALUES ($1, $2, $3, TRUE, $4)
        RETURNING
            id,
            nombre,
            tipo,
            saldo_actual,
            activo,
            observaciones,
            fecha_creacion,
            fecha_actualizacion`,
        [
            nombre,
            tipo,
            saldoInicial,
            observaciones
        ]
    );

    return {
        ...resultado.rows[0],
        movimientos: 0
    };
};

/* =====================================================
   LISTAR CUENTAS
===================================================== */
const listarCuentas = async ({
    buscar,
    tipo,
    activo
} = {}) => {
    const condiciones = [];
    const valores = [];

    if (buscar) {
        valores.push(`%${buscar.trim()}%`);

        condiciones.push(
            `(
                cf.nombre ILIKE $${valores.length}
                OR COALESCE(cf.observaciones, '') ILIKE $${valores.length}
            )`
        );
    }

    if (tipo) {
        valores.push(tipo);
        condiciones.push(
            `cf.tipo = $${valores.length}`
        );
    }

    if (
        activo !== undefined &&
        activo !== null &&
        activo !== ""
    ) {
        valores.push(activo === true || activo === "true");

        condiciones.push(
            `cf.activo = $${valores.length}`
        );
    }

    const where =
        condiciones.length > 0
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

    /*
      Cuando exista la tabla transacciones, el conteo
      se obtendrá mediante LEFT JOIN.

      Por ahora dejamos movimientos en 0 para que el
      frontend ya funcione.
    */
    const resultado = await pool.query(
        `SELECT
            cf.id,
            cf.nombre,
            cf.tipo,
            cf.saldo_actual,
            cf.activo,
            cf.observaciones,
            cf.fecha_creacion,
            cf.fecha_actualizacion,
            0::integer AS movimientos
         FROM cuentas_financieras cf
         ${where}
         ORDER BY
            cf.activo DESC,
            cf.nombre ASC`,
        valores
    );

    return resultado.rows;
};

/* =====================================================
   OBTENER CUENTA POR ID
===================================================== */
const obtenerCuentaPorId = async (id) => {
    const resultado = await pool.query(
        `SELECT
            cf.id,
            cf.nombre,
            cf.tipo,
            cf.saldo_actual,
            cf.activo,
            cf.observaciones,
            cf.fecha_creacion,
            cf.fecha_actualizacion,
            0::integer AS movimientos
         FROM cuentas_financieras cf
         WHERE cf.id = $1`,
        [id]
    );

    if (resultado.rows.length === 0) {
        throw new Error("Cuenta financiera no encontrada");
    }

    return resultado.rows[0];
};

/* =====================================================
   ACTUALIZAR CUENTA
===================================================== */
const actualizarCuenta = async (id, data) => {
    const nombre = data.nombre.trim();
    const tipo = data.tipo;
    const observaciones =
        data.observaciones?.trim() || null;

    const duplicada = await pool.query(
        `SELECT id
         FROM cuentas_financieras
         WHERE LOWER(nombre) = LOWER($1)
           AND id <> $2
         LIMIT 1`,
        [
            nombre,
            id
        ]
    );

    if (duplicada.rows.length > 0) {
        throw new Error(
            "Ya existe otra cuenta financiera con ese nombre"
        );
    }

    const resultado = await pool.query(
        `UPDATE cuentas_financieras
         SET
            nombre = $1,
            tipo = $2,
            observaciones = $3,
            activo = $4,
            fecha_actualizacion = NOW()
         WHERE id = $5
         RETURNING
            id,
            nombre,
            tipo,
            saldo_actual,
            activo,
            observaciones,
            fecha_creacion,
            fecha_actualizacion`,
        [
            nombre,
            tipo,
            observaciones,
            data.activo,
            id
        ]
    );

    if (resultado.rows.length === 0) {
        throw new Error("Cuenta financiera no encontrada");
    }

    return resultado.rows[0];
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */
const cambiarEstado = async (id, activo) => {
    const resultado = await pool.query(
        `UPDATE cuentas_financieras
         SET
            activo = $1,
            fecha_actualizacion = NOW()
         WHERE id = $2
         RETURNING
            id,
            nombre,
            tipo,
            saldo_actual,
            activo,
            observaciones,
            fecha_creacion,
            fecha_actualizacion`,
        [
            activo,
            id
        ]
    );

    if (resultado.rows.length === 0) {
        throw new Error("Cuenta financiera no encontrada");
    }

    return resultado.rows[0];
};

/* =====================================================
   ELIMINAR CUENTA
===================================================== */
const eliminarCuenta = async (id) => {
    const cuenta = await pool.query(
        `SELECT
            id,
            nombre,
            saldo_actual
         FROM cuentas_financieras
         WHERE id = $1`,
        [id]
    );

    if (cuenta.rows.length === 0) {
        throw new Error("Cuenta financiera no encontrada");
    }

    const saldoActual = Number(
        cuenta.rows[0].saldo_actual
    );

    if (saldoActual !== 0) {
        throw new Error(
            "No se puede eliminar una cuenta que tiene saldo. Primero transfiera o retire el saldo disponible"
        );
    }

    /*
      Cuando exista la tabla transacciones, aquí se debe
      comprobar también si la cuenta tiene movimientos.

      Si tiene movimientos, no debe eliminarse físicamente;
      solamente debe inactivarse.
    */

    await pool.query(
        `DELETE FROM cuentas_financieras
         WHERE id = $1`,
        [id]
    );

    return true;
};

/* =====================================================
   OBTENER RESUMEN
===================================================== */
const obtenerResumen = async () => {
    const resultado = await pool.query(
        `SELECT
            COUNT(*) FILTER (
                WHERE activo = TRUE
            )::integer AS total_cuentas,

            COALESCE(
                SUM(saldo_actual) FILTER (
                    WHERE activo = TRUE
                      AND tipo IN ('caja', 'efectivo')
                ),
                0
            ) AS saldo_cajas,

            COALESCE(
                SUM(saldo_actual) FILTER (
                    WHERE activo = TRUE
                ),
                0
            ) AS saldo_total

         FROM cuentas_financieras`
    );

    return resultado.rows[0];
};

module.exports = {
    crearCuenta,
    listarCuentas,
    obtenerCuentaPorId,
    actualizarCuenta,
    cambiarEstado,
    eliminarCuenta,
    obtenerResumen
};