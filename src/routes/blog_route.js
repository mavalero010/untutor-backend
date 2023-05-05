const blogController = require("../controllers/blog_controller")
const Router = require("express")
const dotenv = require("dotenv")
dotenv.config()

const routerBlog = Router()

routerBlog.post(`/api/${process.env.VERSION_API}/admin/blog`,blogController.createBlog)


module.exports = routerBlog
