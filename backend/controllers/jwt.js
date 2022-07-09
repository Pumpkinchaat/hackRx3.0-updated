const jwt = require("jsonwebtoken");

exports.generateJWT = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });
  return token;
};
