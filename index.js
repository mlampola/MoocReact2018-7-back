const http = require('http')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const config = require('./utils/config')
const middleware = require('./utils/middleware')

app.use(cors())
app.use(bodyParser.json())

const stripPassword = (mongoUrl) => {
  const partsA = mongoUrl.split('@')
  const partsB = partsA[0].split(':')
  return partsB[0] + ':' + partsB[1] + '@' + partsA[1]
}

mongoose
  .connect(config.mongoUrl, { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to database', stripPassword(config.mongoUrl))
  })
  .catch(err => {
    console.log(err)
  })

app.use(middleware.tokenExtractor)
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use(express.static('build'))

const server = http.createServer(app)

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
})

server.on('close', () => {
  mongoose.connection.close()
})

module.exports = {
  app, server
}