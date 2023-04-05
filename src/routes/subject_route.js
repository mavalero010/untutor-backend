const subjectController = require("../controllers/subject_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerSubject= Router()

routerSubject.get(`/api/${process.env.VERSION_API}/subjects`,subjectController.getAllSubjects) 
routerSubject.get(`/api/${process.env.VERSION_API}/subjectsbyidfaculty`,subjectController.getAllSubjectsByID_Faculty) 
routerSubject.post(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.createSubject) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.updateSubject) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addtutor`,subjectController.addIdTutorAtList) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addsource`,subjectController.addIdSourceAtList) 

module.exports = routerSubject