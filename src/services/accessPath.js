'use strict';

const fs = require('fs');

async function accessPath(path) {

    try {
        fs.accessSync(path, fs.constants.F_OK);
    } catch (err) {
        console.error(err);
        fs.mkdirSync(path, {'mode': 0o775});
    }

};

module.exports = accessPath;
