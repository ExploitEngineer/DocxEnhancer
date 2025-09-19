import cors from "cors";
import express from "express";
import * as dotenv from "dotenv";
import connectDB from "./config/mongoose.connection.js";
import { router as promptRoute } from "./routes/prompt.route.js";
import { router as documentRoute } from "./routes/document.route.js";

// setup dotenv package to use environment variables
dotenv.config();

// Database connect
await connectDB();

// intailize app
const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: "https://docx-app-frontend-production-757e.up.railway.app",
  }),
);

// routes middlewares
app.use("/documents", documentRoute);
app.use("/prompt", promptRoute);

// Routes
app.get("/", (_, res) => res.send("API is running"));

// intialize port
const PORT = process.env.PORT || 3001;

// run the app
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
