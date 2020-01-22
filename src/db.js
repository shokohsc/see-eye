const mongoose = require('mongoose');
const config = require('./config');

const databaseConfig = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
};

const mongoDbUri = `mongodb://${config.mongodbHost}:${config.mongodbPort}/${config.mongodbDatabase}`;

mongoose.connect(mongoDbUri, databaseConfig).catch((error) => {
    console.error({
        mongoDbUri: mongoDbUri,
        databaseConfig: databaseConfig,
    });
    console.error(error);
    process.exit(1);
});

mongoose.connection.on('connected', () => {});
mongoose.connection.on('error', () => {});
mongoose.connection.on('disconnected', () => {});

function gracefulShutdown(msg, callback) {
    mongoose.connection.close(() => {
        callback();
    });
}

// For nodemon restarts
process.once('SIGUSR2', () => {
    gracefulShutdown('nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
    });
});
// For app termination
process.on('SIGINT', () => {
    gracefulShutdown('app termination', () => {
        process.exit(0);
    });
});
// For Heroku app termination
process.on('SIGTERM', () => {
    gracefulShutdown('Heroku app termination', () => {
        process.exit(0);
    });
});

module.exports = {
    connection: mongoose.connection,
};
