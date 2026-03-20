import { useState, type JSX } from "react";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = (): void => {
    console.log(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] px-4">
      {/* Contenedor */}
      <div className="w-full max-w-md bg-[var(--color-white)] rounded-xl shadow-[var(--shadow-medium)] p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="text-2xl font-bold text-[var(--color-primary)]">
            ConstructSys
          </div>
        </div>

        {/* Titulo */}
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--text-primary)]">
          Iniciar sesión
        </h1>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--text-secondary)] mb-1">
            Correo electrónico
          </label>

          <input
            type="email"
            placeholder="ejemplo@empresa.com"
            className="w-full border border-[var(--color-border)] p-3 rounded-[var(--radius-sm)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--text-secondary)] mb-1">
            Contraseña
          </label>

          <input
            type="password"
            placeholder="********"
            className="w-full border border-[var(--color-border)] p-3 rounded-[var(--radius-sm)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleLogin}
          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-accent)]
          text-[var(--color-white)] font-semibold p-3 rounded-[var(--radius-sm)]
          shadow-[var(--shadow-soft)] transition hover:scale-[1.02]"
        >
          Ingresar
        </button>

        {/* Texto inferior */}
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Sistema de Gestión Empresarial
        </p>
      </div>
    </div>
  );
}
