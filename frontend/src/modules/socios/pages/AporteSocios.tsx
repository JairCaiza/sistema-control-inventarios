import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  AlertCircle,
  DollarSign,
  FileDown,
  Plus,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { FaBan, FaCheck, FaEdit, FaEye, FaTrash } from "react-icons/fa";

import RegistrarAporteModal from "../components/RegistrarAporteModal";

import {
  changeEstadoAporte,
  deleteAporte,
  getAporteById,
  getAportesSocios,
  getResumenAportes,
  type AporteSocio,
  type ResumenAportes,
} from "../service/aporteSocioService";

/* =====================================================
   FORMATEADORES
===================================================== */

const formatearDinero = (valor: number | string | undefined): string => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatearFecha = (fecha?: string | null): string => {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaNormalizada = fecha.includes("T") ? fecha.split("T")[0] : fecha;

  const [anio, mes, dia] = fechaNormalizada.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
};

const capitalizar = (texto?: string | null): string => {
  if (!texto) {
    return "No registrado";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/* =====================================================
   COMPONENTE
===================================================== */

function AportesSocios() {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const [aportes, setAportes] = useState<AporteSocio[]>([]);

  const [resumen, setResumen] = useState<ResumenAportes>({
    totalAportes: 0,
    totalRetiros: 0,
    capitalNeto: 0,
    cantidadAportes: 0,
    cantidadRetiros: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [error, setError] = useState<string>("");

  /* =====================================================
     CARGAR DATOS REALES
  ===================================================== */

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [listaAportes, resumenAportes] = await Promise.all([
        getAportesSocios(),
        getResumenAportes(),
      ]);

      setAportes(Array.isArray(listaAportes) ? listaAportes : []);

      setResumen({
        totalAportes: Number(resumenAportes?.totalAportes || 0),

        totalRetiros: Number(resumenAportes?.totalRetiros || 0),

        capitalNeto: Number(resumenAportes?.capitalNeto || 0),

        cantidadAportes: Number(resumenAportes?.cantidadAportes || 0),

        cantidadRetiros: Number(resumenAportes?.cantidadRetiros || 0),
      });
    } catch (errorCargar: unknown) {
      console.error("Error cargando aportes:", errorCargar);

      setError(
        "No se pudieron cargar los aportes de los socios. Verifica que el backend esté funcionando.",
      );

      setAportes([]);

      setResumen({
        totalAportes: 0,
        totalRetiros: 0,
        capitalNeto: 0,
        cantidadAportes: 0,
        cantidadRetiros: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* =====================================================
     DATOS CALCULADOS
  ===================================================== */

  const movimientosPendientes = useMemo(() => {
    return aportes.filter((aporte) => aporte.estado === "pendiente").length;
  }, [aportes]);

  /* =====================================================
     OBTENER NOMBRE DEL SOCIO
  ===================================================== */

  const obtenerNombreSocio = (aporte: AporteSocio): string => {
    return aporte.socio_nombre || "Sin socio";
  };

  /* =====================================================
     VER DETALLE
  ===================================================== */

  const handleVer = async (id: string) => {
    try {
      setProcesandoId(id);

      const aporte = await getAporteById(id);

      await Swal.fire({
        title:
          aporte.tipo === "aporte"
            ? "Detalle del aporte"
            : "Detalle del retiro",

        html: `
          <div style="text-align:left; line-height:1.8">
            <p>
              <strong>Socio:</strong>
              ${aporte.socio_nombre || "No disponible"}
            </p>

            <p>
              <strong>Identificación:</strong>
              ${aporte.socio_identificacion || "No disponible"}
            </p>

            <p>
              <strong>Cuenta:</strong>
              ${aporte.cuenta_nombre || "No disponible"}
            </p>

            <p>
              <strong>Tipo de cuenta:</strong>
              ${capitalizar(aporte.cuenta_tipo)}
            </p>

            <p>
              <strong>Tipo de movimiento:</strong>
              ${capitalizar(aporte.tipo)}
            </p>

            <p>
              <strong>Monto:</strong>
              ${formatearDinero(aporte.monto)}
            </p>

            <p>
              <strong>Fecha:</strong>
              ${formatearFecha(aporte.fecha)}
            </p>

            <p>
              <strong>Método de pago:</strong>
              ${capitalizar(aporte.metodo_pago)}
            </p>

            <p>
              <strong>Referencia:</strong>
              ${aporte.referencia || "Sin referencia"}
            </p>

            <p>
              <strong>Estado:</strong>
              ${capitalizar(aporte.estado)}
            </p>

            <p>
              <strong>Observaciones:</strong>
              ${aporte.observaciones || "Sin observaciones"}
            </p>
          </div>
        `,

        icon: "info",
        confirmButtonText: "Cerrar",
      });
    } catch (errorVer: unknown) {
      console.error("Error obteniendo aporte:", errorVer);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener el detalle del movimiento.",
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEditar = async (aporte: AporteSocio) => {
    if (aporte.estado !== "pendiente") {
      await Swal.fire({
        icon: "warning",
        title: "Movimiento bloqueado",
        text: "Solo se pueden editar los movimientos pendientes.",
      });

      return;
    }

    await Swal.fire({
      icon: "info",
      title: "Editar movimiento",
      text: "El modal de edición se implementará en el siguiente paso.",
    });
  };

  /* =====================================================
     CONFIRMAR MOVIMIENTO
  ===================================================== */

  const handleConfirmar = async (aporte: AporteSocio) => {
    if (aporte.estado !== "pendiente") {
      return;
    }

    const resultado = await Swal.fire({
      icon: "question",
      title: "¿Confirmar movimiento?",

      text:
        aporte.tipo === "aporte"
          ? "El aporte generará un ingreso y aumentará el saldo de la cuenta."
          : "El retiro generará un egreso y disminuirá el saldo de la cuenta.",

      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setProcesandoId(aporte.id);

      await changeEstadoAporte(aporte.id, "confirmado");

      await cargarDatos();

      await Swal.fire({
        icon: "success",
        title: "Movimiento confirmado",

        text:
          aporte.tipo === "aporte"
            ? "El aporte y el ingreso financiero se registraron correctamente."
            : "El retiro y el egreso financiero se registraron correctamente.",

        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (errorConfirmar: unknown) {
      console.error("Error confirmando movimiento:", errorConfirmar);

      let mensaje = "Ocurrió un error al confirmar el movimiento.";

      if (
        typeof errorConfirmar === "object" &&
        errorConfirmar !== null &&
        "response" in errorConfirmar
      ) {
        const errorAxios = errorConfirmar as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        mensaje = errorAxios.response?.data?.message || mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo confirmar",
        text: mensaje,
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     ANULAR MOVIMIENTO
  ===================================================== */

  const handleAnular = async (aporte: AporteSocio) => {
    if (aporte.estado === "anulado") {
      return;
    }

    const resultado = await Swal.fire({
      icon: "warning",
      title: "¿Anular movimiento?",

      text:
        aporte.estado === "confirmado"
          ? "Se generará una transacción inversa para conservar el historial financiero."
          : "El movimiento pendiente será marcado como anulado.",

      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setProcesandoId(aporte.id);

      await changeEstadoAporte(aporte.id, "anulado");

      await cargarDatos();

      await Swal.fire({
        icon: "success",
        title: "Movimiento anulado",
        text: "El movimiento se anuló correctamente.",
        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (errorAnular: unknown) {
      console.error("Error anulando movimiento:", errorAnular);

      let mensaje = "Ocurrió un error al anular el movimiento.";

      if (
        typeof errorAnular === "object" &&
        errorAnular !== null &&
        "response" in errorAnular
      ) {
        const errorAxios = errorAnular as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        mensaje = errorAxios.response?.data?.message || mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo anular",
        text: mensaje,
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     ELIMINAR MOVIMIENTO PENDIENTE
  ===================================================== */

  const handleEliminar = async (aporte: AporteSocio) => {
    if (aporte.estado !== "pendiente") {
      await Swal.fire({
        icon: "warning",
        title: "No se puede eliminar",
        text: "Solo se pueden eliminar movimientos pendientes. Los confirmados deben anularse.",
      });

      return;
    }

    const resultado = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar movimiento?",
      text: "Esta acción eliminará definitivamente el movimiento pendiente.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setProcesandoId(aporte.id);

      await deleteAporte(aporte.id);

      await cargarDatos();

      await Swal.fire({
        icon: "success",
        title: "Movimiento eliminado",
        text: "El movimiento pendiente se eliminó correctamente.",
        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (errorEliminar: unknown) {
      console.error("Error eliminando movimiento:", errorEliminar);

      let mensaje = "Ocurrió un error al eliminar el movimiento.";

      if (
        typeof errorEliminar === "object" &&
        errorEliminar !== null &&
        "response" in errorEliminar
      ) {
        const errorAxios = errorEliminar as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

        mensaje = errorAxios.response?.data?.message || mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: mensaje,
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     EXPORTAR CSV
  ===================================================== */

  const handleExportar = () => {
    if (aportes.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No existen movimientos para exportar.",
      });

      return;
    }

    const encabezados = [
      "Socio",
      "Cuenta",
      "Fecha",
      "Tipo",
      "Método",
      "Referencia",
      "Monto",
      "Estado",
      "Observaciones",
    ];

    const filas = aportes.map((aporte) => [
      obtenerNombreSocio(aporte),

      aporte.cuenta_nombre || "Sin cuenta",

      formatearFecha(aporte.fecha),

      capitalizar(aporte.tipo),

      capitalizar(aporte.metodo_pago),

      aporte.referencia || "",

      Number(aporte.monto || 0).toFixed(2),

      capitalizar(aporte.estado),

      aporte.observaciones || "",
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => {
            const texto = String(valor).replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(","),
      )
      .join("\n");

    const archivo = new Blob([`\uFEFF${contenido}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `aportes-socios-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Aportes de Socios
            </h1>

            <p className="mt-1 text-gray-500">
              Registro de capital, aportes y retiros de socios.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={handleExportar}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
            >
              <FileDown size={18} />
              Exportar
            </button>

            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Nuevo aporte
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* =================================================
            KPIs
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total aportes</p>

            <h2 className="mt-1 text-2xl font-bold text-green-600">
              {formatearDinero(resumen.totalAportes)}
            </h2>

            <TrendingUp className="mt-2 text-green-600" />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total retiros</p>

            <h2 className="mt-1 text-2xl font-bold text-red-600">
              {formatearDinero(resumen.totalRetiros)}
            </h2>

            <Wallet className="mt-2 text-red-600" />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Capital neto</p>

            <h2
              className={`mt-1 text-2xl font-bold ${
                Number(resumen.capitalNeto) >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {formatearDinero(resumen.capitalNeto)}
            </h2>

            <DollarSign className="mt-2 text-blue-600" />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Cantidad de aportes</p>

            <h2 className="mt-1 text-2xl font-bold text-emerald-600">
              {resumen.cantidadAportes}
            </h2>

            <TrendingUp className="mt-2 text-emerald-600" />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Movimientos pendientes</p>

            <h2 className="mt-1 text-2xl font-bold text-yellow-600">
              {movimientosPendientes}
            </h2>

            <AlertCircle className="mt-2 text-yellow-600" />
          </div>
        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="overflow-hidden rounded-xl border bg-white shadow">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold text-gray-800">
                Movimientos de capital
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Aportes y retiros registrados por los socios.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {aportes.length} {aportes.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw size={22} className="animate-spin" />
                Cargando aportes...
              </div>
            </div>
          ) : aportes.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <Wallet size={44} className="mb-3 text-gray-300" />

              <p className="font-medium text-gray-600">
                No existen movimientos registrados
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Presiona “Nuevo aporte” para registrar el primer movimiento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Socio</th>

                    <th className="p-3 text-left">Cuenta</th>

                    <th className="p-3 text-left">Fecha</th>

                    <th className="p-3 text-left">Tipo</th>

                    <th className="p-3 text-left">Método</th>

                    <th className="p-3 text-left">Referencia</th>

                    <th className="p-3 text-right">Monto</th>

                    <th className="p-3 text-center">Estado</th>

                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {aportes.map((aporte) => {
                    const procesando = procesandoId === aporte.id;

                    return (
                      <tr
                        key={aporte.id}
                        className="border-t transition hover:bg-gray-50"
                      >
                        <td className="p-3 font-medium text-gray-800">
                          {aporte.socio_nombre || "Sin socio"}
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {aporte.cuenta_nombre || "Sin cuenta"}
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {formatearFecha(aporte.fecha)}
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              aporte.tipo === "aporte"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {aporte.tipo === "aporte" ? "Aporte" : "Retiro"}
                          </span>
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {aporte.metodo_pago
                            ? capitalizar(aporte.metodo_pago)
                            : "No registrado"}
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {aporte.referencia || "Sin referencia"}
                        </td>

                        <td
                          className={`p-3 text-right font-semibold ${
                            aporte.tipo === "aporte"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {aporte.tipo === "aporte" ? "+" : "-"}

                          {formatearDinero(aporte.monto)}
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              aporte.estado === "confirmado"
                                ? "bg-green-100 text-green-700"
                                : aporte.estado === "pendiente"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {capitalizar(aporte.estado)}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleVer(aporte.id)}
                              disabled={procesando}
                              title="Ver detalle"
                              className="text-cyan-600 transition hover:text-cyan-800 disabled:opacity-40"
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditar(aporte)}
                              disabled={
                                procesando || aporte.estado !== "pendiente"
                              }
                              title={
                                aporte.estado === "pendiente"
                                  ? "Editar movimiento"
                                  : "Solo se pueden editar movimientos pendientes"
                              }
                              className="text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FaEdit />
                            </button>

                            {aporte.estado === "pendiente" && (
                              <button
                                type="button"
                                onClick={() => handleConfirmar(aporte)}
                                disabled={procesando}
                                title="Confirmar movimiento"
                                className="text-green-600 transition hover:text-green-800 disabled:opacity-40"
                              >
                                <FaCheck />
                              </button>
                            )}

                            {aporte.estado !== "anulado" && (
                              <button
                                type="button"
                                onClick={() => handleAnular(aporte)}
                                disabled={procesando}
                                title="Anular movimiento"
                                className="text-orange-600 transition hover:text-orange-800 disabled:opacity-40"
                              >
                                <FaBan />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEliminar(aporte)}
                              disabled={
                                procesando || aporte.estado !== "pendiente"
                              }
                              title={
                                aporte.estado === "pendiente"
                                  ? "Eliminar movimiento"
                                  : "Los movimientos confirmados deben anularse"
                              }
                              className="text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RegistrarAporteModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}

export default AportesSocios;
