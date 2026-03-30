import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../modules/auth/pages/LoginPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import DashboardLayout from "../layouts/DashboardLayout";

<<<<<<< Updated upstream
export const router = createBrowserRouter([
=======
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import UsersPage from "../modules/usuarios/pages/UsersPage";
import RolesPage from "../modules/roles/pages/RolesPage";
import CategoriasPage from "../modules/inventario/categorias/pages/CategoriasPage";
import ActivosPage from "../modules/inventario/activos/pages/ActivosPage";
import UbicacionesPage from "../modules/inventario/ubicaciones/pages/UbicacionesPage";
import MovimientosPage from "../modules/inventario/movimientos/pages/MovimientosPage";
import ActivoDetallePage from "../modules/inventario/activos/pages/ActivoDetallePage";
import InventarioReportePage from "../modules/inventario/reportes/pages/InventarioReportePage";

export const router = createBrowserRouter([
  /* RUTAS PUBLICAS */
>>>>>>> Stashed changes
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
<<<<<<< Updated upstream
        index: true,
        element: <DashboardPage />,
=======
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },

          {
            path: "/usuarios",
            element: <UsersPage />,
          },
          {
            path: "/roles",
            element: <RolesPage />,
          },
          {
            path: "/categorias",
            element: <CategoriasPage />,
          },
          {
            path: "/ubicaciones",
            element: <UbicacionesPage />,
          },
          {
            path: "/activos",
            element: <ActivosPage />,
          },
          {
            path: "/movimientos",
            element: <MovimientosPage />,
          },
          {
            path: "/activos/:id",
            element: <ActivoDetallePage />,
          },
          {
            path: "/reportes/inventario",
            element: <InventarioReportePage />,
          },
        ],
>>>>>>> Stashed changes
      },
    ],
  },
]);
