'use strict';

const config = require('../../src/config');
const Mattermost = require('node-mattermost');
const mattermost = new Mattermost(config.mattermostWebhookUrl, {});

module.exports = mattermost;
