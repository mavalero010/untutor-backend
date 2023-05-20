const phraseController = require("../controllers/phrase_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerPhrase = Router()

routerPhrase.get(`/api/${process.env.VERSION_API}/phrase`,phraseController.getPhrase) 

module.exports = routerPhrase