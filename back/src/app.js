const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const authorizeRoles = require("./middlewares/role.middleware");
const protect = require("./middlewares/auth.middleware");
const usersRoutes = require("./modules/users/users.routes");
const rolesRoutes = require("./modules/roles/roles.routes");
const categoriasRoutes = require("./modules/inventarios/categorias/categorias.routes");
const ubicacionesRoutes = require("./modules/inventarios/ubicaciones/ubicaciones.routes");
const activosRoutes = require("./modules/inventarios/activos/activos.routes");
const movimientosRoutes = require("./modules/inventarios/movimientos/movimientos.routes");
const clientesRoutes = require("./modules/clientes/clientes.routes");
const contratosRoutes = require("./modules/contratos/contratos.routes");
const devolucionesRoutes = require("./modules/devoluciones/devoluciones.routes");
const notasRoutes = require("./modules/ventas/notas/notas.routes");

const app = express();

app.use(express.json());

/* =========================
   CORS (CORREGIDO)
========================= */
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// 🔥 IMPORTANTE: SOLO ESTE middleware (NO duplicar headers)
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

/* =========================
   RUTAS
========================= */
app.get("/api/test", protect, (req, res) => {
    res.json({
        message: "Acceso permitido",
        user: req.user,
    });
});

app.get(
    "/api/admin-only",
    protect,
    authorizeRoles("Administrador"),
    (req, res) => {
        res.json({
            message: "Solo el administrador puede ver esto",
        });
    }
);

app.use('/api/auth', authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/activos", activosRoutes);
app.use("/api/movimientos", movimientosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/contratos", contratosRoutes);
app.use("/api/devoluciones", devolucionesRoutes);
app.use("/api/notas", notasRoutes);

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

module.exports = app;