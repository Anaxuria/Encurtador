import Fastify from "fastify";
import "dotenv/config";
import { linksRoutes } from "./routes/links";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cors from "@fastify/cors";

const app = Fastify();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3333;

const corsOriginsRaw = process.env.CORS_ORIGINS;
const corsOrigin =
  !corsOriginsRaw || corsOriginsRaw === "*"
    ? true
    : corsOriginsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

app.register(cors, { origin: corsOrigin,  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], });

app.register(swagger, {
  openapi: {
    info: {
      title: "Brevly API",
      version: "1.0.0",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    tags: [{ name: "Links" }],
  },
});

app.register(swaggerUI, {
  routePrefix: "/docs",
});

app.get("/", async () => {
  return { message: "API Brevly Rodando" };
});

app.register(linksRoutes, { prefix: "/links" });

app.listen({ port: PORT }).then(() => {
  console.log(`Server rodando em http://localhost:${PORT}`);
});
