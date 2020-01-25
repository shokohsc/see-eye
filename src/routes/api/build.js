'use strict';

const express = require('express');
const fs = require('fs');
const httpError = require('http-errors');
const yaml = require('yaml');
const axios = require('axios');
const git = require('simple-git/promise');
const gitRev = require('git-rev-sync');
const Docker = require('dockerode');
const tarfs = require('tar-fs');
const config = require('../../../src/config');
const router = new express.Router();
const serverError = require('../../services/serverError');
const Host = require('../../models/host');
const Build = require('../../models/build');
const Repository = require('../../models/repository');

/**
 * @swagger
 * /build/{repositoryId}:
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
 *        description: The build(s) serialized objects
 *      404:
 *        description: Resource not found
 *      500:
 *        description: Internal server error
 *
 */

router.post('/build/:repositoryId', async (req, res, next) => {
    let repository = await Repository.findOne({_id: req.params.repositoryId}).populate('builds');
    if (!repository) {
        res.status(404);
        res.send({
            errors: ['Resource not found'],
        });
        throw httpError('404', 'Resource not found');
    }

    // Git clone && git checkout branch
    let commit = void 0;
    let branch = void 0;
    try {
        fs.accessSync(config.buildPath+repository.id, fs.constants.F_OK);
        await git(config.buildPath+repository.id)
        .silent(true)
        .pull('origin', repository.branchTarget)
        .then(() => {
            commit = gitRev.long(config.buildPath+repository.id);
            branch = gitRev.branch(config.buildPath+repository.id);
        })
        .catch((err) => console.error('failed: ', err));
    } catch (err) {
        await git()
        .silent(true)
        .clone(repository.url, config.buildPath+repository.id)
        .then(() => {
            fs.chmod(config.buildPath+repository.id, 0o775, (err) => {
                if (err) serverError(res, err);
            });
            commit = gitRev.long(config.buildPath+repository.id);
            branch = gitRev.branch(config.buildPath+repository.id);
        })
        .catch((err) => console.error('failed: ', err));
    }

    // Read see-eye.yaml if exists
    let ciConf = {};
    try {
        fs.accessSync(config.buildPath+repository.id+'/'+config.ciFilename, fs.constants.F_OK);
        const file = fs.readFileSync(config.buildPath+repository.id+'/'+config.ciFilename, 'utf8');
        ciConf = yaml.parse(file);
    } catch (err) {
        console.log(config.buildPath+repository.id+'/'+config.ciFilename+' does not exists or is not readable');
        console.error(err);
    }

    // List all --build-arg arguments per build
    let tagsConf = {};
    let releasesConf = [];
    let fixedConf = [];
    if (ciConf['build-args'] && ciConf['build-args'].tags) tagsConf = ciConf['build-args'].tags;
    if (ciConf['build-args'] && ciConf['build-args'].releases) releasesConf = ciConf['build-args'].releases;
    if (ciConf['build-args'] && ciConf['build-args'].fixed) fixedConf = ciConf['build-args'].fixed;

    let tags = [];
    await axios({
        method: 'get',
        url: 'http://'+config.apiHost+':'+config.apiPort+config.apiPath+'docker',
        params: {
            'author': tagsConf.author ? tagsConf.author : void 0,
            'image': tagsConf.image,
            'domain': tagsConf.domain ? tagsConf.domain : void 0,
            'offset': tagsConf.offset ? tagsConf.offset : void 0,
            // 'limit': tagsConf.limit ? tagsConf.limit : void 0,
            'limit': '2',
        },
    })
    .then(response => {
        if (response.data && response.data.tags) {
            response.data.tags.forEach((tag) => {
                tags.push({
                    'key': tagsConf.key,
                    'value': tag,
                    'image': tagsConf.image,
                });
            });
        }
    });

    let releases = [];
    let index = 0;
    for (const release of releasesConf) {
        await axios({
            method: 'get',
            url: 'http://'+config.apiHost+':'+config.apiPort+config.apiPath+'git',
            params: {
                'author': release.author ? release.author : void 0,
                'repository': release.repository,
                'domain': release.domain ? release.domain : void 0,
                'offset': release.offset ? release.offset : void 0,
                // 'limit': release.limit ? release.limit : void 0,
                'limit': '2',
            },
        })
        .then(response => {
            if (response.data.releases) {
                if (response.data && response.data.releases) {
                    releases[index] = [];
                    response.data.releases.forEach((tag) => {
                        releases[index].push({
                            'key': release.key,
                            'value': tag,
                            'repository': release.repository,
                        });
                    });

                }
            }
        });
        index++;
    }

    let fixed = [];
    fixedConf.forEach((arg) => {
        fixed.push({'key': arg.key, 'value': arg.value, 'tagKey': arg.tag_key});
    });

    // Create docker build commands
    function cartesian(arg) {
        let r = [],
            max = arg.length-1;

        function helper(arr, i) {
            for (let j=0, l=arg[i].length; j<l; j++) {
                let a = arr.slice(0); // clone arr
                a.push(arg[i][j]);
                if (i==max)
                    r.push(a);
                else
                    helper(a, i+1);
            }
        }
        helper([], 0);
        return r;
    }

    let commands = [];
    releases.push(tags);
    const products = cartesian(releases);
    products.forEach((product) => {
        let command = '';
        let buildTag = '-t '+repository.author+'/'+repository.repository+':';
        let buildTags = [];
        let buildArgs = {};
        product.forEach((arg) => {
            command += '--build-arg '+arg.key+'='+arg.value+' ';
            buildArgs[arg.key] = arg.value;
            if (arg.image)
                buildTags.push(arg.image+'-'+arg.value);
            if (arg.repository)
                buildTags.push(arg.repository+'-'+arg.value);
        });
        fixed.forEach((fix) => {
            command += '--build-arg '+fix.key+'='+fix.value+' ';
            buildArgs[fix.key] = fix.value;
        });
        command += buildTag;
        command += buildTags.join('-');
        commands.push({
            'command': command,
            'args': buildArgs,
            'tag': repository.author+'/'+repository.repository+':'+buildTags.join('-'),
        });
    });

    // Save builds to database
    for (const command of commands) {
        const build = await Build.findOne({command: command.command});
        if (!build) {
            let build = new Build({
                command: command.command,
                tag: command.tag,
                buildArgs: command.args,
                repositoryBranch: repository.branchTarget,
                repositoryCommit: commit,
                repositoryId: repository._id,
            });
            await build.validate();
            await build.save();
        }
    }

    // Start docker build
    const dockerHosts = (await Host.find()).map((host) => {
        return (host.ca && host.cert && host.key) ? new Docker({
            protocol: 'https',
            socketPath: void 0,
            host: host.url.split(':')[0],
            port: host.url.split(':')[1],
            ca: fs.readFileSync(config.uploadPath+host.ca),
            cert: fs.readFileSync(config.uploadPath+host.cert),
            key: fs.readFileSync(config.uploadPath+host.key),
        }): new Docker({
            socketPath: host.url,
        });
    });

    repository = await Repository.findOne({_id: req.params.repositoryId}).populate('builds');
    for (let build of repository.builds) {
        let index = Math.floor(Math.random() * Math.floor(dockerHosts.length));
        Object.assign(build, {
            'state': 'running',
        });
        await build.save();
        const pack = tarfs.pack(config.buildPath+repository.id);
        await dockerHosts[index]
        .buildImage(pack, {
            't': build.tag,
            'buildargs': build.buildArgs,
        }, async (err, stream) => {
            if (null != err) console.error(err);
            await dockerHosts[index].modem.followProgress(stream, async (err, output) => {
                Object.assign(build, {
                    'state': null == err ? 'success' : 'failed',
                });
                await build.save();
            }, (event) => {
                if (null !== event)
                    build.logs.push(event.stream);
            });
        });

        // Push images
        const image = await dockerHosts[index].getImage(build.tag);
        await image.push({
            authconfig: {
                auth: '',
                email: config.dockerAuthEmail,
                password: config.dockerAuthPassword,
                serveraddress: config.dockerAuthServer,
                username: config.dockerAuthUsername,
            },
            tag: build.tag.split,
        }, async (err, stream) => {
            if (null != err) console.error(err);
            await dockerHosts[index].modem.followProgress(stream, async (err, output) => {
                Object.assign(build, {
                    'state': null == err ? 'pushed' : build.state,
                });
                await build.save();
            }, (event) => {
                if (null !== event)
                    build.logs.push(event.stream);
            });
        });
    }

    repository = await Repository.findOne({_id: req.params.repositoryId}).populate('builds');
    res.status(200);
    res.send(repository.builds.map(build => build.serialized()));
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
    res.send(build.serialized());
});

module.exports = router;
