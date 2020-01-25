'use strict'

const tarfs = require('tar-fs');
const config = require('../../src/config');
const dockerPush = require('./dockerPush');

async function dockerBuild(docker, build) {

    const pack = tarfs.pack(config.buildPath+build.repositoryId);
    await docker.buildImage(pack, {
        't': build.tag,
        'buildargs': build.buildArgs,
    }, async (err, stream) => {
        if (null != err) {
            console.error(err);
        } else {
            await docker.modem.followProgress(
                stream,
                async (error, output) => {
                    // on.end(error, output)
                    if (null != error) console.error(error);
                    Object.assign(build, {
                        'state': null == error ? 'success' : 'failed',
                    });
                    await build.save();
                    await dockerPush(docker, build);
                },
                (event) => {
                    // on.data(event)
                    if (null !== event) build.logs.push(event.stream);
                }
            );
        }
    });
};

module.exports = dockerBuild;
