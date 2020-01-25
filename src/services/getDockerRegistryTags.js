'use strict'

const fetchDockerTags = require('./fetchDockerTags');

async function getDockerRegistryTags(imageUrl) {

    let tags = [];

    const init = await fetchDockerTags(imageUrl);
    init.results.forEach((tag) => {
        tags.push(tag);
    });
    if (10 < init.count) {
        const pages = Math.ceil(parseInt(init.count) / 10);
        let requests = [];
        for (let page = 2; page <= pages; page++) {
            requests.push(fetchDockerTags(imageUrl + '?page=' + page));
        }
        const responses = await Promise.all(requests);
        responses.forEach((response) => {
            response.results.forEach((tag) => {
                tags.push(tag);
            });
        });
    }

    return tags.sort((a, b) => {
        return (new Date(a.last_updated)).getTime() > (new Date(b.last_updated)).getTime() ? -1 : 1;
    })
    .map((tag) => {
        return tag.name;
    });
    // .filter(tag => 'latest' !== tag)
};

module.exports = getDockerRegistryTags;
