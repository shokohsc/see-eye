'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const buildSchema = new mongoose.Schema(
    {
        state: {
            type: String,
            required: true,
            enum: ['waiting', 'running', 'success', 'failed', 'pushed'],
            default: 'waiting',
        },
        logs: {
            type: [String],
            required: false,
        },
        command: {
            type: String,
            required: true,
        },
        tag: {
            type: String,
            required: true,
        },
        buildArgs: {
            type: Map,
            of: String,
            required: false,
        },
        repositoryBranch: {
            type: String,
            required: true,
            default: 'master'
        },
        repositoryCommit: {
            type: String,
            required: true,
        },
        repositoryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        toJSON: { virtuals: true, getters: true, versionKey: false },
        toObject: { virtuals: true, getters: true, versionKey: false },
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

buildSchema.plugin(mongoosePaginate);

buildSchema.methods.serialized = function serialized() {
    const build = this.toObject();

    return {
        id: build.id,
        state: build.state,
        logs: build.logs,
        command: build.command,
        tag: build.tag,
        buildArgs: JSON.stringify([...build.buildArgs]),
        repositoryBranch: build.repositoryBranch,
        repositoryCommit: build.repositoryCommit,
        repositoryId: build.repositoryId,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
    };
};

buildSchema.methods.logsLess = function logsLess() {
    const build = this.toObject();

    return {
        id: build.id,
        state: build.state,
        command: build.command,
        tag: build.tag,
        buildArgs: JSON.stringify([...build.buildArgs]),
        repositoryBranch: build.repositoryBranch,
        repositoryCommit: build.repositoryCommit,
        repositoryId: build.repositoryId,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
    };
};

module.exports = mongoose.model('Build', buildSchema);
