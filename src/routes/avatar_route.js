const avatarController = require("../controllers/avatar_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()
const multer=require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const routerAvatar = Router()

routerAvatar.post(`/api/${process.env.VERSION_API}/admin/avatar`,upload.single('profile_photo_user'),async(req,res)=>{
    const file = req.file
    avatarController.createAvatar(req,res,file)})

routerAvatar.get(`/api/${process.env.VERSION_API}/admin/avatars`, avatarController.getAvatars)

module.exports = routerAvatar;
