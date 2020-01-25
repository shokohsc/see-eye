'use strict';

const express = require('express');
const router = new express.Router();
const config = require('../../../src/config');
const getDockerRegistryTags = require('../../services/getDockerRegistryTags');

/**
 * @swagger
 * definitions:
 *  tag:
 *    type: string
 *    description: Tag name
 *    example: v0.0.1
 *  arrayOfTags:
 *    type: array
 *    items:
 *      $ref: "#/definitions/tag"
 *  getDocker:
 *    type: object
 *    properties:
 *      tags:
 *        $ref: "#/definitions/arrayOfTags"
 *
 */

/**
 * @swagger
 * /docker:
 *  get:
 *    tags:
 *      - docker
 *    description: Returns docker registry branches & releases
 *    parameters:
 *    - name: author
 *      in: query
 *      required: false
 *      type: string
 *      default: 'library'
 *      description: The docker image author, defaults to 'library'
 *    - name: image
 *      in: query
 *      required: true
 *      type: string
 *      description: The docker image name
 *    - name: domain
 *      in: query
 *      required: false
 *      type: string
 *      default: 'registry.hub.docker.com/v2'
 *      description: The docker registry domain, defaults to 'registry.hub.docker.com/v2'
 *    - name: offset
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 0
 *      description: The docker registry image tag offset, defaults to 0
 *    - name: limit
 *      in: query
 *      required: false
 *      type: integer
 *      minimum: 0
 *      default: 2
 *      description: The docker registry image tag limit, defaults to 2
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The docker registry branches & releases
 *        schema:
 *          $ref: "#/definitions/getDocker"
 *      400:
 *        description: parameters error
 *      404:
 *        description: registry url not found
 *
 */

router.get('/docker', async (req, res) => {
    const author = void 0 === req.query.author ? config.dockerPublicRegistryUsername : req.query.author;
    const image = req.query.image;
    const domain = void 0 === req.query.domain ? config.dockerPublicRegistry : req.query.domain;
    const offset = void 0 === req.query.offset ? 0 : req.query.offset;
    const limit = void 0 === req.query.limit ? 2 : req.query.limit;
    const imageUrl = 'https://' + domain + '/repositories/' + author + '/' + image + '/tags/';

    let tags = (await getDockerRegistryTags(imageUrl))
    .slice(offset, parseInt(offset)+parseInt(limit));

    res.status(200);
    res.send({
        'tags': tags
    });
});

module.exports = router;
