'use strict'

const fetchGitReleases = require('./fetchGitReleases');
const fetchGitBranches = require('./fetchGitBranches');

async function getGitRepositoryTags(repositoryUrl) {

    const tagRegex = /(.+)refs\/tags\/(?<tag>.+$)/;
    let tags = [];
    let releases = await fetchGitReleases(repositoryUrl);

    releases.split('\n').forEach(element => {
        const result = tagRegex.exec(element);
        if (result && result.groups && result.groups.tag && ! /\^{}/.test(result.groups.tag)) {
            tags.push(result.groups.tag);
        }
    });

    return tags.sort((a, b) => {
        return parseInt(a.replace(/v|\./g, '')) > parseInt(b.replace(/v|\./g, '')) ? -1 : 1;
    });
};

module.exports = getGitRepositoryTags;
