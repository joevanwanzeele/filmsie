/**
 * Movie
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

schema: true,

attributes: {

    title: { type: 'string', required: true },

    imageUrl: { type: 'string', required: false },

    bigImageUrl: { type: 'string', required: false },

    rottenTomatoesId: { type: 'string', required: false },

    movieDbId: { type: 'integer', required: false }
  }
};
