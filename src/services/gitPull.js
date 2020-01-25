'use strict';

const git = require('simple-git/promise');

async function gitPull(remote, destination, branch) {

    try {
        return git(destination)
        .silent(true)
        .pull(remote, branch);
    } catch (err) {
        throw err;
    }

};

module.exports = gitPull;
