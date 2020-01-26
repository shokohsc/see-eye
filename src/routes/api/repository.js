'use strict';

const express = require('express');
const httpError = require('http-errors');
const config = require('../../../src/config');
const router = new express.Router();
const Repository = require('../../models/repository');
const Build = require('../../models/build');
const removeDirectory = require('../../services/removeDirectory');

/**
 * @swagger
 * /repository:
 *  get:
 *    tags:
 *      - repository
 *    description: List all repository
 *    parameters:
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The repository offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 10
 *      description: The repository limit, defaults to 10
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: All repositorys serialized objects
 *      500:
 *        description: Internal server error
 *
 */

router.get('/repository', async (req, res, next) => {
    const offset = void 0 === req.query.offset ? 0 : parseInt(req.query.offset);
    const limit = void 0 === req.query.limit ? 10 : parseInt(req.query.limit);
    const repositories = await Repository.find()
    .limit(limit)
    .skip(offset)
    .sort({
        createdAt: 'desc'
    })
    .populate('builds');

    res.status(200);
    res.send(repositories.map(repository => repository.serialized()));
});

/**
 * @swagger
 * /repository:
 *  post:
 *    tags:
 *      - repository
 *    description: Create a repository
 *    consumes:
 *      - application/x-www-form-urlencoded
 *    parameters:
 *    - name: author
 *      in: formData
 *      required: true
 *      type: string
 *      description: The repository author
 *    - name: repository
 *      in: formData
 *      required: true
 *      type: string
 *      description: The repository name
 *    - name: domain
 *      in: formData
 *      required: false
 *      type: string
 *      default: 'github.com'
 *      description: The repository domain, defaults to 'github.com'
 *    - name: connection
 *      in: formData
 *      required: false
 *      type: string
 *      enum: ['ssl', 'https', 'http']
 *      default: 'https'
 *      description: The repository server connection, defaults to 'https'
 *    - name: type
 *      in: formData
 *      required: false
 *      type: string
 *      enum: ['git']
 *      default: 'git'
 *      description: The repository server type, defaults to 'git'
 *    - name: branchTarget
 *      in: formData
 *      required: false
 *      type: string
 *      default: 'master'
 *      description: The repository branch target to build on, defaults to 'master'
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The repository serialized object
 *      400:
 *        description: Form data error(s)
 *      500:
 *        description: Internal server error
 *
 */

router.post('/repository', async (req, res, next) => {
    let errors = [];
    let repository = req.body;
    repository.domain = void 0 === req.body.domain ? config.githubPublicServer : req.body.domain;
    repository.connection = void 0 === req.body.connection ? 'https' : req.body.connection;
    repository.type = void 0 === req.body.type ? 'git' : req.body.type;

    // cancel if repository url has already been registered
    if (0 < (await Repository.find({
        author: repository.author,
        repository: repository.repository,
        domain: repository.domain
    })).length) {
        errors.push('this repository has already been registered');
    }

    // cancel if there is at least an error
    if (0 < errors.length) {
        res.status(400);
        res.send(errors);
        throw httpError('400', 'form data error(s)');
    }

    // validate & write to database
    repository = new Repository(repository);
    await repository.validate();
    await repository.save();

    res.status(200);
    res.send(repository.serialized());
});

/**
 * @swagger
 * /repository/{id}:
 *  get:
 *    tags:
 *      - repository
 *    description: Return a repository
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The repository serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.get('/repository/:id', async (req, res, next) => {
    const repository = await Repository.findOne({_id: req.params.id}).populate('builds');

    if (!repository) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    res.status(200);
    res.send(repository.serialized());
});

/**
 * @swagger
 * /repository/{id}:
 *  put:
 *    tags:
 *      - repository
 *    description: Update a repository
 *    consumes:
 *      - application/x-www-form-urlencoded
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    - name: author
 *      in: formData
 *      required: true
 *      type: string
 *      description: The repository author
 *    - name: repository
 *      in: formData
 *      required: true
 *      type: string
 *      description: The repository name
 *    - name: domain
 *      in: formData
 *      required: false
 *      type: string
 *      default: 'github.com'
 *      description: The repository domain, defaults to 'github.com'
 *    - name: connection
 *      in: formData
 *      required: false
 *      type: string
 *      enum: ['ssl', 'https', 'http']
 *      default: 'https'
 *      description: The repository server connection, defaults to 'https'
 *    - name: type
 *      in: formData
 *      required: false
 *      type: string
 *      enum: ['git']
 *      default: 'git'
 *      description: The repository server type, defaults to 'git'
 *    - name: branchTarget
 *      in: formData
 *      required: false
 *      type: string
 *      default: 'master'
 *      description: The repository branch target to build on, defaults to 'master'
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The repository serialized object
 *      400:
 *        description: Form data error(s)
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.put('/repository/:id', async (req, res, next) => {
    let errors = [];
    let repository = await Repository.findOne({_id: req.params.id}).populate('builds');

    if (!repository) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    // cancel if repository url has already been registered
    const regex = new RegExp('/!'+req.params.id+'/i');
    if (0 < (await Repository.find({
        author: req.body.author,
        repository: req.body.repository,
        domain: req.body.domain,
        id: {
            $regex: regex
        },
    }))) {
        errors.push('this repository has already been registered');
    }

    if (0 < errors.length) {
        res.status(400);
        res.send(errors);
        throw httpError('400', 'form data error(s)');
    }

    // remove files if url has changed
    try {
        if (repository.author !== req.body.author && repository.repository !== req.body.repository && repository.domain !== req.body.domain) {
            await removeDirectory(config.buildPath+repository.id);
            for (var build of repository.builds) {
                await Build.deleteOne({_id: build.id });
            }
        }
    } catch (err) {
        console.log(config.buildPath+repository.id+' does not exists or is not readable');
        console.error(err);
    }


    // validate & write to database
    Object.assign(repository, req.body);
    await repository.validate();
    await repository.save();

    res.status(200);
    res.send(repository.serialized());
});

/**
 * @swagger
 * /repository/{id}:
 *  delete:
 *    tags:
 *      - repository
 *    description: Delete a repository
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The repository id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The repository serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.delete('/repository/:id', async (req, res, next) => {
    const repository = await Repository.findOne({_id: req.params.id}).populate('builds');

    if (!repository) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    // Remove repository directory
    await removeDirectory(config.buildPath+repository.id);

    for (var build of repository.builds) {
        await Build.deleteOne({_id: build.id });
    }

    await Repository.deleteOne({_id: repository.id });

    res.status(200);
    res.send(repository.serialized());
});

module.exports = router;
