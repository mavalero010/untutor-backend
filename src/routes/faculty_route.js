const facultyController = require("../controllers/faculty_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerFaculty = Router()

routerFaculty.get(`/api/${process.env.VERSION_API}/faculties`,facultyController.getFaculty) 

module.exports = routerFaculty