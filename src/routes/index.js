'use strict';

const express = require('express');
const router = new express.Router();

const root = require('./api/root');
const docker = require('./api/docker');
const git = require('./api/git');

const host = require('./api/host');

router.use(root);
router.use(docker);
router.use(git);

router.use(host);

module.exports = router;
