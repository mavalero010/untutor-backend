const homeController = require("../controllers/home_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerHome = Router()

routerHome.get(`/api/${process.env.VERSION_API}/home`,homeController.getHome)
routerHome.get(`/api/${process.env.VERSION_API}/browser`,homeController.getBrowser)

module.exports = routerHome