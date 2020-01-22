'use strict';

const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const httpError = require('http-errors');
const config = require('../../../src/config');
const upload = multer({ dest: '/tmp/' });
const router = new express.Router();
const serverError = require('../../services/serverError');
const Host = require('../../models/host');

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
 *      schema:
 *         type: string
 *         default: '/var/run/docker.sock'
 *      description: The docker host url, defaults to '/var/run/docker.sock'
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

router.post('/host', upload.fields([{ name: 'cert' }, { name: 'key' }]), async (req, res, next) => {
    let errors = [];
    // set url property, defaults to unix docker socket /var/run/docker.sock
    const url = void 0 === req.body.url ? config.dockerSocketPath : req.body.url;
    let host = {
        url: url
    }

    // cancel if docker socket has already been registered
    if (0 < (await Host.find({url: url})).length) {
        errors.push('this docker socket/url has already been registered');
    }

    // copy then delete uploaded files from /tmp to config.uploadPath directory
    if (req.files.cert || req.files.key) {
        fs.copyFile(req.files.cert[0].path, config.uploadPath+req.files.cert[0].filename, (err) => {
            if (err) serverError(res, err);
        });
        fs.unlink(req.files.cert[0].path, (err) => {
            if (err) serverError(res, err);
        });

        fs.copyFile(req.files.key[0].path, config.uploadPath+req.files.key[0].filename, (err) => {
            if (err) serverError(res, err);
        });
        fs.unlink(req.files.key[0].path, (err) => {
            if (err) serverError(res, err);
        });
    }

    // cancel if there is certificate and key files but no valid url
    const regex = /(?<host>^.+):(?<port>\d+$)/;
    if (req.files.cert && req.files.key && !regex.test(url)) {
        errors.push('url does not match host:port pattern while providing certs');
    }

    // remove files if there is at least an error
    if (0 < errors.length) {
        if (req.files.cert && req.files.key) {
            fs.unlink(config.uploadPath+req.files.cert[0].filename, (err) => {
                if (err) serverError(res, err);
            });
            fs.unlink(config.uploadPath+req.files.key[0].filename, (err) => {
                if (err) serverError(res, err);
            });
        }

        res.status(400);
        res.send({
            errors: errors,
            url: url,
        });
        throw httpError('400', 'form data error(s)');
    }

    // set cert & key properties
    if (req.files.cert && req.files.key && regex.test(url)) {
        host.cert = req.files.cert[0].filename;
        host.key = req.files.key[0].filename;
    }

    // validate & write to database
    host = new Host(host);
    await host.validate();
    await host.save();

     res.status(200);
     res.send(host);
});

/**
 * @swagger
 * /host:
 *  get:
 *    tags:
 *      - host
 *    description: Read all docker host
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
    res.send(hosts);
});

/**
 * @swagger
 * /host/{id}:
 *  get:
 *    tags:
 *      - host
 *    description: Read a docker host
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
    const host = await Host.findOne({id: req.param.id});

    if (!host) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    res.status(200);
    res.send(host);
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
    const host = await Host.findOne({id: req.param.id});

    if (!host) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    if (host.cert && host.key) {
        fs.unlink(config.uploadPath+host.cert, (err) => {
            if (err) serverError(res, err);
        });
        fs.unlink(config.uploadPath+host.key, (err) => {
            if (err) serverError(res, err);
        });
    }

    await Host.deleteOne({_id: host.id });

    res.status(200);
    res.send(host);
});

module.exports = router;
