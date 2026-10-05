import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();
const PORT = 5000;

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/", (req, res) => {
    res.send("Taskflo backend is running!")
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== "production") console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
