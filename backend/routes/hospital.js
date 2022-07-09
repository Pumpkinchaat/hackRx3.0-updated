const express = require("express");
const router = express.Router();
const {
  getOne,
  authorizeUser,
  checkUser,
  deleteOne,
} = require("../controllers/handleFactory");

const { Institution, User } = require("../connectDB");

const {
  getAllHospitals,
  createHospital,
  updateHospital,
} = require("../controllers/hospital");

router
  .route("/")
  .get(getAllHospitals)
  .post(authorizeUser(User), createHospital);

router.route("/location/:location").get(getAllHospitals);

router
  .route("/:id")
  .get(getOne(Institution))
  .put(authorizeUser(User), checkUser(Institution), updateHospital)
  .delete(authorizeUser(User), checkUser(Institution), deleteOne(Institution));

module.exports = router;
