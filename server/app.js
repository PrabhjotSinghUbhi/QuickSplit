import express from "express";
import cookies from "cookie-parser";
import cors from "cors";

const app = express();

app.get("/", (req, res) => res.send("Root working"));

app.use(
    express.urlencoded({
        extended: true
    })
);

// CORS configuration
const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) return callback(null, true);
        
        // If CORS_ORIGIN is *, allow all origins (development only!)
        if (process.env.CORS_ORIGIN === '*') {
            return callback(null, true);
        }
        
        // Otherwise check if origin is in allowed list
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
            : [];
            
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));

app.use(cookies());

app.use(
    express.json({
        limit: "16kb"
    })
);

app.use(express.static("public/temp"));

import userRoute from "./routes/user.route.js";
import groupRoute from "./routes/group.route.js";
import expenseRoute from "./routes/expense.route.js";
import chatRoute from "./routes/chat.route.js";

// API routes
app.use("/api/v1/users", userRoute);
app.use("/api/auth", userRoute); // Also expose on /api/auth for client compatibility
app.use("/api/groups", groupRoute);
app.use("/api/expenses", expenseRoute);
app.use("/api/chat", chatRoute);

export { app };
