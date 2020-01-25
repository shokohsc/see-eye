'use strict'

const Repository = require('../models/repository');

const dockerBuild = require('./dockerBuild');
const config = require('../../src/config');

async function dockerIntegration(dockerHosts, repositoryId) {

    const repository = await Repository.findOne({_id: repositoryId}).populate('builds');
    let index = 0;
    for (let build of repository.builds) {
        Object.assign(build, {
            'state': 'running',
        });
        await build.save();
        await dockerBuild(dockerHosts[index], build);
        index++;
        if (dockerHosts.length === index)
            index = 0;
    }
};

module.exports = dockerIntegration;
