'use strict';

const cfg = require('12factor-config');

const config = cfg({
  allowedHeaders: {
    env: 'ALLOWED_HEADERS',
    type: 'string',
  },
  allowedOrigins: {
    env: 'ALLOWED_ORIGINS',
    type: 'string',
  },
  appName: {
    env: 'APP_NAME',
    type: 'string',
    required: true,
    default: 'app',
  },
  debug: {
    env: 'DEBUG',
    type: 'string',
    required: true,
    default: 'true',
  },
  desiredPort: {
    env: 'PORT',
    type: 'integer',
    required: true,
    default: 3000,
  },
  enableCORS: {
    env: 'ENABLE_CORS',
    type: 'boolean',
  },
  nodeEnv: {
    env: 'NODE_ENV',
    type: 'enum',
    values: ['development', 'production'],
    default: 'production',
  },
  mattermostWebhookUrl: {
      env: 'MATTERMOST_WEBHOOK_URL',
  },
  mattermostCIChannel: {
      env: 'MATTERMOST_CI_CHAN',
      type: 'string',
      required: true,
      default: 'ci',
  },
  mattermostCIUser: {
      env: 'MATTERMOST_CI_USER',
      type: 'string',
      required: true,
      default: 'sidekick',
  },
  dockerPublicRegistry: {
      env: 'DOCKER_PUBLIC_REGISTRY',
      type: 'string',
      required: true,
      default: 'registry.hub.docker.com/v2',
  },
  githubPublicServer: {
      env: 'GITHUB_PUBLIC_SERVER',
      type: 'string',
      required: true,
      default: 'github.com',
  },
  mongodbHost: {
      env: 'MONGODB_HOST',
      type: 'string',
      required: true,
      default: 'mongo',
  },
  mongodbPort: {
      env: 'MONGODB_PORT',
      type: 'integer',
      required: true,
      default: 27017,
  },
  mongodbDatabase: {
      env: 'MONGODB_DATABASE',
      type: 'string',
      required: true,
      default: 'see-eye',
  },
  dockerSocketPath: {
      env: 'DOCKER_SOCKET_PATH',
      type: 'string',
      required: true,
      default: '/var/run/docker.sock',
  },
  uploadPath: {
      env: 'UPLOAD_PATH',
      type: 'string',
      required: true,
      default: '/app/data/upload/',
  },
  buildPath: {
      env: 'BUILD_PATH',
      type: 'string',
      required: true,
      default: '/app/data/build/',
  },
  ciFilename: {
      env: 'CI_FILENAME',
      type: 'string',
      required: true,
      default: 'see-eye.yaml',
  },
  apiHost: {
      env: 'API_HOST',
      type: 'string',
      required: true,
      default: 'localhost',
  },
  apiPort: {
      env: 'API_PORT',
      type: 'string',
      required: true,
      default: '3000',
  },
  apiPath: {
      env: 'API_PATH',
      type: 'string',
      required: true,
      default: '/api/',
  }
});

module.exports = config;
