'use strict';

const express = require('express');
const router = new express.Router();
const config = require('../../../src/config');
const getGitRepositoryTags = require('../../services/getGitRepositoryTags');
const getGitRepositoryHeads = require('../../services/getGitRepositoryHeads');

/**
 * @swagger
 * definitions:
 *  branch:
 *    type: string
 *    description: Branch name
 *    example: master
 *  arrayOfBranches:
 *    type: array
 *    items:
 *      $ref: "#/definitions/branch"
 *  release:
 *    type: string
 *    description: Release name
 *    example: v0.0.1
 *  arrayOfReleases:
 *    type: array
 *    items:
 *      $ref: "#/definitions/release"
 *  getGit:
 *    type: object
 *    properties:
 *      branches:
 *        $ref: "#/definitions/arrayOfBranches"
 *      releases:
 *        $ref: "#/definitions/arrayOfReleases"
 *
 */

/**
 * @swagger
 * /git:
 *  get:
 *    tags:
 *      - git
 *    description: Returns git repository branches & releases
 *    parameters:
 *    - name: author
 *      in: query
 *      required: true
 *      type: string
 *      description: The git repository author
 *    - name: repository
 *      in: query
 *      required: true
 *      type: string
 *      description: The git repository name
 *    - name: domain
 *      in: query
 *      required: false
 *      type: string
 *      default: 'github.com'
 *      description: The git server domain, defaults to 'github.com'
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The git server repository release offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 2
 *      description: The git server repository release limit, defaults to 2
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The git repository branches & releases
 *        schema:
 *          $ref: "#/definitions/getGit"
 *      400:
 *        description: parameters error
 *      404:
 *        description: repository url not found
 *
 */

router.get('/git', async (req, res) => {
    const author = req.query.author;
    const repository = req.query.repository;
    const domain = void 0 === req.query.domain ? config.githubPublicServer : req.query.domain;
    const offset = void 0 === req.query.offset ? 0 : req.query.offset;
    const limit = void 0 === req.query.limit ? 2 : req.query.limit;
    const repositoryUrl = 'https://' + domain + '/' + author + '/' + repository + '.git';

    let heads = await getGitRepositoryHeads(repositoryUrl);
    let tags = (await getGitRepositoryTags(repositoryUrl))
    .slice(offset, parseInt(offset)+parseInt(limit));

    res.status(200);
    res.send({
        'branches': heads,
        'releases': tags
    });
});

module.exports = router;
