export const validationCreateBookData = (req, res, next) => {
  console.log(req.body);
  if (req.body.title === '' || req.body.description === '' || req.body.author === '') {
    return res
      .status(401)
      .json({ message: "Bad Request: Missing required fields." });
  }

  next();
};
