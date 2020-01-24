'use strict';

const express = require('express');
const fs = require('fs');
const httpError = require('http-errors');
const yaml = require('yaml');
const axios = require('axios');
const git = require('simple-git/promise');
const gitRev = require('git-rev-sync');
const Docker = require('dockerode');
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

    let tags = {};
    await axios({
        method: 'get',
        url: 'http://'+config.apiHost+':'+config.apiPort+config.apiPath+'docker',
        params: {
            'author': tagsConf.author ? tagsConf.author : void 0,
            'image': tagsConf.image,
            'domain': tagsConf.domain ? tagsConf.domain : void 0,
            // 'offset': tagsConf.offset ? tagsConf.offset : void 0,
            'offset': repository.builds.length,
            // 'limit': tagsConf.limit ? tagsConf.limit : void 0,
            // 'offset': '0',
            'limit': '3',
        },
    })
    .then(response => tags = {'key': tagsConf.key, 'values': response.data.tags, 'image': tagsConf.image});

    let releases = [];
    for (const release of releasesConf) {
        await axios({
            method: 'get',
            url: 'http://'+config.apiHost+':'+config.apiPort+config.apiPath+'git',
            params: {
                'author': release.author ? release.author : void 0,
                'repository': release.repository,
                'domain': release.domain ? release.domain : void 0,
                // 'offset': release.offset ? release.offset : void 0,
                'offset': repository.builds.length,
                // 'limit': release.limit ? release.limit : void 0,
                // 'offset': '0',
                'limit': '3',
            },
        })
        .then(response => {
            if (response.data.releases) {
                const releaseArg = {
                    'key': release.key,
                    'values': [],
                    'repository': release.repository
                };
                response.data.releases.forEach((tag) => {
                    releaseArg.values.push(tag);
                });
                releases.push(releaseArg);
            }
        });
    }

    let fixed = [];
    fixedConf.forEach((arg) => {
        fixed.push({'key': arg.key, 'value': arg.value, 'tagKey': arg.tag_key});
    });

    // Create docker build commands
    // @TODO this is wrong I need to work on that, mutliple dependency won't work, skipping from tag either
    // https://www.geeksforgeeks.org/combinations-from-n-arrays-picking-one-element-from-each-array/
    // Python code:
    console.log(tags);
    console.log(releases);
    console.log(fixed);
    // def print1(arr):
    //
    //     # number of arrays
    //     n = len(arr)
    //
    //     # to keep track of next element
    //     # in each of the n arrays
    //     indices = [0 for i in range(n)]
    //
    //     while (1):
    //
    //         # prcurrent combination
    //         for i in range(n):
    //             print(arr[i][indices[i]], end = " ")
    //         print()
    //
    //         # find the rightmost array that has more
    //         # elements left after the current element
    //         # in that array
    //         next = n - 1
    //         while (next >= 0 and
    //               (indices[next] + 1 >= len(arr[next]))):
    //             next-=1
    //
    //         # no such array is found so no more
    //         # combinations left
    //         if (next < 0):
    //             return
    //
    //         # if found move to next element in that
    //         # array
    //         indices[next] += 1
    //
    //         # for all arrays to the right of this
    //         # array current index again points to
    //         # first element
    //         for i in range(next + 1, n):
    //             indices[i] = 0

    let commands = [];
    // tags.values.forEach((tag) => {
    //     const tagArg = '--build-arg '+tagsConf.key+'='+tag;
    //     const tagTag = tagsConf.image+'-'+tag;
    //     releases.forEach((release) => {
    //         const releaseArg = '--build-arg '+release.key+'='+release.value;
    //         const releaseTag = release.repository+'-'+release.value;
    //         fixed.forEach((fix) => {
    //             const fixedArg = '--build-arg '+fix.key+'='+fix.value;
    //             let command = tagArg+' '+releaseArg+' '+fixedArg+' -t '+repository.author+'/'+repository.repository+':'+tagTag+'-'+releaseTag;
    //             commands.push(command+' .');
    //         });
    //     });
    // });

    // Save builds to database
    for (const command of commands) {
        let build = new Build({
            command: command,
            repositoryBranch: repository.branchTarget,
            repositoryCommit: commit,
            repositoryId: repository._id,
        });
        await build.validate();
        await build.save();
    }
    repository = await Repository.findOne({_id: req.params.repositoryId}).populate('builds');

    // // Start docker build
    // const dockerHosts = (await Host.find()).map((host) => {
    //     return (host.ca && host.cert && host.key) ? new Docker({
    //         protocol: 'https',
    //         socketPath: void 0,
    //         host: host.url.split(':')[0],
    //         port: host.url.split(':')[1],
    //         ca: fs.readFileSync(config.uploadPath+host.ca),
    //         cert: fs.readFileSync(config.uploadPath+host.cert),
    //         key: fs.readFileSync(config.uploadPath+host.key),
    //     }): new Docker({
    //         socketPath: host.url,
    //     });
    // });

    // // How to distribute accross docker hosts, all commands ?
    // // DEBUG
    // dockerHosts.forEach((host) => {
    //     host.listContainers()
    //     .then(data => {
    //         data.forEach((container) => {
    //             console.log(container.Names[0]);
    //         });
    //     })
    // });

    // Save builds to database
    // Push images
    // Hydrate builds property

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
