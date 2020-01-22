'use strict';

const httpError = require('http-errors');

async function serverError(res, error) {
    res.status(500);
    res.send({
        message: 'Internal Server Error',
    });
    throw httpError('500', error);
};

module.exports = serverError;
