import type { TipoCliente, TipoIdentificacion } from "./clienteService";

/* =====================================================
   VALIDAR CÉDULA ECUATORIANA
===================================================== */

export const validarCedulaEcuador = (valor: string): boolean => {
  const cedula = valor.trim();

  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  const provincia = Number(cedula.substring(0, 2));

  if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
    return false;
  }

  const tercerDigito = Number(cedula[2]);

  if (tercerDigito >= 6) {
    return false;
  }

  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let numero = Number(cedula[i]);

    if (i % 2 === 0) {
      numero *= 2;

      if (numero > 9) {
        numero -= 9;
      }
    }

    suma += numero;
  }

  const residuo = suma % 10;

  const verificador = residuo === 0 ? 0 : 10 - residuo;

  return verificador === Number(cedula[9]);
};

/* =====================================================
   VALIDAR RUC
===================================================== */

export const validarRucEcuador = (valor: string): boolean => {
  const ruc = valor.trim();

  if (!/^\d{13}$/.test(ruc)) {
    return false;
  }

  const tercerDigito = Number(ruc[2]);

  const establecimiento = ruc.substring(10, 13);

  if (establecimiento === "000") {
    return false;
  }

  /*
   * Persona natural.
   */
  if (tercerDigito < 6) {
    const cedula = ruc.substring(0, 10);

    return validarCedulaEcuador(cedula);
  }

  /*
   * Para sociedades mantenemos
   * la misma validación estructural
   * definida en el backend.
   */
  return true;
};

/* =====================================================
   VALIDAR PASAPORTE
===================================================== */

export const validarPasaporte = (valor: string): boolean => {
  return /^[A-Za-z0-9-]{5,20}$/.test(valor.trim());
};

/* =====================================================
   VALIDAR EMAIL
===================================================== */

export const validarCorreo = (correo: string): boolean => {
  if (!correo.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
};

/* =====================================================
   VALIDAR TELÉFONO
===================================================== */

export const validarTelefono = (telefono: string): boolean => {
  if (!telefono.trim()) {
    return true;
  }

  return /^[0-9+\-\s()]{7,20}$/.test(telefono.trim());
};

/* =====================================================
   VALIDAR IDENTIFICACIÓN
===================================================== */

export const validarIdentificacionCliente = (
  tipoCliente: TipoCliente,
  tipoIdentificacion: TipoIdentificacion,
  identificacion: string,
): string | null => {
  const valor = identificacion.trim();

  if (!valor) {
    return "La identificación es obligatoria.";
  }

  if (tipoCliente === "empresa" && tipoIdentificacion !== "ruc") {
    return "Una empresa debe registrarse con RUC.";
  }

  if (tipoIdentificacion === "cedula") {
    if (!validarCedulaEcuador(valor)) {
      return "La cédula ecuatoriana ingresada no es válida.";
    }
  }

  if (tipoIdentificacion === "ruc") {
    if (!validarRucEcuador(valor)) {
      return "El RUC ingresado no tiene una estructura válida.";
    }
  }

  if (tipoIdentificacion === "pasaporte") {
    if (!validarPasaporte(valor)) {
      return "El número de pasaporte no tiene un formato válido.";
    }
  }

  return null;
};
