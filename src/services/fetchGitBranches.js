'use strict';

const git = require('simple-git/promise');

async function fetchGitBranches(repositoryUrl) {
    return git().listRemote(['--heads', '--sort=v:refname', repositoryUrl]);
};

module.exports = fetchGitBranches;
