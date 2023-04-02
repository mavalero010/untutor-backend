const subjectController = require("../controllers/subject_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerSubject= Router()

routerSubject.get(`/api/${process.env.VERSION_API}/subjects`,subjectController.getAllSubjects) 
routerSubject.get(`/api/${process.env.VERSION_API}/subjectsbyidfaculty`,subjectController.getAllSubjectsByID_Faculty) 

module.exports = routerSubject