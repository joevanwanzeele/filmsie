/**
 * Session
 *
 * Sails session integration leans heavily on the great work already done by Express, but also unifies
 * Socket.io with the Connect session store. It uses Connect's cookie parser to normalize configuration
 * differences between Express and Socket.io and hooks into Sails' middleware interpreter to allow you
 * to access and auto-save to `req.session` with Socket.io the same way you would with Express.
 *
 * For more information on configuring the session, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.session = {

  // Session secret is automatically generated when your new app is created
  // Replace at your own risk in production-- you will invalidate the cookies of your users,
  // forcing them to log in again.
  secret: '7002e754f59a0b64df83f8b8455b0a00',


  // In production, uncomment the following lines to set up a shared redis session store
  // that can be shared across multiple Sails.js servers
  //adapter: 'redis',
  //
  // The following values are optional, if no options are set a redis instance running
  // on localhost is expected.
  // Read more about options at: https://github.com/visionmedia/connect-redis
  //
  //
  // host: process.env.REDIS_HOST || 'localhost',
  // port: 6379,
  // ttl: 60000,
  // db: 0,
  // pass: process.env.REDIS_PSSWD || '',
  // prefix: 'sess:'

  // host: 'redis-logicbomber-4088963654.redis.irstack.com',
  // port: 6379,
  // ttl: 60000,
  // db: 0,
  // pass: 'redis-logicbomber-4088963654.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4',

  //url: 'redis://nodejitsu:redis-logicbomber-4088963654.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4@redis-logicbomber-4088963654.redis.irstack.com:6379'

  // Uncomment the following lines to use your Mongo adapter as a session store
  adapter: 'mongo',
  //
  host: 'troup.mongohq.com',
  port: '10048',
  db: 'nodejitsudb8249523199',
  collection: 'sessions',
  username: 'nodejitsu',
  ttl: 60000,
  password: process.env.MONGO_PSSWD,
  stringify: true,
  auto_reconnect: true

  // Optional Values:
  //
  // # Note: url will override other connection settings
  // url: 'mongodb://user:pass@host:port/database/collection',
  //
  // username: '',
  // password: '',
  // auto_reconnect: false,
  // ssl: false,
  // stringify: true

};
