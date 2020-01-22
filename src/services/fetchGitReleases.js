'use strict';

const git = require('simple-git/promise');

async function fetchGitReleases(repositoryUrl) {
    return git().listRemote(['--tags', '--sort=v:refname', repositoryUrl]);
};

module.exports = fetchGitReleases;
