if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

let port = process.env.PORT

// Production: MONGO_DB = ds253783.mlab.com:53783/persons
// Development: MONGO_DB = ds111370.mlab.com:11370/markus-db
// Test: MONGO_DB = ds135956.mlab.com:35956/markus-test
let mongoUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_DB}`

if (process.env.NODE_ENV === 'test') {
  port = process.env.TEST_PORT
  mongoUrl = `mongodb://${process.env.TEST_MONGO_USER}:${process.env.TEST_MONGO_PASS}@${process.env.TEST_MONGO_DB}`
}

module.exports = {
  mongoUrl,
  port
}