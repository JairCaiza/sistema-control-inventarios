const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Evento cuando se conecta
pool.on("connect", () => {
    console.log("🟢 PostgreSQL conectado correctamente");
});

// Evento error inesperado
pool.on("error", (err) => {
    console.error("🔴 Error inesperado en PostgreSQL:", err.message);
});

// Función para probar conexión manualmente
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Conexión a la base de datos exitosa");
        client.release();
    } catch (error) {
        console.error("❌ No se pudo conectar a la base de datos:", error.message);
    }
};

module.exports = {
    pool,
    testConnection,
};