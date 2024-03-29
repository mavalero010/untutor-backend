const userController = require("../controllers/user_controller")
const mongoosePaginate = require('mongoose-paginate-v2')
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()
const multer=require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const routerUser = Router()


routerUser.get(`/api/${process.env.VERSION_API}/user/confirm/:token`, userController.confirm)
routerUser.get(`/api/${process.env.VERSION_API}/profile`,userController.getUserById) 
routerUser.get(`/api/${process.env.VERSION_API}/user/home`, userController.home)
routerUser.get(`/api/${process.env.VERSION_API}/admin/users`, userController.getAllUsers)
routerUser.get(`/api/${process.env.VERSION_API}/user/stories`, userController.getAllStoriesByIdUser)

routerUser.post(`/api/${process.env.VERSION_API}/user/register`, userController.registerUser)
routerUser.post(`/api/${process.env.VERSION_API}/user/login`, userController.login)
routerUser.post(`/api/${process.env.VERSION_API}/comment`,userController.addIdCommentAtList)
routerUser.post(`/api/${process.env.VERSION_API}/user/add-favorite-subject`,userController.addFavoriteSubjectAtList) 
routerUser.post(`/api/${process.env.VERSION_API}/user/story`,upload.single('story_multimedia'),async(req,res)=>{
    const file = req.file
    userController.createStory(req,res,file)
}) 

routerUser.put(`/api/${process.env.VERSION_API}/profile_photo`,upload.single('profile_photo_user'),async(req,res)=>{
    const file = req.file
    userController.uploadProfilePhoto(req,res,file)
}) 
routerUser.put(`/api/${process.env.VERSION_API}/user`,userController.updateUser) 

routerUser.delete(`/api/${process.env.VERSION_API}/comment`,userController.deleteCommentById) 
routerUser.delete(`/api/${process.env.VERSION_API}/profile_photo`,userController.deleteProfilePhoto)
routerUser.delete(`/api/${process.env.VERSION_API}/user/remove-favorite-subject`,userController.removeFavoriteSubjectFromList) 
routerUser.delete(`/api/${process.env.VERSION_API}/user`,userController.deleteUser)
//TODO:Crear ruta de Logout donde el token expire forzosamente

module.exports = routerUser;
