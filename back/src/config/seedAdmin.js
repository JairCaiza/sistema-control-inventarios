const bcrypt = require("bcrypt");
const { pool } = require("./db");

const seedAdmin = async () => {
    try {
        console.log("🔎 Verificando rol Administrador...");

        const roleResult = await pool.query(
            "SELECT id FROM roles WHERE nombre = $1",
            ["Administrador"]
        );

        if (roleResult.rows.length === 0) {
            console.log("⚠️ Rol Administrador no existe. Créalo primero.");
            return;
        }

        const rolId = roleResult.rows[0].id;

        console.log("🔎 Verificando usuario administrador...");

        const userResult = await pool.query(
            "SELECT id FROM usuarios WHERE correo = $1",
            ["admin@sistema.com"]
        );

        if (userResult.rows.length > 0) {
            console.log("✅ Administrador ya existe");
            return;
        }

        const hashedPassword = await bcrypt.hash("Admin123", 10);

        const newUser = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, correo, contrasena)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
            ["Administrador","Caiza", "admin@sistema.com", hashedPassword]
        );

        const usuarioId = newUser.rows[0].id;

        await pool.query(
            `INSERT INTO usuarios_roles (usuario_id, rol_id)
       VALUES ($1, $2)`,
            [usuarioId, rolId]
        );

        console.log("🔥 Administrador creado correctamente");
    } catch (error) {
        console.error("❌ Error creando admin:", error.message);
    }
};

module.exports = seedAdmin;