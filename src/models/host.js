'use strict';

const mongoose = require('mongoose');
const hostSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            unique: true,
        },
        ca: {
            type: String,
            required: false,
        },
        cert: {
            type: String,
            required: false,
        },
        key: {
            type: String,
            required: false,
        },
    },
    {
        toJSON: { virtuals: true, getters: true, versionKey: false },
        toObject: { virtuals: true, getters: true, versionKey: false },
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);

hostSchema.methods.serialized = function serialized() {
    const host = this.toObject();

    return {
        id: host.id,
        url: host.url,
        createdAt: host.createdAt,
        updatedAt: host.updatedAt,
        ca: host.ca ? host.ca : void 0,
        cert: host.cert ? host.cert : void 0,
        key: host.key ? host.key : void 0,
    };
};

module.exports = mongoose.model('Host', hostSchema);
