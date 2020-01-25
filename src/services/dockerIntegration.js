'use strict'

const dockerBuild = require('./dockerBuild');
const config = require('../../src/config');

async function dockerIntegration(dockerHosts, builds) {

    let index = 0;
    for (let build of builds) {
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
