'use strict';

const fs = require('fs');
const Docker = require('dockerode');
const config = require('../../src/config');
const Host = require('../models/host');

async function createDockerNodes() {

    return (await Host.find()).map((host) => {
        return (host.ca && host.cert && host.key) ? new Docker({
            protocol: 'https',
            socketPath: void 0,
            host: host.url.split(':')[0],
            port: host.url.split(':')[1],
            ca: fs.readFileSync(config.uploadPath+host.ca),
            cert: fs.readFileSync(config.uploadPath+host.cert),
            key: fs.readFileSync(config.uploadPath+host.key),
        }): new Docker({
            socketPath: host.url,
        });
    });
};

module.exports = createDockerNodes;
