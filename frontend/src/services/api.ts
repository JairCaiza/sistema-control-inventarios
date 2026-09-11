import axios from "axios";

/* =====================================================
   INSTANCIA PRINCIPAL DE AXIOS
===================================================== */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   REQUEST INTERCEPTOR
   Agrega automáticamente el JWT a cada petición
===================================================== */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

/* =====================================================
   RESPONSE INTERCEPTOR
   Control global de sesión expirada o inválida
===================================================== */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      /* =============================================
         LIMPIAR SESIÓN
      ============================================= */

      localStorage.removeItem("token");

      localStorage.removeItem("usuario");

      /*
       * Compatibilidad por si quedó
       * información antigua.
       */
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");

      sessionStorage.removeItem("usuario");

      sessionStorage.removeItem("user");

      /* =============================================
         INFORMAR CAMBIO DE AUTENTICACIÓN
      ============================================= */

      window.dispatchEvent(new Event("auth-change"));

      /* =============================================
         REDIRECCIONAR AL LOGIN
      ============================================= */

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
