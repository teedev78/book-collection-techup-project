import { Router } from "express";
import db from "../utils/db.mjs";
import { validationCreateBookData } from "../middlewares/book.validation.mjs";
import { protect } from "../middlewares/protect.mjs";

const bookRouter = Router();
bookRouter.use(protect);

//create book
bookRouter.post("/", [validationCreateBookData], async (req, res) => {
  const newBook = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };
  // console.log(newBook);

  try {
    await db.query(
      `INSERT INTO books (title, description, author, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
      [
        newBook.title,
        newBook.description,
        newBook.author,
        newBook.created_at,
        newBook.updated_at,
      ]
    );
  } catch {
    return res.status(400).json({
      message: "Server could not create book.",
    });
  }

  return res.status(201).json({
    message: "Created book successfully.",
  });
});

//get all books info
bookRouter.get("/", async (req, res) => {
  try {
    const result = await db.query(`select * from books`);
    // console.log(result);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Server could not read books." });
  }
});

//get book info by id
bookRouter.get("/:bookId", async (req, res) => {
  const bookIdFromClient = req.params.bookId;
  try {
    const result = await db.query(`select * from books where book_id = $1`, [
      bookIdFromClient,
    ]);
    // console.log(result);

    if (!result.rows[0]) {
      return res.status(404).json({
        message: `Server could not find a requested book (book_id: ${req.params.bookId})`,
      });
    }

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server could not read books from id." });
  }
});

//update book info
bookRouter.put("/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const payload = req.body;

  if (!payload.title || !payload.description || !payload.author) {
    return res.status(400).json({
      message: "Bad Request: Missing required fields.",
    });
  }

  try {
    const validBookId = await db.query(
      `SELECT * FROM books WHERE book_id = $1`,
      [bookId]
    );

    if (validBookId.rows.length === 0) {
      return res.status(404).json({ message: "Book ID not found." });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Server could not update book because database connection",
    });
  }

  const updatedBook = { ...req.body, updated_at: new Date() };

  try {
    const result = await db.query(
      `UPDATE books SET title = $2, description = $3, author = $4, updated_at = $5 WHERE book_id = $1 RETURNING *`,
      [
        bookId,
        updatedBook.title,
        updatedBook.description,
        updatedBook.author,
        updatedBook.updated_at,
      ]
    );

    return res.status(201).json({
      message: "update book info successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not update book because database connection",
    });
  }
});

//delete book
bookRouter.delete("/:bookId", async (req, res) => {
  const bookId = req.params.bookId;

  try {
    const validBookId = await db.query(
      `SELECT * FROM books WHERE book_id = $1`,
      [bookId]
    );

    if (validBookId.rows.length === 0) {
      return res.status(404).json({ message: "Book ID not found." });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Server could not update book because database connection",
    });
  }

  await db.query(`DELETE FROM books WHERE book_id = $1`, [bookId]);

  return res.status(204).send();
});

export default bookRouter;
