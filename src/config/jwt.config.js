const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user_model");
const bcrypt = require("bcrypt");
dotenv.config();

const getToken = (payload) => {
  return jwt.sign(
    {
      data: payload,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const getUnexpiredToken = (payload) => {
  return jwt.sign(
    {
      data: payload,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};
const getTokenData = (token) => {
  let data = null;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        //TODO: Investigar que tipo de res.status() se acomoda a este error
      }
    } else {
      data = decoded;
    }
  });

  return data;
};

const authTokenDecoded = (dataUserDecoded, user) => {
  //Verificar que los datos son válidos
  //Busco usuario mediante Email en el DB
  let r = true;
  if (user === null) {
    r = false;
  }
  //Comparo contraseñas
  const compare = bcrypt.compare(dataUserDecoded.data.password, user.password);
  if (!compare) {
    r = false;
  }
  return r;
};
module.exports = {
  getToken,
  getTokenData,
  getUnexpiredToken,
  authTokenDecoded,
};
