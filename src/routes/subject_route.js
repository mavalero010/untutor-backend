const subjectController = require("../controllers/subject_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerSubject= Router()

routerSubject.get(`/api/${process.env.VERSION_API}/subjects`,subjectController.getAllSubjects) 
routerSubject.get(`/api/${process.env.VERSION_API}/faculty/:idfaculty/subjects`,subjectController.getAllSubjectsByID_Faculty) 
routerSubject.get(`/api/${process.env.VERSION_API}/subject`,subjectController.getSubjectById) 
routerSubject.post(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.createSubject) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.updateSubject) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addtutor`,subjectController.addIdTutorAtList) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addsource`,subjectController.addIdSourceAtList)
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/upload_background_image`,subjectController.addIdSourceAtList)

module.exports = routerSubject