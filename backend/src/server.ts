import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

import authRoutes from "./routes/authRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";
import curationRoutes from "./routes/curationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Connect to MongoDB Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Healthcheck Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HBTM - Agentic AI Curator Backend",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/curation", curationRoutes);
app.use("/api", dashboardRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Backend Error]", err.stack || err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`[Express Backend Server] HBTM Agentic AI Curator running on http://localhost:${port}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Port ${port} in use] Retrying on port ${port + 1}...`);
      setTimeout(() => startServer(port + 1), 500);
    } else {
      console.error("[Server Error]", err);
    }
  });
};

startServer(PORT);

export default app;
