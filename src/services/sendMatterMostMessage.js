'use strict';

const config = require('../../src/config');
const mattermost = require('./mattermost');

async function sendMatterMostMessage(message) {
    if (void 0 !== config.mattermostWebhookUrl && '' !== config.mattermostWebhookUrl) {
        try {
            await mattermost.send({
                text: message,
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
