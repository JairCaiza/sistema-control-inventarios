const bcrypt = require("bcrypt");
const { pool } = require("./db");

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminNombre = process.env.ADMIN_NOMBRE || "Administrador";
        const adminApellido = process.env.ADMIN_APELLIDO || "Sistema";

        // =====================================================
        // Validar variables necesarias
        // =====================================================

        if (!adminEmail || !adminPassword) {
            console.warn(
                "⚠️ ADMIN_EMAIL o ADMIN_PASSWORD no configurados. " +
                "No se creará automáticamente el administrador."
            );
            return;
        }

        console.log("🔎 Verificando rol Administrador...");

        // =====================================================
        // Buscar rol Administrador
        // =====================================================

        const roleResult = await pool.query(
            "SELECT id FROM roles WHERE nombre = $1",
            ["Administrador"]
        );

        if (roleResult.rows.length === 0) {
            console.warn(
                "⚠️ Rol Administrador no existe. " +
                "Verifica el seed base de roles."
            );
            return;
        }

        const rolId = roleResult.rows[0].id;

        console.log("🔎 Verificando usuario administrador...");

        // =====================================================
        // Verificar si ya existe
        // =====================================================

        const userResult = await pool.query(
            "SELECT id FROM usuarios WHERE correo = $1",
            [adminEmail]
        );

        if (userResult.rows.length > 0) {
            console.log("✅ Administrador ya existe");
            return;
        }

        // =====================================================
        // Crear contraseña segura con bcrypt
        // =====================================================

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // =====================================================
        // Crear administrador
        // =====================================================

        const newUser = await pool.query(
            `
            INSERT INTO usuarios (
                nombre,
                apellido,
                correo,
                contrasena
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [
                adminNombre,
                adminApellido,
                adminEmail,
                hashedPassword,
            ]
        );

        const usuarioId = newUser.rows[0].id;

        // =====================================================
        // Asignar rol Administrador
        // =====================================================

        await pool.query(
            `
            INSERT INTO usuarios_roles (
                usuario_id,
                rol_id
            )
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `,
            [usuarioId, rolId]
        );

        console.log("🔥 Administrador creado correctamente");
    } catch (error) {
        console.error(
            "❌ Error creando administrador:",
            error.message
        );
    }
};

module.exports = seedAdmin;