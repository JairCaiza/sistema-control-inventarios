import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../modules/auth/pages/LoginPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import DashboardLayout from "../layouts/DashboardLayout";

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
import ClientesPage from "../modules/clientes/pages/ClientesPage";
import ContratosPage from "../modules/contratos/pages/ContratosPage";
import ContratoDetallePage from "../modules/contratos/pages/ContratoDetallePage";
import DevolucionesPage from "../modules/devoluciones/pages/DevolucionesPage";

export const router = createBrowserRouter([
  /* RUTAS PUBLICAS */
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
    ],
  },

  /* RUTAS PROTEGIDAS */
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "usuarios",
            element: <UsersPage />,
          },
          {
            path: "roles",
            element: <RolesPage />,
          },
          {
            path: "categorias",
            element: <CategoriasPage />,
          },
          {
            path: "activos",
            element: <ActivosPage />,
          },
          {
            path: "activos/:id",
            element: <ActivoDetallePage />,
          },
          {
            path: "ubicaciones",
            element: <UbicacionesPage />,
          },
          {
            path: "movimientos",
            element: <MovimientosPage />,
          },
          {
            path: "reportes/inventario",
            element: <InventarioReportePage />,
          },
          {
            path: "clientes",
            element: <ClientesPage />,
          },
          {
            path: "contratos",
            element: <ContratosPage />,
          },
          {
            path: "contratos/:id",
            element: <ContratoDetallePage />,
          },
          {
            path: "devoluciones",
            element: <DevolucionesPage />,
          },
        ],
      },
    ],
  },
]);
