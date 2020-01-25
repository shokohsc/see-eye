'use strict';

const getGitRepositoryTags = require('./getGitRepositoryTags');
const config = require('../../src/config');

async function readGitReleasesFromCiConfiguration(ciConfiguration) {

    try {
        let releases = [];
        let releasesConf = [];
        if (ciConfiguration['build-args'] && ciConfiguration['build-args'].releases) {
            releasesConf = ciConfiguration['build-args'].releases;
        } else {
            return releases;
        }

        let index = 0;
        for (const release of releasesConf) {
            const author = release.author ? release.author : void 0;
            const repository = release.repository;
            const domain = release.domain ? release.domain : config.githubPublicServer;
            const offset = release.offset ? release.offset : 0;
            const limit = release.limit ? release.limit : 2;
            const repositoryUrl = 'https://' + domain + '/' + author + '/' + repository + '.git';

            await getGitRepositoryTags(repositoryUrl)
            .then(data => {
                    releases[index] = [];
                    data
                    .slice(offset, parseInt(offset)+parseInt(limit))
                    .forEach((tag) => {
                        releases[index].push({
                            'key': release.key,
                            'value': tag,
                            'repository': release.repository,
                        });
                    });
            });
            index++;
        }

        return releases;
    } catch (err) {
        throw err;
    }

};

module.exports = readGitReleasesFromCiConfiguration;
