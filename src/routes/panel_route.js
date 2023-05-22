const panelController = require("../controllers/panel_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerUser = Router()


routerUser.post(`/api/${process.env.VERSION_API}/panel/blog`, panelController.postBlog)
//users
routerUser.post(`/api/${process.env.VERSION_API}/panel/users/user`, panelController.postUser)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.getUserById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users/:id`, panelController.getUsersByIdUniversities)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.deleteUserById)


routerUser.get(`/api/${process.env.VERSION_API}/panel/universities`, panelController.getUniversities)

//faculties
routerUser.post(`/api/${process.env.VERSION_API}/panel/faculties/faculty`, panelController.postFaculty)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties/faculty/:id`, panelController.getFacultyById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties`, panelController.getFaculties)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties/:id`, panelController.getFacultiesByIdUniversities)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/faculties/faculty/:id`, panelController.deleteFacultyById)


module.exports = routerUser