import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  createAporteSocio,
  type CrearAporteSocioData,
  type AporteSocio,
} from "../service/aporteSocioService";

import { getSocios, type Socio } from "../../socios/service/sociosService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../../modules/finanzas/cuentas/service/cuentaService";

/* =====================================================
   PROPIEDADES
===================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (aporte: AporteSocio) => void | Promise<void>;
}

/* =====================================================
   ESTADO INICIAL
===================================================== */

const crearEstadoInicial = (): CrearAporteSocioData => ({
  socio_id: "",
  cuenta_id: "",
  tipo: "aporte",
  monto: 0,
  fecha: new Date().toISOString().split("T")[0],
  metodo_pago: null,
  referencia: null,
  estado: "confirmado",
  observaciones: null,
});

/* =====================================================
   COMPONENTE
===================================================== */

function RegistrarAporteModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CrearAporteSocioData>(crearEstadoInicial);

  const [socios, setSocios] = useState<Socio[]>([]);

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargandoCatalogos, setCargandoCatalogos] = useState<boolean>(false);

  const [guardando, setGuardando] = useState<boolean>(false);

  /* =====================================================
     CARGAR SOCIOS Y CUENTAS
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const cargarCatalogos = async () => {
      try {
        setCargandoCatalogos(true);

        const [sociosResponse, cuentasResponse] = await Promise.all([
          getSocios({
            activo: true,
          }),

          getCuentas(),
        ]);

        setSocios(sociosResponse.filter((socio) => socio.activo));

        setCuentas(cuentasResponse.filter((cuenta) => cuenta.activo));
      } catch (error: unknown) {
        console.error("Error cargando catálogos:", error);

        await Swal.fire({
          icon: "error",
          title: "No se pudo cargar el formulario",
          text: "No se pudieron obtener los socios o las cuentas financieras.",
        });
      } finally {
        setCargandoCatalogos(false);
      }
    };

    setForm(crearEstadoInicial());

    cargarCatalogos();
  }, [open]);

  /* =====================================================
     MANEJO DE CAMPOS
  ===================================================== */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((estadoAnterior) => ({
      ...estadoAnterior,

      [name]: name === "monto" ? Number(value) : value,
    }));
  };

  /* =====================================================
     CERRAR MODAL
  ===================================================== */

  const handleClose = () => {
    if (guardando) {
      return;
    }

    setForm(crearEstadoInicial());

    onClose();
  };

  /* =====================================================
     VALIDAR FORMULARIO
  ===================================================== */

  const validarFormulario = (): string | null => {
    if (!form.socio_id) {
      return "Seleccione un socio.";
    }

    if (!form.cuenta_id) {
      return "Seleccione una cuenta financiera.";
    }

    if (!form.tipo) {
      return "Seleccione el tipo de movimiento.";
    }

    if (!Number.isFinite(Number(form.monto)) || Number(form.monto) <= 0) {
      return "El monto debe ser mayor que cero.";
    }

    if (!form.fecha) {
      return "Seleccione la fecha del movimiento.";
    }

    if (!form.metodo_pago) {
      return "Seleccione el método de pago.";
    }

    return null;
  };

  /* =====================================================
     GUARDAR
  ===================================================== */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mensajeValidacion = validarFormulario();

    if (mensajeValidacion) {
      await Swal.fire({
        icon: "warning",
        title: "Formulario incompleto",
        text: mensajeValidacion,
      });

      return;
    }

    try {
      setGuardando(true);

      const payload: CrearAporteSocioData = {
        socio_id: form.socio_id,

        cuenta_id: form.cuenta_id,

        tipo: form.tipo,

        monto: Number(form.monto),

        fecha: form.fecha,

        metodo_pago: form.metodo_pago?.trim() || null,

        referencia: form.referencia?.trim() || null,

        estado: form.estado || "confirmado",

        observaciones: form.observaciones?.trim() || null,
      };

      const aporteCreado = await createAporteSocio(payload);

      setForm(crearEstadoInicial());

      onClose();

      if (onSuccess) {
        await onSuccess(aporteCreado);
      }

      await Swal.fire({
        icon: "success",

        title:
          payload.tipo === "aporte" ? "Aporte registrado" : "Retiro registrado",

        text:
          payload.estado === "confirmado"
            ? payload.tipo === "aporte"
              ? "El aporte se registró y aumentó el saldo de la cuenta correctamente."
              : "El retiro se registró y disminuyó el saldo de la cuenta correctamente."
            : "El movimiento se registró como pendiente.",

        timer: 2200,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error: unknown) {
      console.error("Error registrando aporte:", error);

      let mensaje = "No se pudo registrar el movimiento.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ||
          error.response?.data?.errores?.[0] ||
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!open) {
    return null;
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Registrar movimiento de socio
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Registre un aporte o retiro de capital y seleccione la cuenta
            financiera correspondiente.
          </p>
        </div>

        {/* FORMULARIO */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto p-6">
            {cargandoCatalogos ? (
              <div className="flex min-h-72 items-center justify-center text-gray-500">
                Cargando socios y cuentas financieras...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* SOCIO */}

                <div>
                  <label
                    htmlFor="socio_id"
                    className="text-sm font-medium text-gray-700"
                  >
                    Socio
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="socio_id"
                    name="socio_id"
                    value={form.socio_id}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="">Seleccione un socio</option>

                    {socios.map((socio) => (
                      <option key={socio.id} value={socio.id}>
                        {socio.nombre}
                        {socio.identificacion
                          ? ` - ${socio.identificacion}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {socios.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No existen socios activos registrados.
                    </p>
                  )}
                </div>

                {/* CUENTA FINANCIERA */}

                <div>
                  <label
                    htmlFor="cuenta_id"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cuenta financiera
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="cuenta_id"
                    name="cuenta_id"
                    value={form.cuenta_id}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="">Seleccione una cuenta</option>

                    {cuentas.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre} — {cuenta.tipo} — saldo:{" "}
                        {new Intl.NumberFormat("es-EC", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(cuenta.saldo_actual || 0))}
                      </option>
                    ))}
                  </select>

                  {cuentas.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No existen cuentas financieras activas.
                    </p>
                  )}
                </div>

                {/* TIPO */}

                <div>
                  <label
                    htmlFor="tipo"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tipo de movimiento
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="aporte">Aporte</option>

                    <option value="retiro">Retiro</option>
                  </select>

                  <p className="mt-1 text-xs text-gray-500">
                    {form.tipo === "aporte"
                      ? "El aporte confirmado aumentará el saldo de la cuenta."
                      : "El retiro confirmado disminuirá el saldo de la cuenta."}
                  </p>
                </div>

                {/* MONTO */}

                <div>
                  <label
                    htmlFor="monto"
                    className="text-sm font-medium text-gray-700"
                  >
                    Monto
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="monto"
                    type="number"
                    name="monto"
                    value={form.monto || ""}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  />
                </div>

                {/* FECHA */}

                <div>
                  <label
                    htmlFor="fecha"
                    className="text-sm font-medium text-gray-700"
                  >
                    Fecha
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  />
                </div>

                {/* ESTADO */}

                <div>
                  <label
                    htmlFor="estado"
                    className="text-sm font-medium text-gray-700"
                  >
                    Estado
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="estado"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="confirmado">Confirmado</option>

                    <option value="pendiente">Pendiente</option>
                  </select>

                  <p className="mt-1 text-xs text-gray-500">
                    Un movimiento pendiente no afecta el saldo hasta que sea
                    confirmado.
                  </p>
                </div>

                {/* MÉTODO DE PAGO */}

                <div>
                  <label
                    htmlFor="metodo_pago"
                    className="text-sm font-medium text-gray-700"
                  >
                    Método de pago
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <select
                    id="metodo_pago"
                    name="metodo_pago"
                    value={form.metodo_pago || ""}
                    onChange={handleChange}
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="">Seleccione un método</option>

                    <option value="efectivo">Efectivo</option>

                    <option value="transferencia">Transferencia</option>

                    <option value="deposito">Depósito</option>

                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                {/* REFERENCIA */}

                <div>
                  <label
                    htmlFor="referencia"
                    className="text-sm font-medium text-gray-700"
                  >
                    Referencia
                  </label>

                  <input
                    id="referencia"
                    type="text"
                    name="referencia"
                    value={form.referencia || ""}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Ejemplo: DEP-001"
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  />
                </div>

                {/* OBSERVACIONES */}

                <div className="md:col-span-2">
                  <label
                    htmlFor="observaciones"
                    className="text-sm font-medium text-gray-700"
                  >
                    Observaciones
                  </label>

                  <textarea
                    id="observaciones"
                    rows={4}
                    name="observaciones"
                    value={form.observaciones || ""}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="Detalle adicional del aporte o retiro..."
                    disabled={guardando}
                    className="mt-1 w-full resize-none rounded-lg border px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {(form.observaciones || "").length}/500
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={guardando}
              className="rounded-lg border px-5 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                guardando ||
                cargandoCatalogos ||
                socios.length === 0 ||
                cuentas.length === 0
              }
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : form.tipo === "aporte"
                  ? "Registrar aporte"
                  : "Registrar retiro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarAporteModal;
