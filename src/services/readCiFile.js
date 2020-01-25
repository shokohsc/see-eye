'use strict';

const fs = require('fs');
const yaml = require('yaml');

async function readCiFile(source) {

    try {
        fs.accessSync(source, fs.constants.F_OK);
        const file = fs.readFileSync(source, 'utf8');
        return yaml.parse(file);
    } catch (err) {
        throw err;
    }

};

module.exports = readCiFile;
