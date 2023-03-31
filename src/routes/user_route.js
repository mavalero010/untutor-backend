const userController = require("../controllers/user_controller")
const Router = require("express");
const dotenv = require("dotenv")
dotenv.config()

const routerUser = Router()

routerUser.post(`/api/${process.env.VERSION_API}/user/register`, userController.registerUser)
routerUser.get(`/api/${process.env.VERSION_API}/user/confirm/:token`, userController.confirm)
routerUser.post(`/api/${process.env.VERSION_API}/user/login`, userController.login)
routerUser.get(`/api/${process.env.VERSION_API}/user/home`, userController.home)
//TODO:Crear ruta de Logout donde el token expire forzosamente

module.exports = routerUser;
