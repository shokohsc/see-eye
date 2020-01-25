'use strict';

const express = require('express');
const multer  = require('multer');
const httpError = require('http-errors');
const config = require('../../../src/config');
const upload = multer({ dest: '/tmp/' });
const router = new express.Router();
const Host = require('../../models/host');
const accessPath = require('../../services/accessPath');
const moveFile = require('../../services/moveFile');
const removeFile = require('../../services/removeFile');

/**
 * @swagger
 * /host:
 *  get:
 *    tags:
 *      - host
 *    description: List all docker hosts
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: All docker hosts serialized objects
 *      500:
 *        description: Internal server error
 *
 */

router.get('/host', async (req, res, next) => {
    const hosts = await Host.find();

    res.status(200);
    res.send(hosts.map(host => host.serialized()));
});

/**
 * @swagger
 * /host:
 *  post:
 *    tags:
 *      - host
 *    description: Create a docker host
 *    consumes:
 *      - multipart/form-data
 *    parameters:
 *    - name: url
 *      in: formData
 *      required: false
 *      type: string
 *      default: '/var/run/docker.sock'
 *      description: The docker host url, defaults to '/var/run/docker.sock'
 *    - name: ca
 *      in: formData
 *      required: false
 *      type: file
 *      description: The docker host ssl certificate authority path
 *    - name: cert
 *      in: formData
 *      required: false
 *      type: file
 *      description: The docker host ssl certificate path
 *    - name: key
 *      in: formData
 *      required: false
 *      type: file
 *      description: The docker host ssl key path
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The docker host serialized object
 *      400:
 *        description: Form data error(s)
 *      500:
 *        description: Internal server error
 *
 */

router.post('/host', upload.fields([{ name: 'ca' }, { name: 'cert' }, { name: 'key' }]), async (req, res, next) => {
    let errors = [];
    // set url property, defaults to unix docker socket /var/run/docker.sock
    const url = void 0 === req.body.url ? config.dockerSocketPath : req.body.url;
    let host = {
        url: url
    };

    // cancel if docker socket has already been registered
    if (0 < (await Host.find({url: url})).length) {
        errors.push('this docker socket/url has already been registered');
    }

    await accessPath(config.uploadPath);
    // copy then delete uploaded files from /tmp to config.uploadPath directory
    if (req.files.ca && req.files.cert && req.files.key) {
        await moveFile(req.files.ca[0].path, config.uploadPath+req.files.ca[0].filename);
        await moveFile(req.files.cert[0].path, config.uploadPath+req.files.cert[0].filename);
        await moveFile(req.files.key[0].path, config.uploadPath+req.files.key[0].filename);
    }

    // cancel if there is certificate and key files but no valid url
    const regex = /(?<host>^.+):(?<port>\d+$)/;
    if ((req.files.ca || req.files.cert || req.files.key) && !regex.test(url)) {
        errors.push('url does not match host:port pattern while providing certificates');
    }

    // remove files if there is at least an error
    if (0 < errors.length) {
        if (req.files.ca && req.files.cert && req.files.key) {
            await removeFile(config.uploadPath+req.files.ca[0].filename);
            await removeFile(config.uploadPath+req.files.cert[0].filename);
            await removeFile(config.uploadPath+req.files.key[0].filename);
        }

        res.status(400);
        res.send({
            errors: errors,
            url: url,
        });
        throw httpError('400', 'form data error(s)');
    }

    // set cert & key properties
    if (req.files.ca && req.files.cert && req.files.key && regex.test(url)) {
        host.ca = req.files.ca[0].filename;
        host.cert = req.files.cert[0].filename;
        host.key = req.files.key[0].filename;
    }

    // validate & write to database
    host = new Host(host);
    await host.validate();
    await host.save();

     res.status(200);
     res.send(host.serialized());
});

/**
 * @swagger
 * /host/{id}:
 *  get:
 *    tags:
 *      - host
 *    description: Return a docker host
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The docker host id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The docker host serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.get('/host/:id', async (req, res, next) => {
    const host = await Host.findOne({_id: req.params.id});

    if (!host) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    res.status(200);
    res.send(host.serialized());
});

/**
 * @swagger
 * /host/{id}:
 *  delete:
 *    tags:
 *      - host
 *    description: Delete a docker host
 *    parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      type: string
 *      description: The docker host id
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The docker host serialized object
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.delete('/host/:id', async (req, res, next) => {
    const host = await Host.findOne({_id: req.params.id});

    if (!host) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    if (host.ca && host.cert && host.key) {
        await removeFile(config.uploadPath+host.ca);
        await removeFile(config.uploadPath+host.cert);
        await removeFile(config.uploadPath+host.key);
    }

    await Host.deleteOne({_id: host.id });

    res.status(200);
    res.send(host.serialized());
});

module.exports = router;
