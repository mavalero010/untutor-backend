const storyController = require("../controllers/story_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerStory = Router()

routerStory.get(`/api/${process.env.VERSION_API}/story`, storyController.getStoryById)


module.exports = routerStory;

