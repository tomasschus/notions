import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El editor mantiene título/cuerpo en estado local; el doble montaje de Strict Mode
  // en dev vacía ese estado y re-hidrata desde el servidor.
  reactStrictMode: false,
};

export default nextConfig;
