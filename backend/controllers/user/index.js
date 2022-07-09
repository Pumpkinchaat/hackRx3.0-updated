const { User } = require("../../connectDB");
const { createOne } = require("../handleFactory");

exports.createUser = createOne(User, true);
