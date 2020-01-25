'use strict';

const fs = require('fs');

async function moveFile(source, destination) {

    try {
        fs.copyFileSync(source, destination);
        fs.unlinkSync(source);
    } catch (err) {
        throw err;
    }

};

module.exports = moveFile;
