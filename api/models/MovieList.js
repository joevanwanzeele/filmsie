/**
 * MovieList
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

  	user_id: 'string',

    name: {type: 'string', unique: true },

    movie_ids: 'array',

    is_public: {type: 'boolean', defaultsTo: true }
  }
};
