require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const societyRoutes = require("./routes/societyRoutes");
const visitRoutes = require("./routes/visitRoutes");
const documentRoutes = require("./routes/documentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middlewares/errorMiddleware");
const { sendSuccess, sendError } = require("./utils/responseHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// =============================================
// SECURITY MIDDLEWARES
// =============================================

// Allow cross-origin static resource loading (for uploaded media)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =============================================
// STATIC ASSET SERVING FOR UPLOADS
// =============================================
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// =============================================
// REQUEST PARSING & LOGGING
// =============================================

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =============================================
// HEALTH CHECK
// =============================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return sendSuccess(res, 200, "Rentora API is running", {
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(
      res,
      503,
      "Database connection failed",
      err.message
    );
  }
});

// =============================================
// API ROUTES
// =============================================

// Authentication routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// User Profile routes (Phase 5)
app.use("/api/v1/users", userRoutes);
app.use("/api/users", userRoutes);

// Property routes
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/properties", propertyRoutes);

// Application routes
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/applications", applicationRoutes);

// Wishlist routes
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Notification routes
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/notifications", notificationRoutes);

// Society routes
app.use("/api/v1/societies", societyRoutes);
app.use("/api/societies", societyRoutes);

// Visit Scheduling routes (Phase 4)
app.use("/api/v1/visits", visitRoutes);
app.use("/api/visits", visitRoutes);

// Document Management routes (Phase 5)
app.use("/api/v1/documents", documentRoutes);
app.use("/api/documents", documentRoutes);

// Admin Management & Moderation routes (Phase 5)
app.use("/api/v1/admin", adminRoutes);
app.use("/api/admin", adminRoutes);

// =============================================
// 404 HANDLER
// =============================================

app.use((req, res) => {
  return sendError(
    res,
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
});

// =============================================
// CENTRALIZED ERROR HANDLER
// =============================================

app.use(errorHandler);

// =============================================
// SERVER INITIALIZATION
// =============================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  Rentora API Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`  Client URL:  ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    console.log(`=============================================`);
  });
}

module.exports = app;