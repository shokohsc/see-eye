'use strict';

const mongoose = require('mongoose');
const hostSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            unique: true,
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

module.exports = mongoose.model('host', hostSchema);
