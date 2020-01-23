'use strict';

const mongoose = require('mongoose');
const buildSchema = new mongoose.Schema(
    {
        state: {
            type: String,
            required: true,
            enum: ['waiting', 'running', 'success', 'failed'],
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
        repositoryBranch: {
            type: String,
            required: true,
            default: 'master'
        },
        repositoryCommit: {
            type: String,
            required: true,
        },
        repository: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository',
            required: true,
        },
    },
    {
        toJSON: { virtuals: true, getters: true, versionKey: false },
        toObject: { virtuals: true, getters: true, versionKey: false },
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

buildSchema.methods.serialized = function serialized() {
    const build = this.toObject();

    return {
        id: build.id,
        state: build.state,
        logs: build.logs,
        command: build.command,
        repositoryBranch: build.repositoryBranch,
        repositoryCommit: build.repositoryCommit,
        repository: build.repository.id,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
    };
};

module.exports = mongoose.model('build', buildSchema);
