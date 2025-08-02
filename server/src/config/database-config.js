const mongoose = require('mongoose');
const { mongoURI } = require('./server-config');

const connect = () => {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected successfully"))
    .catch((error) => {
        console.log("DB connection failed");
        process.exit(1);
    })
}

module.exports = {
    connect,
};