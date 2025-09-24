import express from "express";
import "dotenv/config";
import bookRouter from "./routes/book.mjs";
import authRouter from "./routes/auth.mjs";

const app = express();
const port = 4000;

app.use(express.json());
app.use("/books", bookRouter);
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
