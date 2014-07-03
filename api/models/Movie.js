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

    title: { type: 'string', required: false },

    thumbnailImageUrl: { type: 'string', required: false },

    rottenTomatoesId: { type: 'string', required: false },

    movieDbId: { type: 'string', required: false }
  }
};
