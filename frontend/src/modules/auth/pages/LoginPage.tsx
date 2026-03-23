import { useState, type JSX } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import logo from "../../../assets/logoguaraca.png";
import { login } from "../../../services/authService";

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async (): Promise<void> => {
    setError("");

    /* Validación básica */
    if (!email || !password) {
      setError("Debe ingresar correo y contraseña");
      return;
    }

    try {
      setLoading(true);

      const response = await login({
        correo: email,
        contrasena: password,
      });

      console.log("Login correcto:", response);

      /* guardar token */
      localStorage.setItem("token", response.token);

      /* redirigir dashboard */
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] px-4">
      <div className="w-full max-w-md bg-[var(--color-white)] rounded-[var(--radius-lg)] shadow-[var(--shadow-medium)] p-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-36 h-36 bg-[var(--color-border)] rounded-full flex items-center justify-center mb-3">
            <img
              src={logo}
              alt="ConstructSys Logo"
              className="w-28 h-28 object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            ConstructSys
          </h2>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            Sistema de Gestión Empresarial
          </p>
        </div>

        {/* Titulo */}
        <h1 className="text-xl font-semibold text-center text-[var(--text-primary)] mb-6">
          Iniciar sesión
        </h1>

        <div className="space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-[var(--radius-sm)]">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="ejemplo@empresa.com"
              className="w-full border border-[var(--color-border)] p-3 rounded-[var(--radius-sm)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Contraseña
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="w-full border border-[var(--color-border)] p-3 pr-10 rounded-[var(--radius-sm)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                text-[var(--color-gray-soft)] hover:text-[var(--color-primary)]"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* Recuperar contraseña */}
          <div className="text-right">
            <a
              href="/recuperar-password"
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-accent)]"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full font-semibold p-3 rounded-[var(--radius-sm)] shadow-[var(--shadow-soft)]
            transition text-[var(--color-white)]
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-accent)] hover:scale-[1.02]"
            }`}
          >
            {loading ? "Ingresando..." : "Ingresar al sistema"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} ConstructSys
        </div>
      </div>
    </div>
  );
}
