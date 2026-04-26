import { serveDir } from "jsr:@std/http/file-server";

Deno.serve(async (req) => {
  const res = await serveDir(req, { fsRoot: "dist", enableCors: true });
  // SPA fallback: cualquier ruta no encontrada devuelve index.html
  // para que React Router maneje el enrutamiento del lado del cliente.
  if (res.status === 404) {
    return serveDir(new Request(new URL("/index.html", req.url)), {
      fsRoot: "dist",
    });
  }
  return res;
});
