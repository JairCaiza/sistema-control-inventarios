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
import ControlDiarioPage from "../modules/gestion_obra/controldiario/pages/ControlDiarioPage";
import GastosObraPage from "../modules/gestion_obra/gastoobra/pages/GastosObraPage";
import ReportesObraPage from "../modules/gestion_obra/reportesobra/pages/ReportesObraPage";
import PagosEmpleadosPage from "../modules/gestion_obra/empleados/pages/PagosEmpleadosPage";
import ReportePersonalPage from "../modules/gestion_obra/empleados/pages/ReportePersonalPage";

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

/* =====================================================
   PORTAL DEL SOCIO
===================================================== */

import DashboardSocioPage from "../modules/portal_socio/pages/DashboardSocioPage";
import MiPerfilSocioPage from "../modules/portal_socio/pages/MiPerfilSocioPage";
import MisAportesPage from "../modules/portal_socio/pages/MisAportesPage";
import MisUtilidadesPage from "../modules/portal_socio/pages/MisUtilidadesPage";
import AsistenciaPage from "../modules/gestion_obra/asistencia/pages/AsistenciaPage";

export const router = createBrowserRouter([
  /* =====================================================
     RUTAS PÚBLICAS
  ===================================================== */

  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
    ],
  },

  /* =====================================================
     RUTAS PROTEGIDAS
  ===================================================== */

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,

        children: [
          /* =================================================
             DASHBOARD GENERAL
          ================================================= */

          {
            index: true,
            element: <DashboardPage />,
          },

          /* =================================================
             ADMINISTRACIÓN
          ================================================= */

          {
            path: "usuarios",
            element: <UsersPage />,
          },

          {
            path: "roles",
            element: <RolesPage />,
          },

          /* =================================================
             INVENTARIO
          ================================================= */

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

          /* =================================================
             CLIENTES
          ================================================= */

          {
            path: "clientes",
            element: <ClientesPage />,
          },

          /* =================================================
             CONTRATOS
          ================================================= */

          {
            path: "contratos",
            element: <ContratosPage />,
          },

          {
            path: "contratos/:id",
            element: <ContratoDetallePage />,
          },

          /* =================================================
             DEVOLUCIONES
          ================================================= */

          {
            path: "devoluciones",
            element: <DevolucionesPage />,
          },

          /* =================================================
             GESTIÓN DE OBRA
          ================================================= */

          {
            path: "empleados",
            element: <EmpleadosPage />,
          },

          {
            path: "obras",
            element: <ObrasPage />,
          },
          {
            path: "asistencia",
            element: <AsistenciaPage />,
          },

          {
            path: "obras/:id",
            element: <ObraDetailPage />,
          },

          {
            path: "empleados/:id",
            element: <EmpleadoDetailPage />,
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

          /* =================================================
             FINANZAS
          ================================================= */

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

          /* =================================================
             ADMINISTRACIÓN DE SOCIOS
          ================================================= */

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

          /* =================================================
             PORTAL PERSONAL DEL SOCIO
          ================================================= */

          {
            path: "mi-portal",
            element: <DashboardSocioPage />,
          },

          {
            path: "mi-portal/perfil",
            element: <MiPerfilSocioPage />,
          },

          {
            path: "mi-portal/aportes",
            element: <MisAportesPage />,
          },

          {
            path: "mi-portal/utilidades",
            element: <MisUtilidadesPage />,
          },
        ],
      },
    ],
  },
]);
