const mongoose = require('mongoose')

function connect(uri) {
  return mongoose.connect(uri, { autoIndex: true })
}

module.exports = { connect }
