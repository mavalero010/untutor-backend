const sourceController = require("../controllers/source_controller")
const Router = require("express")
const dotenv = require("dotenv")
const multer=require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const routerSource= Router()
dotenv.config()

routerSource.post(`/api/${process.env.VERSION_API}/admin/source`,upload.single('source_file'),async(req,res)=>{
    const file = req.file
    sourceController.createSource(req,res,file)
}) 

routerSource.get(`/api/${process.env.VERSION_API}/source`,sourceController.getSourceById)
routerSource.delete(`/api/${process.env.VERSION_API}/source`,sourceController.deleteSourceById)

module.exports = routerSource