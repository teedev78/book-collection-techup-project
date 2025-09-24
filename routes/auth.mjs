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

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

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

  //check have user
  const user = await db.query(`SELECT * FROM users WHERE username = $1`, [
    payload.username,
  ]);

  if (user.rows.length === 0) {
    res.status(404).json({ message: "User not found." });
  }

  //check password valid
  const isValidPassword = await bcrypt.compare(payload.password, user.rows[0].password);

  if (!isValidPassword) {
    return res.status(400).json({ message: "password not valid." });
  }

  //set token
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

//Get All User Info
authRouter.get("/users", async (req, res) => {
  const result = await db.query(`SELECT * FROM users`);
  console.log(result);
  res.status(201).json({ message: "OK!" });
});

export default authRouter;
