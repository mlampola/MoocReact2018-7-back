if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

let port = process.env.PORT

// Production: MONGO_DB = ds253783.mlab.com:53783/persons
// Development (Prod?): MONGO_DB = markus-db.7jvzk.mongodb.net/markus-db?retryWrites=true&w=majority
// Test: MONGO_DB = markus-test.glz0k.mongodb.net/markus-test?retryWrites=true&w=majority
let mongoUrl = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_DB}`

if (process.env.NODE_ENV === 'test') {
  port = process.env.TEST_PORT
  mongoUrl = `mongodb+srv://${process.env.TEST_MONGO_USER}:${process.env.TEST_MONGO_PASS}@${process.env.TEST_MONGO_DB}`
}

module.exports = {
  mongoUrl,
  port
}