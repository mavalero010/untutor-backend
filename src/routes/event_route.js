const eventController = require("../controllers/event_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerEvent = Router()

routerEvent.get(`/api/${process.env.VERSION_API}/featured-events`,eventController.getFeaturedEvents) 

module.exports = routerEvent