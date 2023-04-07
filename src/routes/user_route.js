const userController = require("../controllers/user_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerUser = Router()

routerUser.post(`/api/${process.env.VERSION_API}/user/register`, userController.registerUser)
routerUser.get(`/api/${process.env.VERSION_API}/user/confirm/:token`, userController.confirm)
routerUser.post(`/api/${process.env.VERSION_API}/user/login`, userController.login)
routerUser.get(`/api/${process.env.VERSION_API}/user/home`, userController.home)
routerUser.post(`/api/${process.env.VERSION_API}/comment`,userController.addIdCommentAtList)
routerUser.delete(`/api/${process.env.VERSION_API}/comment`,userController.deleteCommentById) 
routerUser.put(`/api/${process.env.VERSION_API}/profile_photo`,userController.uploadProfilePhoto) 
//TODO:Crear ruta de Logout donde el token expire forzosamente

module.exports = routerUser;
