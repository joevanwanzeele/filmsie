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

    review_id: {type: 'string', required: true},

    vote: {type: 'string', required: true} //add validation for vote to be either "up" or "down"
  }

};
