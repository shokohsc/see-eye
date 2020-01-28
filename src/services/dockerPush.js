'use strict'

const config = require('../../src/config');
const sendMatterMostMessage = require('./sendMatterMostMessage');

async function dockerPush(docker, build) {

    const image = await docker.getImage(build.tag);
    await image.push({
        'authconfig': {
            auth: '',
            email: config.dockerAuthEmail,
            password: config.dockerAuthPassword,
            serveraddress: config.dockerAuthServer,
            username: config.dockerAuthUsername,
        },
        'name': build.tag,
        'tag': build.tag.split(':')[1],
    }, async (err, stream) => {
        if (null != err) {
            console.error(err);
        } else {
            await docker.modem.followProgress(
                stream,
                async (error, output) => {
                    // on.end(error, output)
                    if (null != error) build.logs.push(error)
                    Object.assign(build, {
                        'state': null == error ? 'pushed' : build.state,
                    });
                    await sendMatterMostMessage(`Pushed ${build.tag}: ${build.id}`);
                    await build.save();
                },
                (event) => {
                    // on.data(event)
                    if (null !== event && event.stream && "\n" != event.stream && null != event.stream)
                        build.logs.push(event.stream);
                }
            );
        }
    });
};

module.exports = dockerPush;
