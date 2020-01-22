'use strict';

const express = require('express');
const router = new express.Router();
const getAppInfo = require('../../services/getAppInfo');

/**
 * @swagger
 * definitions:
 *  apiInfo:
 *    properties:
 *      title:
 *        type: string
 *        description: The title of the API
 *      environment:
 *        type: string
 *        description: The environment
 *      version:
 *        type: string
 *        description: The version of the API
 *      commit:
 *        type: string
 *        description: The commit hash
 *
 */

/**
 * @swagger
 * /:
 *  get:
 *    tags:
 *      - root
 *    description: Returns information about the API
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The API information
 *        schema:
 *          $ref: '#/definitions/apiInfo'
 *
 */

router.get('/', async (req, res) => {
    const appInfo = await getAppInfo();
    res.status(200).json({
        title: appInfo.title,
        environment: appInfo.environment,
        version: appInfo.version,
        commit: appInfo.commit,
        build: appInfo.build
    });
});

module.exports = router;
