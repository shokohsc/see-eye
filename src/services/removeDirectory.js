'use strict';

const fs = require('fs');
const rimraf = require('rimraf');

async function removeFile(source) {

    try {
        fs.accessSync(source, fs.constants.F_OK);
        rimraf.sync(source);
    } catch (err) {
        console.error(err);
    }

};

module.exports = removeFile;
