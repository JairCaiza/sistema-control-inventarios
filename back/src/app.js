const express = require("express");
const cors = require("cors");

const errorHandler = require("./middlewares/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");

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

/* 🔥 NUEVO */
const empleadosRoutes = require("./modules/gestion_obras/empleados/empleados.routes");
const obrasRoutes = require("./modules/gestion_obras/obras/obras.routes");
const pagosContratosRoutes = require("./modules/contratos/pagos/pagosContratos.routes");

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());

/* =========================
   CORS
========================= */

app.use(
   cors({
      origin: true,
      credentials: true,
   }),
);

/* =========================
   RUTAS TEST
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
   },
);

/* =========================
   AUTH
========================= */

app.use("/api/auth", authRoutes);

/* =========================
   ADMINISTRACION
========================= */

app.use("/api/users", usersRoutes);
app.use("/api/roles", rolesRoutes);

/* =========================
   INVENTARIO
========================= */

app.use("/api/categorias", categoriasRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/activos", activosRoutes);
app.use("/api/movimientos", movimientosRoutes);

/* =========================
   CLIENTES
========================= */

app.use("/api/clientes", clientesRoutes);

/* =========================
   CONTRATOS
========================= */

app.use("/api/contratos", contratosRoutes);

/* =========================
   DEVOLUCIONES
========================= */

app.use("/api/devoluciones", devolucionesRoutes);

/* =========================
   VENTAS
========================= */

app.use("/api/notas", notasRoutes);

/* =========================
   EMPLEADOS
========================= */

app.use("/api/empleados", empleadosRoutes);
/* =========================
   OBRAS
========================= */

app.use("/api/obras", obrasRoutes);

/* =========================
   Pagos de Contratos
========================= */

app.use("/api/contratos", pagosContratosRoutes);


/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

module.exports = app;