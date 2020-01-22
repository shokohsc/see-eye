'use strict';

const axios = require('axios');

async function fetchDockerTags(registryUrl) {
    return axios.get(registryUrl)
    .then(function (response) {
        return response.data;
    })
    .catch(function (error) {
        console.error(error);
        return [];
    });
};

module.exports = fetchDockerTags;
