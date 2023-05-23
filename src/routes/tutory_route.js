const tutoryController = require("../controllers/tutory_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()
const routerTutory = Router()

routerTutory.get(`/api/${process.env.VERSION_API}/tutory/week`, tutoryController.getWeeklySchedule)
routerTutory.get(`/api/${process.env.VERSION_API}/tutories/subject`, tutoryController.getWeeklyScheduleBySubject)
routerTutory.get(`/api/${process.env.VERSION_API}/tutory`, tutoryController.getTutoryById)
routerTutory.get(`/api/${process.env.VERSION_API}/tutories-student`, tutoryController.getTutoriesByIdStudent)
routerTutory.post(`/api/${process.env.VERSION_API}/tutory`, tutoryController.createTutory)
routerTutory.post(`/api/${process.env.VERSION_API}/tutory/add-list`, tutoryController.sendNotificationsAboutTutory)
routerTutory.put(`/api/${process.env.VERSION_API}/add-tutory`, tutoryController.addStudentAtListTutory)
routerTutory.put(`/api/${process.env.VERSION_API}/remove-tutory`, tutoryController.removeStudentAtListTutory)


module.exports = routerTutory;