const _ = require('underscore');


// Create a copy of the production.json environments file and fill with the appropriate values.
module.exports = _.extend(require('./environments/local.json'));