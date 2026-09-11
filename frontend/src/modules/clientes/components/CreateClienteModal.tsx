import { useEffect, useState } from "react";

import {
  createCliente,
  type CreateClienteDTO,
  type TipoCliente,
  type TipoIdentificacion,
} from "../service/clienteService";

import {
  validarIdentificacionCliente,
  validarTelefono,
  validarCorreo,
} from "../service/clienteValidation";

import Swal from "sweetalert2";

import axios from "axios";

import {
  Building2,
  User,
  IdCard,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  Loader2,
  Info,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  onClose: () => void;

  onCreated: () => void;
}

/* =====================================================
   FORMULARIO
===================================================== */

interface FormState {
  tipo_cliente: TipoCliente;

  tipo_identificacion: TipoIdentificacion;

  identificacion: string;

  nombre: string;

  apellido: string;

  telefono: string;

  correo: string;

  direccion: string;
}

/* =====================================================
   FORMULARIO INICIAL
===================================================== */

const FORM_INICIAL: FormState = {
  tipo_cliente: "persona",

  tipo_identificacion: "cedula",

  identificacion: "",

  nombre: "",

  apellido: "",

  telefono: "",

  correo: "",

  direccion: "",
};

/* =====================================================
   COMPONENTE
===================================================== */

function CreateClienteModal({ open, onClose, onCreated }: Props) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [form, setForm] = useState<FormState>(FORM_INICIAL);

  const [loading, setLoading] = useState(false);

  /* =====================================================
     RESET AL ABRIR
  ===================================================== */

  useEffect(() => {
    if (open) {
      setForm(FORM_INICIAL);
    }
  }, [open]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open) {
    return null;
  }

  /* =====================================================
     CAMBIO DE CAMPOS
  ===================================================== */

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    /* =================================================
       CAMBIAR TIPO CLIENTE
    ================================================= */

    if (name === "tipo_cliente") {
      const tipoCliente = value as TipoCliente;

      setForm((prev) => ({
        ...prev,

        tipo_cliente: tipoCliente,

        /*
         * Empresa:
         * solamente RUC.
         *
         * Persona:
         * cédula por defecto.
         */
        tipo_identificacion: tipoCliente === "empresa" ? "ruc" : "cedula",

        /*
         * Empresa no tiene apellido.
         */
        apellido: tipoCliente === "empresa" ? "" : prev.apellido,

        /*
         * Limpiamos identificación porque
         * cambió su naturaleza.
         */
        identificacion: "",
      }));

      return;
    }

    /* =================================================
       CAMBIAR TIPO IDENTIFICACIÓN
    ================================================= */

    if (name === "tipo_identificacion") {
      setForm((prev) => ({
        ...prev,

        tipo_identificacion: value as TipoIdentificacion,

        /*
         * Evitamos dejar una cédula dentro
         * del campo al cambiar a pasaporte/RUC.
         */
        identificacion: "",
      }));

      return;
    }

    /* =================================================
       IDENTIFICACIÓN
    ================================================= */

    if (name === "identificacion") {
      /*
       * Cédula y RUC:
       * solamente números.
       *
       * Pasaporte:
       * permitimos letras/números/guiones.
       */
      const identificacion =
        form.tipo_identificacion === "cedula" ||
        form.tipo_identificacion === "ruc"
          ? value.replace(/\D/g, "")
          : value;

      setForm((prev) => ({
        ...prev,

        identificacion,
      }));

      return;
    }

    /* =================================================
       RESTO DE CAMPOS
    ================================================= */

    setForm((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  /* =====================================================
     VALIDAR FORMULARIO
  ===================================================== */

  const validarFormulario = async (): Promise<boolean> => {
    /* =================================================
         IDENTIFICACIÓN
      ================================================= */

    const errorIdentificacion = validarIdentificacionCliente(
      form.tipo_cliente,
      form.tipo_identificacion,
      form.identificacion,
    );

    if (errorIdentificacion) {
      await Swal.fire({
        icon: "warning",

        title: "Identificación inválida",

        text: errorIdentificacion,
      });

      return false;
    }

    /* =================================================
         NOMBRE / RAZÓN SOCIAL
      ================================================= */

    if (form.nombre.trim().length < 2) {
      await Swal.fire({
        icon: "warning",

        title:
          form.tipo_cliente === "empresa"
            ? "Razón social inválida"
            : "Nombre inválido",

        text:
          form.tipo_cliente === "empresa"
            ? "La razón social debe tener al menos 2 caracteres."
            : "El nombre debe tener al menos 2 caracteres.",
      });

      return false;
    }

    if (form.nombre.trim().length > 150) {
      await Swal.fire({
        icon: "warning",

        title: "Nombre demasiado largo",

        text: "El nombre o razón social no puede superar los 150 caracteres.",
      });

      return false;
    }

    /* =================================================
         APELLIDO
      ================================================= */

    if (form.tipo_cliente === "persona" && form.apellido.trim().length < 2) {
      await Swal.fire({
        icon: "warning",

        title: "Apellido inválido",

        text: "El apellido debe tener al menos 2 caracteres.",
      });

      return false;
    }

    if (form.tipo_cliente === "persona" && form.apellido.trim().length > 150) {
      await Swal.fire({
        icon: "warning",

        title: "Apellido demasiado largo",

        text: "El apellido no puede superar los 150 caracteres.",
      });

      return false;
    }

    /* =================================================
         TELÉFONO
      ================================================= */

    if (!validarTelefono(form.telefono)) {
      await Swal.fire({
        icon: "warning",

        title: "Teléfono inválido",

        text: "Ingrese un teléfono válido. Puede utilizar números, espacios, +, -, ( y ).",
      });

      return false;
    }

    /* =================================================
         CORREO
      ================================================= */

    if (!validarCorreo(form.correo)) {
      await Swal.fire({
        icon: "warning",

        title: "Correo inválido",

        text: "Ingrese un correo electrónico válido. Ejemplo: cliente@empresa.com",
      });

      return false;
    }

    /* =================================================
         DIRECCIÓN
      ================================================= */

    if (form.direccion.trim().length > 300) {
      await Swal.fire({
        icon: "warning",

        title: "Dirección demasiado larga",

        text: "La dirección no puede superar los 300 caracteres.",
      });

      return false;
    }

    return true;
  };

  /* =====================================================
     GUARDAR
  ===================================================== */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    /* =================================================
       VALIDACIÓN FRONTEND
    ================================================= */

    const formularioValido = await validarFormulario();

    if (!formularioValido) {
      return;
    }

    /* =================================================
       PAYLOAD
    ================================================= */

    const payload: CreateClienteDTO = {
      tipo_cliente: form.tipo_cliente,

      tipo_identificacion: form.tipo_identificacion,

      identificacion: form.identificacion.trim(),

      nombre: form.nombre.trim(),

      apellido: form.tipo_cliente === "persona" ? form.apellido.trim() : null,

      telefono: form.telefono.trim() || null,

      correo: form.correo.trim().toLowerCase() || null,

      direccion: form.direccion.trim() || null,
    };

    try {
      setLoading(true);

      /* =================================================
         BACKEND
      ================================================= */

      await createCliente(payload);

      /* =================================================
         SUCCESS
      ================================================= */

      await Swal.fire({
        icon: "success",

        title: "Cliente registrado",

        text:
          form.tipo_cliente === "empresa"
            ? "La empresa se registró correctamente."
            : "El cliente se registró correctamente.",

        timer: 1800,

        showConfirmButton: false,

        timerProgressBar: true,
      });

      setForm(FORM_INICIAL);

      await onCreated();

      onClose();
    } catch (error: unknown) {
      console.error("Error creando cliente:", error);

      let mensaje = "No se pudo registrar el cliente.";

      /* =================================================
         ERROR AXIOS
      ================================================= */

      if (axios.isAxiosError(error)) {
        /*
         * Mensaje principal enviado
         * por controller/service.
         *
         * Ejemplos:
         *
         * - identificación duplicada
         * - correo duplicado
         * - validación Joi
         */
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;

        /*
         * Joi puede devolver varios
         * errores simultáneamente.
         */
        const errores = error.response?.data?.errors;

        if (Array.isArray(errores) && errores.length > 0) {
          mensaje = errores.join("\n");
        }

        /* =================================================
           CONFLICTO / DUPLICADO
        ================================================= */

        if (error.response?.status === 409) {
          await Swal.fire({
            icon: "warning",

            title: "Cliente duplicado",

            text: mensaje,
          });

          return;
        }

        /* =================================================
           DATOS INVÁLIDOS
        ================================================= */

        if (error.response?.status === 400) {
          await Swal.fire({
            icon: "warning",

            title: "Datos inválidos",

            text: mensaje,
          });

          return;
        }
      }

      /* =================================================
         ERROR GENERAL
      ================================================= */

      await Swal.fire({
        icon: "error",

        title: "No se pudo registrar",

        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex shrink-0 items-start justify-between border-b bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nuevo cliente</h2>

            <p className="mt-1 text-sm text-gray-500">
              Registre una persona natural o empresa para operaciones del ERP.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
            FORMULARIO
        ================================================= */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* =================================================
              CONTENIDO
          ================================================= */}

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {/* =================================================
                TIPO CLIENTE
            ================================================= */}

            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Información del cliente
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* TIPO CLIENTE */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo de cliente *
                  </label>

                  <select
                    name="tipo_cliente"
                    value={form.tipo_cliente}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    <option value="persona">Persona</option>

                    <option value="empresa">Empresa</option>
                  </select>
                </div>

                {/* TIPO IDENTIFICACIÓN */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo de identificación *
                  </label>

                  <select
                    name="tipo_identificacion"
                    value={form.tipo_identificacion}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    {form.tipo_cliente === "persona" && (
                      <>
                        <option value="cedula">Cédula</option>

                        <option value="ruc">RUC</option>

                        <option value="pasaporte">Pasaporte</option>
                      </>
                    )}

                    {form.tipo_cliente === "empresa" && (
                      <option value="ruc">RUC</option>
                    )}
                  </select>
                </div>

                {/* IDENTIFICACIÓN */}

                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <IdCard size={16} />
                    Identificación *
                  </label>

                  <input
                    name="identificacion"
                    value={form.identificacion}
                    onChange={handleChange}
                    inputMode={
                      form.tipo_identificacion === "cedula" ||
                      form.tipo_identificacion === "ruc"
                        ? "numeric"
                        : "text"
                    }
                    maxLength={
                      form.tipo_identificacion === "cedula"
                        ? 10
                        : form.tipo_identificacion === "ruc"
                          ? 13
                          : 20
                    }
                    placeholder={
                      form.tipo_identificacion === "cedula"
                        ? "Ejemplo: 0601234567"
                        : form.tipo_identificacion === "ruc"
                          ? "Ejemplo: 0601234567001"
                          : "Número de pasaporte"
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    {form.tipo_identificacion === "cedula"
                      ? "Debe ingresar una cédula ecuatoriana válida de 10 dígitos."
                      : form.tipo_identificacion === "ruc"
                        ? "Debe ingresar un RUC de 13 dígitos con estructura válida."
                        : "Ingrese el número de pasaporte sin espacios innecesarios."}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t" />

            {/* =================================================
                DATOS PERSONALES / EMPRESA
            ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                {form.tipo_cliente === "empresa" ? (
                  <Building2
                    size={18}
                    className="text-[var(--color-primary)]"
                  />
                ) : (
                  <User size={18} className="text-[var(--color-primary)]" />
                )}

                <h3 className="font-semibold text-gray-800">
                  {form.tipo_cliente === "empresa"
                    ? "Información empresarial"
                    : "Información personal"}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* NOMBRE */}

                <div
                  className={
                    form.tipo_cliente === "empresa" ? "sm:col-span-2" : ""
                  }
                >
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {form.tipo_cliente === "empresa"
                      ? "Razón social *"
                      : "Nombre *"}
                  </label>

                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder={
                      form.tipo_cliente === "empresa"
                        ? "Ejemplo: Constructora ABC Cía. Ltda."
                        : "Nombre del cliente"
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* APELLIDO */}

                {form.tipo_cliente === "persona" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Apellido *
                    </label>

                    <input
                      name="apellido"
                      value={form.apellido}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="Apellido del cliente"
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="border-t" />

            {/* =================================================
                CONTACTO
            ================================================= */}

            <section>
              <h3 className="mb-4 font-semibold text-gray-800">
                Información de contacto
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* TELÉFONO */}

                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone size={16} />
                    Teléfono
                  </label>

                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="Ejemplo: 0991234567"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* CORREO */}

                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail size={16} />
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="cliente@ejemplo.com"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* DIRECCIÓN */}

                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin size={16} />
                    Dirección
                  </label>

                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    maxLength={300}
                    placeholder="Dirección del cliente"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                INFORMACIÓN
            ================================================= */}

            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

              <p className="text-sm leading-6 text-blue-800">
                La identificación y el correo electrónico no pueden repetirse
                entre clientes. El sistema volverá a validar esta información en
                el servidor antes de guardar.
              </p>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="shrink-0 border-t bg-gray-50 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
              >
                <X size={17} />
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClienteModal;
