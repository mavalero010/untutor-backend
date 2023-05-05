const tutoryController = require("../controllers/tutory_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()
const routerTutory = Router()

routerTutory.get(`/api/${process.env.VERSION_API}/tutory/week`, tutoryController.getWeeklySchedule)
routerTutory.post(`/api/${process.env.VERSION_API}/tutory`, tutoryController.createTutory)

module.exports = routerTutory;