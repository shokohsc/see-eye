'use strict';

const express = require('express');
const router = new express.Router();
const config = require('../../../src/config');
const fetchGitReleases = require('../../services/fetchGitReleases');
const fetchGitBranches = require('../../services/fetchGitBranches');

/**
 * @swagger
 * definitions:
 *  branch:
 *    type: string
 *    description: Branch name
 *    example: my-branch
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
 *      schema:
 *         type: string
 *         default: 'github.com'
 *      description: The git server domain, defaults to 'github.com'
 *    - name: offset
 *      in: query
 *      required: false
 *      schema:
 *         type: integer
 *         minimum: 0
 *         default: 0
 *      description: The git server repository release offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      schema:
 *         type: integer
 *         minimum: 0
 *         default: 2
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

    const headRegex = /(.+)refs\/heads\/(?<head>.+$)/;
    const tagRegex = /(.+)refs\/tags\/(?<tag>.+$)/;
    let heads = [];
    let tags = [];

    let branches = await fetchGitBranches(repositoryUrl);
    let releases = await fetchGitReleases(repositoryUrl);

    branches.split('\n').forEach(element => {
        const result = headRegex.exec(element);
        if (result && result.groups && result.groups.head && ! /\^{}/.test(result.groups.head)) {
            heads.push(result.groups.head);
        }
    });
    // heads = heads.filter(branch => 'master' !== branch);

    releases.split('\n').forEach(element => {
        const result = tagRegex.exec(element);
        if (result && result.groups && result.groups.tag && ! /\^{}/.test(result.groups.tag)) {
            tags.push(result.groups.tag);
        }
    });
    tags = tags.sort((a, b) => {
        return parseInt(a.replace(/v|\./g, '')) > parseInt(b.replace(/v|\./g, '')) ? -1 : 1;
    })
    .slice(offset, parseInt(offset)+parseInt(limit));

    res.status(200);
    res.send({
        'branches': heads,
        'releases': tags
    });
});

module.exports = router;
