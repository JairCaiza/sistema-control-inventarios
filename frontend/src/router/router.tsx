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
import InventarioReportePage from "../modules/inventario/reportes/pages/InventarioReportePage";
import ClientesPage from "../modules/clientes/pages/ClientesPage";
import ContratosPage from "../modules/contratos/pages/ContratosPage";
import ContratoDetallePage from "../modules/contratos/pages/ContratoDetallePage";
import DevolucionesPage from "../modules/devoluciones/pages/DevolucionesPage";
import EmpleadosPage from "../modules/gestion_obra/empleados/pages/EmpleadosPage";
import ObrasPage from "../modules/gestion_obra/obras/pages/ObrasPage";
import ObraDetailPage from "../modules/gestion_obra/obras/pages/ObraDetailPage";
import EmpleadoDetailPage from "../modules/gestion_obra/empleados/pages/EmpleadoDetailPage";
import CuentaPage from "../modules/finanzas/cuentas/pages/CuentaPage";
import FinancieroDashboardPage from "../modules/finanzas/dashboard/pages/FinancieroDashboardPage";
import IngresosPage from "../modules/finanzas/ingresos/pages/IngresosPage";
import EgresosPage from "../modules/finanzas/egresos/pages/EgresosPage";
import TransferenciasPage from "../modules/finanzas/transferencias/pages/TransferenciasPage";
import FlujoCajaPage from "../modules/finanzas/flujocaja/pages/FlujoCajaPage";
import UtilidadMensualPage from "../modules/finanzas/utilidad/pages/UtilidadMensualPage";
import CierresPage from "../modules/finanzas/cierres/pages/CierresPages";
import PeriodoPage from "../modules/finanzas/periodos/pages/PeriodoPage";
import SociosPage from "../modules/socios/pages/SociosPages";
import AportesSocios from "../modules/socios/pages/AporteSocios";
import UtilidadesSocios from "../modules/socios/pages/UtilidadesSocios";
import ControlDiarioPage from "../modules/gestion_obra/controldiario/pages/ControlDiarioPage";
import GastosObraPage from "../modules/gestion_obra/gastoobra/pages/GastosObraPage";
import ReportesObraPage from "../modules/gestion_obra/reportesobra/pages/ReportesObraPage";
import PagosEmpleadosPage from "../modules/gestion_obra/empleados/pages/PagosEmpleadosPage";
import ReportePersonalPage from "../modules/gestion_obra/empleados/pages/ReportePersonalPage";

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
          {
            path: "empleados",
            element: <EmpleadosPage />,
          },
          {
            path: "obras",
            element: <ObrasPage />,
          },
          {
            path: "/dashboard/obras/:id",
            element: <ObraDetailPage />,
          },
          {
            path: "/dashboard/empleados/:id",
            element: <EmpleadoDetailPage />,
          },

          {
            path: "cuentas",
            element: <CuentaPage />,
          },
          {
            path: "dashboardfinanciero",
            element: <FinancieroDashboardPage />,
          },
          {
            path: "ingresos",
            element: <IngresosPage />,
          },
          {
            path: "egresos",
            element: <EgresosPage />,
          },
          {
            path: "transferencias",
            element: <TransferenciasPage />,
          },
          {
            path: "flujo-de-caja",
            element: <FlujoCajaPage />,
          },
          {
            path: "utilidadmensual",
            element: <UtilidadMensualPage />,
          },
          {
            path: "cierres",
            element: <CierresPage />,
          },
          {
            path: "periodos",
            element: <PeriodoPage />,
          },
          {
            path: "socios",
            element: <SociosPage />,
          },
          {
            path: "socios/aportaciones",
            element: <AportesSocios />,
          },
          {
            path: "socios/utilidades",
            element: <UtilidadesSocios />,
          },
          {
            path: "control-diario",
            element: <ControlDiarioPage />,
          },
          {
            path: "gastos-obra",
            element: <GastosObraPage />,
          },
          {
            path: "reporte-gastos-obra",
            element: <ReportesObraPage />,
          },
          {
            path: "pagos-empleados",
            element: <PagosEmpleadosPage />,
          },
          {
            path: "reportes-empleados",
            element: <ReportePersonalPage />,
          },
        ],
      },
    ],
  },
]);
