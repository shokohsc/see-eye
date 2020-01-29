'use strict';

const config = require('../../src/config');
const mattermost = require('./mattermost');

async function sendMatterMostMessage(message) {
    if (void 0 !== config.mattermostWebhookUrl && '' !== config.mattermostWebhookUrl) {
        try {
            await mattermost.send({
                text: message,
                channel: '#'+config.mattermostCIChannel,
                username: config.mattermostCIUser
            });
        } catch (err) {
            console.error('Cannot post to mattermost, msg: ' + message);
            console.error(err);
        }
    }
};

module.exports = sendMatterMostMessage;
