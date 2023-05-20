const panelController = require("../controllers/panel_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerUser = Router()


routerUser.post(`/api/${process.env.VERSION_API}/panel/blog`, panelController.postBlog)

routerUser.get(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.getUserById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users/:id`, panelController.getUsers)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.deleteUserById)


routerUser.get(`/api/${process.env.VERSION_API}/panel/universities`, panelController.getUniversities)


routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties`, panelController.getFaculties)


module.exports = routerUser