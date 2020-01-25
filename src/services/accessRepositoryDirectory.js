'use strict';

const fs = require('fs');
const gitClone = require('./gitClone');
const gitPull = require('./gitPull');

async function accessRepositoryDirectory(path, remote, branch) {

    try {
        fs.accessSync(path, fs.constants.F_OK);
        await gitPull('origin', path, branch);
    } catch (err) {
        await gitClone(remote, path)
        .then(() => {
            fs.chmodSync(path, 0o775);
        })
        .catch((err) => {
            throw err;
        });
    }
};

module.exports = accessRepositoryDirectory;
