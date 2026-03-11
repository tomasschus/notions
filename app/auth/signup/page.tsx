"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta");
        setLoading(false);
        return;
      }
      router.push("/auth/signin?callbackUrl=/");
      router.refresh();
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Notions</h1>
          <p className="text-neutral-500 text-sm mt-1">Crear cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-neutral-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-xs text-neutral-400 mb-1">
              Nombre (opcional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-neutral-400 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 text-neutral-900 font-medium py-2 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta…" : "Registrarse"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/signin" className="text-neutral-300 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
