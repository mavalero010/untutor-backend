const panelController = require("../controllers/panel_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerUser = Router()

//users
routerUser.post(`/api/${process.env.VERSION_API}/panel/users/user`, panelController.postUser)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.getUserById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users`, panelController.getUsers)
routerUser.get(`/api/${process.env.VERSION_API}/panel/users/:id`, panelController.getUsersByIdUniversities)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/users/user/:id`, panelController.deleteUserById)

//universities
routerUser.get(`/api/${process.env.VERSION_API}/panel/universities`, panelController.getUniversities)

//faculties
routerUser.post(`/api/${process.env.VERSION_API}/panel/faculties/faculty`, panelController.postFaculty)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties/faculty/:id`, panelController.getFacultyById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties`, panelController.getFaculties)
routerUser.get(`/api/${process.env.VERSION_API}/panel/faculties/:id`, panelController.getFacultiesByIdUniversities)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/faculties/faculty/:id`, panelController.deleteFacultyById)

//subjects
routerUser.post(`/api/${process.env.VERSION_API}/panel/subjects/subject`, panelController.postSubject)
routerUser.get(`/api/${process.env.VERSION_API}/panel/subjects/subject/:id`, panelController.getSubjectById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/subjects`, panelController.getSubjects)
routerUser.get(`/api/${process.env.VERSION_API}/panel/subjects/:id`, panelController.getSubjectsByIdFaculties)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/subjects/subject/:id`, panelController.deleteSubjectById)

//events
routerUser.post(`/api/${process.env.VERSION_API}/panel/events/event`, panelController.postEvent)
routerUser.get(`/api/${process.env.VERSION_API}/panel/events/event/:id`, panelController.getEventById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/events`, panelController.getEvents)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/events/event/:id`, panelController.deleteEventById)

//blogs
routerUser.post(`/api/${process.env.VERSION_API}/panel/blogs/blog`, panelController.postBlog)
routerUser.get(`/api/${process.env.VERSION_API}/panel/blogs/blog/:id`, panelController.getBlogById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/blogs`, panelController.getBlogs)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/blogs/blog/:id`, panelController.deleteBlogById)

//comments
routerUser.get(`/api/${process.env.VERSION_API}/panel/comments/comment/:id`, panelController.getCommentById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/comments`, panelController.getComments)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/comments/comment/:id`, panelController.deleteCommentById)

//tutories
routerUser.post(`/api/${process.env.VERSION_API}/panel/tutories/tutory`, panelController.postTutory)
routerUser.get(`/api/${process.env.VERSION_API}/panel/tutories/tutory/:id`, panelController.getTutoryById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/tutories`, panelController.getTutories)
routerUser.get(`/api/${process.env.VERSION_API}/panel/tutories/:id`, panelController.getTutoriesByIdSubjects)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/tutories/tutory/:id`, panelController.deleteTutoryById)

//sources
routerUser.get(`/api/${process.env.VERSION_API}/panel/sources/source/link/:id`, panelController.getLinkSourceById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/sources/source/:id`, panelController.getSourceById)
routerUser.get(`/api/${process.env.VERSION_API}/panel/sources`, panelController.getSources)
routerUser.get(`/api/${process.env.VERSION_API}/panel/sources/:id`, panelController.getSourcesByIdSubjects)
routerUser.delete(`/api/${process.env.VERSION_API}/panel/sources/source/:id`, panelController.deleteSourceById)


module.exports = routerUser