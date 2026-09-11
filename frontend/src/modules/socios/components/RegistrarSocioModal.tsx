import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  CalendarDays,
  IdCard,
  Info,
  Mail,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";

import {
  createSocio,
  getUsuariosSocioDisponibles,
  type CrearSocioData,
  type Socio,
  type UsuarioSocioDisponible,
} from "../service/sociosService";

/* =====================================================
   PROPIEDADES
===================================================== */

interface RegistrarSocioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSocioCreado: (socio: Socio) => void;
}

/* =====================================================
   FORMULARIO
===================================================== */

interface FormularioSocio {
  usuario_id: string;
  identificacion: string;
  contacto: string;
  fecha_ingreso: string;
  activo: boolean;
}

interface ErroresFormulario {
  usuario_id?: string;
  identificacion?: string;
  contacto?: string;
  fecha_ingreso?: string;
}

/* =====================================================
   FECHA ACTUAL
===================================================== */

const obtenerFechaActual = (): string => {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

/* =====================================================
   ESTADO INICIAL
===================================================== */

const obtenerFormularioInicial = (): FormularioSocio => ({
  usuario_id: "",
  identificacion: "",
  contacto: "",
  fecha_ingreso: obtenerFechaActual(),
  activo: true,
});

/* =====================================================
   COMPONENTE
===================================================== */

function RegistrarSocioModal({
  isOpen,
  onClose,
  onSocioCreado,
}: RegistrarSocioModalProps) {
  const [formulario, setFormulario] = useState<FormularioSocio>(
    obtenerFormularioInicial(),
  );

  const [errores, setErrores] = useState<ErroresFormulario>({});

  const [errorServidor, setErrorServidor] = useState<string>("");

  const [guardando, setGuardando] = useState<boolean>(false);

  const [cargandoUsuarios, setCargandoUsuarios] = useState<boolean>(false);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState<
    UsuarioSocioDisponible[]
  >([]);

  /* =====================================================
     USUARIO SELECCIONADO
  ===================================================== */

  const usuarioSeleccionado =
    usuariosDisponibles.find(
      (usuario) => usuario.id === formulario.usuario_id,
    ) || null;

  /* =====================================================
     REINICIAR
  ===================================================== */

  const reiniciarFormulario = () => {
    setFormulario(obtenerFormularioInicial());

    setErrores({});

    setErrorServidor("");

    setGuardando(false);
  };

  /* =====================================================
     CARGAR USUARIOS DISPONIBLES
  ===================================================== */

  const cargarUsuariosDisponibles = async () => {
    try {
      setCargandoUsuarios(true);

      setErrorServidor("");

      const usuarios = await getUsuariosSocioDisponibles();

      setUsuariosDisponibles(usuarios);
    } catch (error: unknown) {
      console.error("Error al cargar usuarios disponibles:", error);

      setUsuariosDisponibles([]);

      setErrorServidor(obtenerMensajeError(error));
    } finally {
      setCargandoUsuarios(false);
    }
  };

  /* =====================================================
     ABRIR MODAL
  ===================================================== */

  useEffect(() => {
    if (isOpen) {
      reiniciarFormulario();

      cargarUsuariosDisponibles();
    }
  }, [isOpen]);

  /* =====================================================
     CERRAR
  ===================================================== */

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    reiniciarFormulario();

    onClose();
  };

  /* =====================================================
     ESCAPE
  ===================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cerrarModal();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", manejarEscape);

      document.body.style.overflow = "";
    };
  }, [isOpen, guardando]);

  /* =====================================================
     CAMBIOS INPUT
  ===================================================== */

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target;

    const nuevoValor =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: nuevoValor,
    }));

    setErrores((erroresAnteriores) => ({
      ...erroresAnteriores,
      [name]: undefined,
    }));

    setErrorServidor("");
  };

  /* =====================================================
     CAMBIO SELECT USUARIO
  ===================================================== */

  const handleUsuarioChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const usuarioId = event.target.value;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      usuario_id: usuarioId,
    }));

    setErrores((erroresAnteriores) => ({
      ...erroresAnteriores,
      usuario_id: undefined,
    }));

    setErrorServidor("");
  };

  /* =====================================================
     VALIDACIÓN
  ===================================================== */

  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresFormulario = {};

    const identificacion = formulario.identificacion.trim();

    const contacto = formulario.contacto.trim();

    if (!formulario.usuario_id) {
      nuevosErrores.usuario_id = "Debe seleccionar un usuario con rol Socio.";
    }

    if (!identificacion) {
      nuevosErrores.identificacion = "La identificación es obligatoria.";
    } else if (identificacion.length < 5 || identificacion.length > 20) {
      nuevosErrores.identificacion =
        "La identificación debe tener entre 5 y 20 caracteres.";
    } else if (!/^[a-zA-Z0-9-]+$/.test(identificacion)) {
      nuevosErrores.identificacion =
        "La identificación solo puede contener letras, números y guiones.";
    }

    if (contacto) {
      if (contacto.length < 7) {
        nuevosErrores.contacto =
          "El contacto debe tener al menos 7 caracteres.";
      } else if (contacto.length > 30) {
        nuevosErrores.contacto =
          "El contacto no puede superar los 30 caracteres.";
      }
    }

    if (!formulario.fecha_ingreso) {
      nuevosErrores.fecha_ingreso = "La fecha de ingreso es obligatoria.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =====================================================
     ERROR BACKEND
  ===================================================== */

  const obtenerMensajeError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | {
            message?: string;
            errores?: string[];
          }
        | undefined;

      if (Array.isArray(data?.errores) && data.errores.length > 0) {
        return data.errores.join(" ");
      }

      if (data?.message) {
        return data.message;
      }

      if (!error.response) {
        return "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.";
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Ocurrió un error al registrar el socio.";
  };

  /* =====================================================
     REGISTRAR
  ===================================================== */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      setErrorServidor("");

      const datos: CrearSocioData = {
        usuario_id: formulario.usuario_id,

        identificacion: formulario.identificacion.trim(),

        contacto: formulario.contacto.trim() || null,

        fecha_ingreso: formulario.fecha_ingreso,

        activo: formulario.activo,
      };

      const socioCreado = await createSocio(datos);

      onSocioCreado(socioCreado);

      reiniciarFormulario();

      onClose();

      await Swal.fire({
        icon: "success",
        title: "¡Registro exitoso!",
        text: "El socio se registró correctamente y quedó vinculado a su cuenta de usuario.",
        timer: 2200,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error: unknown) {
      console.error("Error al registrar socio:", error);

      setErrorServidor(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          cerrarModal();
        }
      }}
    >
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Registrar nuevo socio
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Selecciona una cuenta con rol Socio y completa su información
              societaria.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={guardando}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* FORMULARIO */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">
            {errorServidor && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorServidor}
              </div>
            )}

            {/* CUENTA DE USUARIO */}

            <div>
              <h3 className="mb-4 font-semibold text-gray-800">
                Cuenta de usuario
              </h3>

              <div>
                <label
                  htmlFor="usuario_id"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Usuario con rol Socio
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    id="usuario_id"
                    name="usuario_id"
                    value={formulario.usuario_id}
                    onChange={handleUsuarioChange}
                    disabled={guardando || cargandoUsuarios}
                    className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-10 outline-none transition ${
                      errores.usuario_id
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-300 focus:border-[var(--color-primary)]"
                    } disabled:cursor-not-allowed disabled:bg-gray-100`}
                  >
                    <option value="">
                      {cargandoUsuarios
                        ? "Cargando usuarios..."
                        : "Seleccione un usuario"}
                    </option>

                    {usuariosDisponibles.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {[usuario.nombre, usuario.apellido]
                          .filter(Boolean)
                          .join(" ")}{" "}
                        - {usuario.correo}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.usuario_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errores.usuario_id}
                  </p>
                )}

                {!cargandoUsuarios && usuariosDisponibles.length === 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No existen usuarios disponibles con rol Socio. Primero debes
                    crear o asignar el rol Socio a un usuario.
                  </div>
                )}
              </div>

              {/* USUARIO SELECCIONADO */}

              {usuarioSeleccionado && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cuenta seleccionada
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                        <UserRound size={18} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>

                        <p className="mt-1 font-medium text-gray-800">
                          {[
                            usuarioSeleccionado.nombre,
                            usuarioSeleccionado.apellido,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                        <Mail size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Correo</p>

                        <p className="mt-1 truncate font-medium text-gray-800">
                          {usuarioSeleccionado.correo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr />

            {/* INFORMACIÓN DEL SOCIO */}

            <div>
              <h3 className="mb-4 font-semibold text-gray-800">
                Información del socio
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* IDENTIFICACIÓN */}

                <div>
                  <label
                    htmlFor="identificacion"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Identificación
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <IdCard
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="identificacion"
                      name="identificacion"
                      type="text"
                      value={formulario.identificacion}
                      onChange={handleChange}
                      disabled={guardando}
                      placeholder="Cédula, RUC o pasaporte"
                      maxLength={20}
                      className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition ${
                        errores.identificacion
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-300 focus:border-[var(--color-primary)]"
                      }`}
                    />
                  </div>

                  {errores.identificacion && (
                    <p className="mt-1 text-sm text-red-600">
                      {errores.identificacion}
                    </p>
                  )}
                </div>

                {/* CONTACTO */}

                <div>
                  <label
                    htmlFor="contacto"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Contacto
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="contacto"
                      name="contacto"
                      type="text"
                      value={formulario.contacto}
                      onChange={handleChange}
                      disabled={guardando}
                      placeholder="Ejemplo: 0999999999"
                      autoComplete="tel"
                      maxLength={30}
                      className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition ${
                        errores.contacto
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-300 focus:border-[var(--color-primary)]"
                      }`}
                    />
                  </div>

                  {errores.contacto && (
                    <p className="mt-1 text-sm text-red-600">
                      {errores.contacto}
                    </p>
                  )}
                </div>

                {/* FECHA */}

                <div>
                  <label
                    htmlFor="fecha_ingreso"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Fecha de ingreso
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="fecha_ingreso"
                      name="fecha_ingreso"
                      type="date"
                      value={formulario.fecha_ingreso}
                      onChange={handleChange}
                      disabled={guardando}
                      className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition ${
                        errores.fecha_ingreso
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-300 focus:border-[var(--color-primary)]"
                      }`}
                    />
                  </div>

                  {errores.fecha_ingreso && (
                    <p className="mt-1 text-sm text-red-600">
                      {errores.fecha_ingreso}
                    </p>
                  )}
                </div>

                {/* ESTADO */}

                <div>
                  <p className="mb-2 block text-sm font-medium text-gray-700">
                    Estado
                  </p>

                  <div className="flex h-[46px] items-center justify-between rounded-lg border border-gray-300 px-4">
                    <span className="text-sm text-gray-700">
                      {formulario.activo ? "Activo" : "Inactivo"}
                    </span>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        name="activo"
                        type="checkbox"
                        checked={formulario.activo}
                        onChange={handleChange}
                        disabled={guardando}
                        className="peer sr-only"
                      />

                      <div className="h-6 w-11 rounded-full bg-gray-300 transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            {/* INFORMACIÓN SOCIETARIA */}

            <div>
              <h3 className="mb-4 font-semibold text-gray-800">
                Información societaria
              </h3>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-600">
                    <Info size={20} />
                  </div>

                  <div>
                    <p className="font-medium text-blue-900">
                      Participación automática
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-700">
                      El porcentaje de participación no se registra manualmente.
                      El sistema lo calculará automáticamente según el capital
                      neto aportado por este socio respecto al capital total de
                      todos los socios.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white/70 p-3">
                        <p className="text-xs text-gray-500">Capital inicial</p>

                        <p className="mt-1 font-semibold text-gray-800">
                          $0.00
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/70 p-3">
                        <p className="text-xs text-gray-500">
                          Participación inicial
                        </p>

                        <p className="mt-1 font-semibold text-gray-800">
                          0.00%
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-blue-600">
                      Estos valores cambiarán automáticamente cuando el socio
                      registre aportes o retiros confirmados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ESTADO DESCRIPTIVO */}

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="font-medium text-gray-800">Estado del socio</p>

              <p className="mt-1 text-sm text-gray-500">
                {formulario.activo
                  ? "El socio quedará activo y podrá registrar aportes y participar en futuras distribuciones de utilidades."
                  : "El socio quedará inactivo y no podrá participar en nuevas operaciones hasta ser reactivado."}
              </p>
            </div>
          </div>

          {/* BOTONES */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={guardando}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                guardando ||
                cargandoUsuarios ||
                usuariosDisponibles.length === 0
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Registrar socio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarSocioModal;
