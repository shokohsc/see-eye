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
      default: 'see-eye',
  },
  dockerPublicRegistry: {
      env: 'DOCKER_PUBLIC_REGISTRY',
      type: 'string',
      required: true,
      default: 'registry.hub.docker.com/v2',
  },
  dockerPublicRegistryUsername: {
      env: 'DOCKER_PUBLIC_USERNAME',
      type: 'string',
      required: true,
      default: 'library',
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
  dockerAuthServer: {
      env: 'DOCKER_AUTH_SERVER',
      type: 'string',
      required: true,
      default: 'https://index.docker.io/v1',
  },
  dockerAuthUsername: {
      env: 'DOCKER_AUTH_USERNAME',
      type: 'string',
      required: true,
  },
  dockerAuthEmail: {
      env: 'DOCKER_AUTH_EMAIL',
      type: 'string',
      required: true,
  },
  dockerAuthPassword: {
      env: 'DOCKER_AUTH_PASSWORD',
      type: 'string',
      required: true,
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
  },
  apiPaginationElements: {
      env: 'API_PAGINATION_ELEMENTS',
      type: 'integer',
      required: true,
      default: 10,
  }
});

module.exports = config;
