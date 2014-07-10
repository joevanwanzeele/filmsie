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

    release_date: { type: 'string', required: false },

    image_url: { type: 'string', required: false },

    big_image_url: { type: 'string', required: false },

    rotten_tomatoes_id: { type: 'string', required: false },

    tmdb_id: { type: 'integer', required: false }
  }
};
