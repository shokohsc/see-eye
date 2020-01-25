'use strict';

const gitRev = require('git-rev-sync');
const config = require('../../src/config');
const Build = require('../models/build');

async function createRepositoryBuilds(repository, commands) {

    const commit = await gitRev.long(config.buildPath+repository.id);
    const branch = await gitRev.branch(config.buildPath+repository.id);
    for (const command of commands) {
        const build = await Build.findOne({
            'command': command.command,
            'repositoryCommit': commit,
            $or: [
                {
                    'state': [
                        'waiting',
                        'running',
                        'success',
                        'pushed',
                    ],
                },
            ],
        });
        if (!build) {
            const build = new Build({
                command: command.command,
                tag: command.tag,
                buildArgs: command.args,
                repositoryBranch: branch,
                repositoryCommit: commit,
                repositoryId: repository._id,
            });
            await build.validate();
            await build.save();
        }
    }
};

module.exports = createRepositoryBuilds;
