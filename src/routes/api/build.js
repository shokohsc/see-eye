'use strict';

const express = require('express');
const httpError = require('http-errors');
const config = require('../../../src/config');
const router = new express.Router();
const Build = require('../../models/build');
const Repository = require('../../models/repository');

const accessRepositoryDirectory = require('../../services/accessRepositoryDirectory');
const readCiFile = require('../../services/readCiFile');
const readDockerTagsFromCiConfiguration = require('../../services/readDockerTagsFromCiConfiguration');
const readGitReleasesFromCiConfiguration = require('../../services/readGitReleasesFromCiConfiguration');
const readFixedParametersFromCiConfiguration = require('../../services/readFixedParametersFromCiConfiguration');
const cartesianProduct = require('../../services/cartesianProduct');
const getDockerCommands = require('../../services/getDockerCommands');
const createRepositoryBuilds = require('../../services/createRepositoryBuilds');
const createDockerNodes = require('../../services/createDockerNodes');
const dockerIntegration = require('../../services/dockerIntegration');

/**
 * @swagger
 * /build/repository/{repositoryId}:
 *  post:
 *    tags:
 *      - build
 *    description: Create repository build(s)
 *    parameters:
 *    - name: repositoryId
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.post('/build/repository/:repositoryId', async (req, res, next) => {
    let repository = await Repository.findOne({_id: req.params.repositoryId}).populate('builds');
    if (!repository) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    await accessRepositoryDirectory(config.buildPath+repository.id, repository.url, repository.branchTarget);

    // Read see-eye.yaml if exists
    const ciConf = await readCiFile(config.buildPath+repository.id+'/'+config.ciFilename);

    // List all --build-arg arguments per build
    const tags = await readDockerTagsFromCiConfiguration(ciConf);
    let releases = await readGitReleasesFromCiConfiguration(ciConf);
    const fixed = await readFixedParametersFromCiConfiguration(ciConf);

    // Create docker build commands
    releases.push(tags);
    releases.push(fixed);
    const products = await cartesianProduct(releases);
    const commands = await getDockerCommands(products, repository);

    // Save builds to database
    await createRepositoryBuilds(repository, commands);
    const builds = await Build.find({repositoryId: req.params.repositoryId});

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build/repository/{repositoryId}:
 *  get:
 *    tags:
 *      - build
 *    description: List repository builds
 *    parameters:
 *    - name: repositoryId
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The repository builds offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 10
 *      description: The repository builds limit, defaults to 10
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.get('/build/repository/:repositoryId', async (req, res, next) => {
    const offset = void 0 === req.query.offset ? 0 : parseInt(req.query.offset);
    const limit = void 0 === req.query.limit ? 10 : parseInt(req.query.limit);
    const builds = await Build.find({
        repositoryId: req.params.repositoryId,
    })
    .limit(limit)
    .skip(offset)
    .sort({
        createdAt: 'desc'
    });

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build/repository/{repositoryId}/start:
 *  put:
 *    tags:
 *      - build
 *    description: Start repository build(s) that are waiting
 *    parameters:
 *    - name: repositoryId
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.put('/build/repository/:repositoryId/start', async (req, res, next) => {
    const builds = await Build.find({
        repositoryId: req.params.repositoryId,
        state: 'waiting',
    });

    // Start docker builds
    const dockerHosts = await createDockerNodes();
    await dockerIntegration(dockerHosts, builds);

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build:
 *  get:
 *    tags:
 *      - build
 *    description: List builds
 *    parameters:
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The builds offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 10
 *      description: The builds limit, defaults to 10
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      500:
 *        description: Internal server error
 *
 */

router.get('/build', async (req, res, next) => {
    const offset = void 0 === req.query.offset ? 0 : parseInt(req.query.offset);
    const limit = void 0 === req.query.limit ? 10 : parseInt(req.query.limit);
    const builds = await Build.find()
    .limit(limit)
    .skip(offset)
    .sort({
        createdAt: 'desc'
    });

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build/queue:
 *  get:
 *    tags:
 *      - build
 *    description: List builds left to at least push
 *    parameters:
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The builds left offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 10
 *      description: The builds left limit, defaults to 10
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      500:
 *        description: Internal server error
 *
 */

router.get('/build/queue', async (req, res, next) => {
    const offset = void 0 === req.query.offset ? 0 : parseInt(req.query.offset);
    const limit = void 0 === req.query.limit ? 10 : parseInt(req.query.limit);
    const builds = await Build.find({
        $or: [
            {
                'state': [
                    'waiting',
                    'running',
                    'success',
                    'failed'
                ],
            }
        ],
    })
    .limit(limit)
    .skip(offset)
    .sort({
        createdAt: 'desc'
    });

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build/start:
 *  put:
 *    tags:
 *      - build
 *    description: Start build(s) that are waiting
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build(s) objects without logs
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.put('/build/start', async (req, res, next) => {
    let builds = await Build.find({
        'state': 'waiting',
    });

    // Start docker builds
    const dockerHosts = await createDockerNodes();
    await dockerIntegration(dockerHosts, builds);

    res.status(200);
    res.send(builds.map(build => build.logsLess()));
});

/**
 * @swagger
 * /build/{id}:
 *  get:
 *    tags:
 *      - build
 *    description: Return a build
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The build id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.get('/build/:id', async (req, res, next) => {
    const build = await Build.findOne({_id: req.params.id});

    if (!build) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    res.status(200);
    res.send(build.serialized());
});

/**
 * @swagger
 * /build/{id}/start:
 *  put:
 *    tags:
 *      - build
 *    description: Start a build that is waiting
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The build id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.put('/build/:id/start', async (req, res, next) => {
    const build = await Build.findOne({
        _id: req.params.id,
        'state': 'waiting',
    });

    if (!build) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    // Start docker build
    const dockerHosts = await createDockerNodes();
    await dockerIntegration(dockerHosts, [build]);

    res.status(200);
    res.send(build.serialized());
});

/**
 * @swagger
 * /build/{id}:
 *  delete:
 *    tags:
 *      - build
 *    description: Delete a build
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The build id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The build serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.delete('/build/:id', async (req, res, next) => {
    const build = await Build.findOne({_id: req.params.id});

    if (!build) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    await Build.deleteOne({_id: build.id });

    res.status(200);
    res.send(build.logsLess());
});

module.exports = router;
