const subjectController = require("../controllers/subject_controller")
const Router = require("express")
const dotenv = require("dotenv")
const multer=require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const routerSubject= Router()
dotenv.config()

routerSubject.get(`/api/${process.env.VERSION_API}/subjects`,subjectController.getAllSubjects) //listo
routerSubject.get(`/api/${process.env.VERSION_API}/faculty/:idfaculty/subjects`,subjectController.getAllSubjectsByID_Faculty) //listo
routerSubject.get(`/api/${process.env.VERSION_API}/subject`,subjectController.getSubjectById) 
routerSubject.post(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.createSubject) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject`,subjectController.updateSubject)
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addtutor`,subjectController.addIdTutorAtList) 
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/addsource`,subjectController.addIdSourceAtList)
routerSubject.put(`/api/${process.env.VERSION_API}/admin/subject/upload_background_image`,upload.single('profile_photo_subject'),async(req,res)=>{
    const file = req.file
    subjectController.uploadBackgroundImageSubject(req,res,file)
})
routerSubject.delete(`/api/${process.env.VERSION_API}/admin/subject/delete_background_image`,subjectController.deleteProfilePhotoSubject)



module.exports = routerSubject