/**
 * MovieUserRating
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

schema: true,

attributes: {

  movie_id: {
    type: 'string',
    required: false
  },

  rotten_tomatoes_id: {
    type: 'string',
    required: false
  },

  imdb_id: {
    type: 'string',
    required: false
  },

  tmdb_id: {
    type: 'integer',
    required: false
  },

  user_id: {
    type: 'string',
    required: true
  },

  rating: {
    type: 'integer',
    required: true
  }
  }
};
