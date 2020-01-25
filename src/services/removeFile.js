'use strict';

const fs = require('fs');

async function removeFile(source) {

    try {
        fs.unlinkSync(source);
    } catch (err) {
        throw err;
    }

};

module.exports = removeFile;
