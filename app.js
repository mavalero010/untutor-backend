const express = require("express")
const { connectDB } = require("./src/config/db.config")

const dotenv = require("dotenv")
const routerUser = require("./src/routes/user_route")
const routerPhrase=require("./src/routes/phrase_route")
const routerSubject=require("./src/routes/subject_route")
const routerFaculty=require("./src/routes/faculty_route")
const routerEvent=require("./src/routes/event_route")
const routerHome = require("./src/routes/home_route")
const routerAdmin = require("./src/routes/admin_route")
const routerSource = require("./src/routes/source_route")


connectDB();

const app = express();
dotenv.config();

app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api", (req, res) => {
  res.send("API USER")
});

app.use(routerUser)
app.use(routerPhrase)
app.use(routerSubject)
app.use(routerFaculty)
app.use(routerEvent)
app.use(routerHome)
app.use(routerAdmin)
app.use(routerSource)

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
