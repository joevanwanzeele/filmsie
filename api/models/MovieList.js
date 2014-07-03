/**
 * MovieList
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

  	userId: 'string',
    name: {type: 'string', unique: true },
    movieIds: 'array'

  }
};
