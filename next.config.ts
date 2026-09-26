import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Порожній vercel.json керує заголовками безпеки; тут — оптимізації білда.
  // compress увімкнено за замовчуванням у Next; явно не відключати.
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
