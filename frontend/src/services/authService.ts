import { api } from "./api";

/* =====================================================
   TIPOS
===================================================== */

export interface LoginData {
  correo: string;
  contrasena: string;
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;

  usuario: UsuarioSesion;
}

/* =====================================================
   LOGIN
===================================================== */

export const login = async (data: LoginData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);

  const { token, usuario } = response.data;

  /* =================================================
     VALIDACIÓN DE RESPUESTA
  ================================================= */

  if (!token) {
    throw new Error("El servidor no devolvió un token de autenticación.");
  }

  if (!usuario) {
    throw new Error("El servidor no devolvió la información del usuario.");
  }

  /* =================================================
     GUARDAR TOKEN
  ================================================= */

  localStorage.setItem("token", token);

  /* =================================================
     GUARDAR USUARIO COMPLETO
  ================================================= */

  localStorage.setItem("usuario", JSON.stringify(usuario));

  /*
   * Eliminamos posibles datos
   * de la estructura antigua.
   */
  localStorage.removeItem("user");

  sessionStorage.removeItem("user");

  /* =================================================
     NOTIFICAR AL SIDEBAR Y TOPBAR
  ================================================= */

  window.dispatchEvent(new Event("auth-change"));

  return {
    token,
    usuario,
  };
};

/* =====================================================
   LOGOUT
===================================================== */

export const logout = () => {
  /* =================================================
     LOCAL STORAGE
  ================================================= */

  localStorage.removeItem("token");

  localStorage.removeItem("usuario");

  /*
   * Compatibilidad con
   * versiones anteriores.
   */
  localStorage.removeItem("user");

  /* =================================================
     SESSION STORAGE
  ================================================= */

  sessionStorage.removeItem("token");

  sessionStorage.removeItem("usuario");

  sessionStorage.removeItem("user");

  /* =================================================
     NOTIFICAR CAMBIO DE SESIÓN
  ================================================= */

  window.dispatchEvent(new Event("auth-change"));
};

/* =====================================================
   OBTENER TOKEN
===================================================== */

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

/* =====================================================
   OBTENER USUARIO
===================================================== */

export const getUsuario = (): UsuarioSesion | null => {
  try {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    return JSON.parse(usuarioGuardado) as UsuarioSesion;
  } catch (error) {
    console.error("Error al obtener usuario de la sesión:", error);

    return null;
  }
};

/* =====================================================
   OBTENER ROLES
===================================================== */

export const getRoles = (): string[] => {
  const usuario = getUsuario();

  if (!usuario || !Array.isArray(usuario.roles)) {
    return [];
  }

  return usuario.roles;
};

/* =====================================================
   VERIFICAR ROL
===================================================== */

export const tieneRol = (rol: string): boolean => {
  const roles = getRoles();

  const rolBuscado = rol.trim().toLowerCase();

  return roles.some(
    (rolUsuario) => rolUsuario.trim().toLowerCase() === rolBuscado,
  );
};

/* =====================================================
   VERIFICAR AUTENTICACIÓN
===================================================== */

export const estaAutenticado = (): boolean => {
  const token = getToken();

  const usuario = getUsuario();

  return Boolean(token && usuario);
};
