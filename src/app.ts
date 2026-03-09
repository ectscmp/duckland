import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import attemptDatabaseConnection from "./database/connect.js";
import openApiSpec from "./docs/openapi.js";
import duckRouter from "./routes/ducks.js";

await attemptDatabaseConnection();
const app: express.Application = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

const PORT: number = Number(process.env.PORT ?? 3000);
app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/users", (_req, res) => {
  res.sendFile(path.join(publicDir, "users", "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(publicDir, "admin", "index.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use("/ducks", duckRouter);

app.get("/docs.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.get("/docs", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Duckland API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/docs.json",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`server listening at http://localhost:${PORT}`);
});
