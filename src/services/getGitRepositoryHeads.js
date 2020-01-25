'use strict'

const fetchGitReleases = require('./fetchGitReleases');
const fetchGitBranches = require('./fetchGitBranches');

async function getGitRepositoryHeads(repositoryUrl) {

    const headRegex = /(.+)refs\/heads\/(?<head>.+$)/;
    let heads = [];
    let branches = await fetchGitBranches(repositoryUrl);

    branches.split('\n').forEach(element => {
        const result = headRegex.exec(element);
        if (result && result.groups && result.groups.head && ! /\^{}/.test(result.groups.head)) {
            heads.push(result.groups.head);
        }
    });
    // heads = heads.filter(branch => 'master' !== branch);
    return heads;
};

module.exports = getGitRepositoryHeads;
