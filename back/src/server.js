require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");
const seedAdmin = require("./config/seedAdmin");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await testConnection();

        await seedAdmin();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Error al iniciar servidor:", error.message);
    }
};

startServer();