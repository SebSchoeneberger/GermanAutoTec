import express from "express";
import cors from "cors";
import connectDB from "./DB/db.js";
import errorHandler from "./middleware/errorHandler.js";
import sparePartsRouter from "./routes/sparePartsRoutes.js";
import userRouter from "./routes/userRoutes.js";
import pointsRouter from "./routes/pointsRoutes.js";
import pointRequestRouter from "./routes/pointRequestRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("German AutoTec API");
});

app.use("/spare-parts", sparePartsRouter);
app.use("/users", userRouter);
app.use("/points", pointsRouter);
app.use("/point-requests", pointRequestRouter);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found on German AutoTec API'
    });
});
app.use(errorHandler);


app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
