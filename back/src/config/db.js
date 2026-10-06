const { Pool, types } = require("pg");
require("dotenv").config();

/*
 * =====================================================
 * CONFIGURACIÓN DE TIPOS POSTGRESQL
 * =====================================================
 *
 * PostgreSQL:
 * OID 1114 = TIMESTAMP WITHOUT TIME ZONE
 *
 * En ConstructSys existen campos como:
 *
 *     marcaciones_asistencia.fecha_hora
 *
 * que representan una fecha y hora local de trabajo.
 *
 * Ejemplo:
 *
 *     2026-10-06 07:00:00
 *
 * debe continuar representando las 07:00 tanto en
 * desarrollo local como en producción.
 *
 * Por defecto, node-postgres puede convertir TIMESTAMP
 * a un objeto Date de JavaScript. Esa conversión depende
 * de la zona horaria del proceso Node y puede producir
 * diferencias entre el entorno local y Render.
 *
 * Por eso TIMESTAMP WITHOUT TIME ZONE se devuelve como
 * texto y evitamos conversiones automáticas.
 */
types.setTypeParser(1114, (value) => value);

// =====================================================
// POOL DE CONEXIONES
// =====================================================

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl:
        process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
});

// =====================================================
// EVENTOS DEL POOL
// =====================================================

// Evento cuando se conecta
pool.on("connect", () => {
    console.log("🟢 PostgreSQL conectado correctamente");
});

// Evento de error inesperado
pool.on("error", (err) => {
    console.error(
        "🔴 Error inesperado en PostgreSQL:",
        err.message
    );
});

// =====================================================
// PROBAR CONEXIÓN
// =====================================================

const testConnection = async () => {
    try {
        const client = await pool.connect();

        console.log(
            "✅ Conexión a la base de datos exitosa"
        );

        client.release();
    } catch (error) {
        console.error(
            "❌ No se pudo conectar a la base de datos:",
            error.message
        );
    }
};

module.exports = {
    pool,
    testConnection,
};