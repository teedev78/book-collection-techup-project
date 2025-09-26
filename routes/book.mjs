import { Router } from "express";
import db from "../utils/db.mjs";
import { protect } from "../middlewares/protect.mjs";

const bookRouter = Router();
bookRouter.use(protect);

//create book
bookRouter.post("/", async (req, res) => {
  const payload = req.body;

  //check request valid
  if (
    payload.title === "" ||
    payload.description === "" ||
    payload.author === "" ||
    payload.username === ""
  ) {
    return res
      .status(401)
      .json({ message: "Bad Request: Missing required fields." });
  }

  const newBook = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };

  try {
    await db.query(
      `INSERT INTO books (title, description, author, created_at, updated_at, username) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        newBook.title,
        newBook.description,
        newBook.author,
        newBook.created_at,
        newBook.updated_at,
        newBook.username,
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

//get all books on user
bookRouter.get("/", async (req, res) => {
  const payload = req.body;

  //check request valid
  if (payload.username === "") {
    return res
      .status(401)
      .json({ message: "Bad Request: Missing username" });
  }

  try {
    const result = await db.query(`SELECT * FROM books WHERE username = $1`, [
      payload.username,
    ]);
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
      return res.status(404).json({ message: "Book not found." });
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
      return res.status(404).json({ message: "Book not found." });
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - author
 *         - username
 *       properties:
 *         book_id:
 *           type: string
 *           description: The auto-generated id of the book
 *         title:
 *           type: string
 *           description: The title of your book
 *         description:
 *           type: string
 *           description: The description of your book
 *         author:
 *           type: string
 *           description: The book author
 *         created_at:
 *           type: string
 *           format: date
 *           description: The date the book was added
 *         updated_at:
 *           type: string
 *           format: date
 *           description: The date the book was updated
 *         username:
 *           type: string
 *           description: The user who add the book
 *       example:
 *         id: d5fE_asz
 *         title: The One Thing
 *         description: about something in the world
 *         author: Alexar Lorington
 *         created_at: 2020-03-10T04:05:06.157Z
 *         updated_at: 2020-03-10T04:05:06.157Z
 * tags:
 *   name: Books
 *   description: The books managing API
 * /books:
 *   get:
 *     summary: Lists all the books
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The list of the books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       401:
 *         description: Bad Request missing username.
 *       500:
 *         description: Server could not read books.
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Created book successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server could not create book.
 * /books/{id}:
 *   get:
 *     summary: Get the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: book_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 *     responses:
 *       200:
 *         description: The book response by id
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Server could not find a requested book.
 *       500:
 *         description: Server could not read books from id.
 *   put:
 *    summary: Update the book by the id
 *    tags: [Books]
 *    parameters:
 *      - in: path
 *        name: book_id
 *        schema:
 *          type: string
 *        required: true
 *        description: The book id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Book'
 *    responses:
 *      200:
 *        description: update book info successfully.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Book'
 *      404:
 *        description: Book not found.
 *      500:
 *        description: Server could not update book because database connection.
 *   delete:
 *     summary: Remove the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: book_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 *     responses:
 *       200:
 *         description: Book was deleted.
 *       404:
 *         description: Book not found.
 *       500:
 *         description: Server could not update book because database connection.
 */
