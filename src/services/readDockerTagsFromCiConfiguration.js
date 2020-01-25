'use strict';

const getDockerRegistryTags = require('./getDockerRegistryTags');
const config = require('../../src/config');

async function readDockerTagsFromCiConfiguration(ciConfiguration) {

    try {
        let tags = [];
        let tagsConf = {};
        if (ciConfiguration['build-args'] && ciConfiguration['build-args'].tags) {
            tagsConf = ciConfiguration['build-args'].tags;
        } else {
            return tags;
        }

        const author = tagsConf.author ? tagsConf.author : config.dockerPublicRegistryUsername;
        const image = tagsConf.image;
        const domain = tagsConf.domain ? tagsConf.domain : config.dockerPublicRegistry;
        const offset = tagsConf.offset ? tagsConf.offset : 0;
        const limit = tagsConf.limit ? tagsConf.limit : 2;
        const imageUrl = 'https://' + domain + '/repositories/' + author + '/' + image + '/tags/';

        await getDockerRegistryTags(imageUrl)
        .then(data => {
            data.forEach((tag) => {
                tags.push({
                    'key': tagsConf.key,
                    'value': tag,
                    'image': tagsConf.image,
                });
            });
        });

        return tags.slice(offset, parseInt(offset)+parseInt(limit));;
    } catch (err) {
        throw err;
    }

};

module.exports = readDockerTagsFromCiConfiguration;
