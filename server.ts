import index from "./src/index.html";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4400),
  routes: { "/": index },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

console.log(`How AI works → ${server.url}`);
