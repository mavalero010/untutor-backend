const adminController = require("../controllers/admin_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerAdmin = Router()

routerAdmin.post(`/api/${process.env.VERSION_API}/admin/register`, adminController.registerAdmin)
routerAdmin.get(`/api/${process.env.VERSION_API}/admin/confirm/:token`, adminController.confirmAdmin)
routerAdmin.post(`/api/${process.env.VERSION_API}/admin/login`, adminController.loginAdmin)
routerAdmin.post(`/api/${process.env.VERSION_API}/admin/tutor`, adminController.createTutor)
routerAdmin.delete(`/api/${process.env.VERSION_API}/admin/comment`, adminController.deleteComment)


module.exports = routerAdmin;
