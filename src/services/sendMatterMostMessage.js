'use strict';

const config = require('../../src/config');
const mattermost = require('./mattermost');
const minecraftLogValidate = require('./minecraftLogValidate');

async function sendMatterMostMessage(msg) {
    const isValid = await minecraftLogValidate(msg);
    if (void 0 !== config.mattermostWebhookUrl && isValid) {
        // Server thread/INFO: Group `time` Group `type` Group `message`
        const regex = /^(?<time>\[\d{2}:\d{2}:\d{2}\]) (?<type>\[(Server thread|Server-Worker-\d+|Async Chat Thread - #\d+)\/INFO\]): (?<message>.+)$/g;
        try {
            const result = regex.exec(msg);
            await mattermost.send({
                text: result.groups.message,
                channel: '#'+config.mattermostMinecraftChannel,
                username: config.mattermostMinecraftUser
            });
        } catch (err) {
            console.error('Cannot post to mattermost, msg: ' + msg);
            console.error(err);
        }
    }
};

module.exports = sendMatterMostMessage;
