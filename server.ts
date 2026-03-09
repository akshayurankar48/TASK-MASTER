import { createServer } from "http";
import next from "next";
import express from "express";
import { initSocketServer } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  // Initialize Socket.io
  initSocketServer(httpServer);

  // Let Next.js handle all other requests
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
