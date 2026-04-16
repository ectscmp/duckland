import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import attemptDatabaseConnection from "./database/connect.js";
import openApiSpec from "./docs/openapi.js";
import duckRouter from "./routes/ducks.js";
import session from "express-session";
import { ConfidentialClientApplication } from "@azure/msal-node";
import dotenv from "dotenv";
import {NextFunction} from "express";
import mongoose from "mongoose";
import { Admin } from "./models/admin.js";

await attemptDatabaseConnection();
const app: express.Application = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");
const clientId = process.env.CLIENT_ID as string;
const clientSecret = process.env.SECRET_VALUE as string;
const tenantId = process.env.TENANT_ID as string;
const redirectUri = process.env.REDIRECT_URI as string
dotenv.config();

const PORT: number = Number(process.env.PORT ?? 3000);
const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret: clientSecret,
  },
};
const msalClient = new ConfidentialClientApplication(msalConfig);

app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true only in HTTPS
    },
  }),
);
app.use(express.json());

function authMiddleware(_req: Request, res: Response, next: NextFunction){
mongoose.connect(process.env.MONGO_CONNECTION_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));
}

app.get("/", async (_req, res) => {
  if (_req.session.user) {
    return res.sendFile(path.join(publicDir, "index.html"));
  }

  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: redirectUri,
  };

  const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
  res.redirect(authUrl);
});

app.get("/signout", (_req, res) => {
  _req.session.destroy((err) => {
    if (err) {
      return console.error(err);
    }
    res.clearCookie("connect.sid")
    const logoutUrl =
      "https://login.microsoftonline.com/common/oauth2/v2.0/logout" +
      `?post_logout_redirect_uri=http://localhost:3000/`;

    return res.redirect(logoutUrl);
  });
});

app.use(express.static(publicDir));

app.get("/users", (_req, res) => {
  res.sendFile(path.join(publicDir, "users", "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(publicDir, "admin", "index.html"));
});

app.get("/redirect", async (_req, res) => {
  const code = _req.query.code as string;
  const tokenRequest = {
    code: code,
    scopes: ["user.read"],
    redirectUri: redirectUri,
  };

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);

    if (!response.account) {
      return res.status(500).send("Authentication failed: no account returned");
    }
    _req.session.user = response.account;

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Auth failed");
  }
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
