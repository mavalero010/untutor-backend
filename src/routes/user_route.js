const userController = require("../controllers/user_controller")
const Router  = require("express")

const routerUser = Router();

routerUser.post("/api/user/register", userController.registerUser)
routerUser.get("/api/user/confirm/:token", userController.confirm)
routerUser.post("/api/user/login", userController.login)
routerUser.get("/api/user/home", userController.home)
//TODO:Crear ruta de Logout donde el token expire forzosamente

module.exports = routerUser