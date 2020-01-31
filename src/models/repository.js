'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const repositorySchema = new mongoose.Schema(
    {
        author: {
            type: String,
            required: true,
        },
        repository: {
            type: String,
            required: true,
        },
        domain: {
            type: String,
            required: true,
            default: 'github.com'
        },
        connection: {
            type: String,
            required: true,
            enum: ['https', 'http', 'ssl'],
            default: 'https',
        },
        type: {
            type: String,
            required: true,
            enum: ['git'],
            default: 'git',
        },
        branchTarget: {
            type: String,
            required: true,
            default: 'master'
        },
    },
    {
        toJSON: { virtuals: true, getters: true, versionKey: false },
        toObject: { virtuals: true, getters: true, versionKey: false },
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

repositorySchema.plugin(mongoosePaginate);

repositorySchema.virtual('url').get(function() {
  if ('ssl' === this.connection) {
      return 'git@'+this.domain+':'+this.author+'/'+this.repository+'.git';
  }
  return this.connection+'://'+this.domain+'/'+this.author+'/'+this.repository+'.git';
});

repositorySchema.virtual('builds', {
    ref: 'Build',
    localField: '_id',
    foreignField: 'repositoryId',
    justOne: false, // set true for one-to-one relationship
});

repositorySchema.methods.serialized = function serialized() {
    const repository = this.toObject();

    return {
        id: repository.id,
        author: repository.author,
        repository: repository.repository,
        domain: repository.domain,
        connection: repository.connection,
        url: repository.url,
        type: repository.type,
        branchTarget: repository.branchTarget,
        buildsCount: repository.builds ? repository.builds.length : 0,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt,
    };
};

module.exports = mongoose.model('Repository', repositorySchema);
