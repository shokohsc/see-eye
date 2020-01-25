'use strict';

const git = require('simple-git/promise');

async function gitClone(remote, destination) {

    try {
        return git()
        .silent(true)
        .clone(remote, destination);
    } catch (err) {
        throw err;
    }

};

module.exports = gitClone;
