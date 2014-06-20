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

  movieId: {
    type: 'string',
    required: false
  },

  rottenTomatoesId: {
    type: 'string',
    required: true
  },

  imdbId: {
    type: 'string',
    required: false
  },

  userId: {
    type: 'string',
    required: true
  },

  rating: {
    type: 'integer',
    required: true
  }
  }
};
