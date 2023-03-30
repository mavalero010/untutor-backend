const express = require('express');
const { connectDB } = require('./src/config/db.config')

const dotenv = require("dotenv")
const routerUser = require ("./src/routes/user_route")
const cors = require('cors')
const {json} = require('express')

connectDB()

const app = express()
dotenv.config() 

app.use(cors())
app.use(json())
app.use(express.static('./public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/api', (req, res) => {
  res.send('API USER')
})


app.use(routerUser)

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})