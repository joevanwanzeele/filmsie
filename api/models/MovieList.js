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

    name: {type: 'string' },

    movie_ids: 'array',

    is_public: {type: 'boolean', defaultsTo: true }
  },

  beforeValidation: function(values, next){

    if (typeof values.is_public !== 'boolean'){
      values.is_public = values.is_public == 'true';
    }

    next();
  },
};
