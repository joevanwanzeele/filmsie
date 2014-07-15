/**
 * ReviewVote
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

  	user_id: {type: 'string', required: true},

    movie_id: {type: 'string', required: true},

    vote: {type: 'string', required: true}, 
  }

};
