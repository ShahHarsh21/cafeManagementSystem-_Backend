const e = require('express');

require('dotenv').config();

function checkRole(req, res, next) {
    if (role.locals.role == process.env.USER) {
        return res.sendStstus(401);
    } else {
        next();
    }
}

module.exports = { checkRole: checkRole }