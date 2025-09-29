import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import geminiRoutes from "./routes/gemini.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/gemini", geminiRoutes);

app.get('/', (req, res) => {
    res.send("working...")
})


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
