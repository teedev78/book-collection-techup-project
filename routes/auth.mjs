import jwt from "jsonwebtoken";
import db from "../utils/db.mjs";
import { Router } from "express";
import bcrypt from "bcrypt";

const authRouter = Router();

//Create User
authRouter.post("/register", async (req, res) => {
  const payload = req.body;
  const user = {
    username: payload.username,
    password: payload.password,
    firstName: payload.firstName,
    lastName: payload.lastName,
    created_at: new Date(),
    updated_at: new Date(),
  };

  //check username existed
  const userExisted = await db.query(`SELECT * FROM users WHERE username = $1`, [
    user.username,
  ]);

  if (userExisted.rows.length !== 0) {
    return res.status(400).json({ message: "User already existed." });
  }

  //hash password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  //create user in db
  try {
    await db.query(
      `INSERT INTO users (username, password, firstname, lastname, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.username,
        user.password,
        user.firstName,
        user.lastName,
        user.created_at,
        user.updated_at,
      ]
    );

    res.status(201).json({ message: "User has been created successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server could not create user." });
  }
});

//Login
authRouter.post("/login", async (req, res) => {
  const payload = req.body;

  //check user existed
  const user = await db.query(`SELECT * FROM users WHERE username = $1`, [
    payload.username,
  ]);

  if (user.rows.length === 0) {
    res.status(404).json({ message: "User not found." });
  }

  //check password valid
  const isValidPassword = await bcrypt.compare(
    payload.password,
    user.rows[0].password
  );

  if (!isValidPassword) {
    return res.status(400).json({ message: "password not valid." });
  }

  //set and return token
  const token = jwt.sign(
    {
      id: user.user_id,
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
    },
    process.env.SECRET,
    { expiresIn: "900000" }
  );

  res.status(200).json({ message: "Login successfully.", token });
});

export default authRouter;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - firstname
 *         - lastname
 *       properties:
 *         user_id:
 *           type: string
 *           description: The auto-generated id of the user
 *         username:
 *           type: string
 *           description: The username of your user
 *         password:
 *           type: string
 *           description: The password of your user
 *         created_at:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *         updated_at:
 *           type: string
 *           format: date
 *           description: The date the user was updated
 *       example:
 *         id: d5fE_asz
 *         username: admin
 *         password: admin_password
 *         firstname: John
 *         lastname: Doe
 *         created_at: 2020-03-10T04:05:06.157Z
 *         updated_at: 2020-03-10T04:05:06.157Z
 *
 * tags:
 *   name: Users
 *   description: The users authenticate API
 * /register:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *   responses:
 *       201:
 *         description: User has been created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *          description: User already existed.
 *       500:
 *          description: Server could not create user.
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *   responses:
 *       200:
 *         description: Login successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: password not valid.
 *       404:
 *         decription: User not found.
 *
 */
