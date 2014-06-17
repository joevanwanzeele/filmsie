/**
 * Global adapter config
 *
 * The `adapters` configuration object lets you create different global "saved settings"
 * that you can mix and match in your models.  The `default` option indicates which
 * "saved setting" should be used if a model doesn't have an adapter specified.
 *
 * Keep in mind that options you define directly in your model definitions
 * will override these settings.
 *
 * For more information on adapter configuration, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.adapters = {

  // If you leave the adapter config unspecified
  // in a model definition, 'default' will be used.
  'default': 'mongo',


  // MySQL is the world's most popular relational database.
  // Learn more: http://en.wikipedia.org/wiki/MySQL
  mongo: {
    module   : 'sails-mongo',
    host     : 'troup.mongohq.com',
    user     : 'nodejitsu',
    password : process.env.MONGO_PSSWD,
    database : 'nodejitsudb1741942826',
    port     : '10031',
    schema   : true
  }
};
