/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  schema: true,

  attributes: {

    facebook_id: {
      type: 'integer',
      required: true,
      unique: true
    },

    fb_profile_url: {
      type: 'string'
    },

    first_name: {
      type: 'string'
    },

    last_name: {
      type: 'string'
    },

    name: {
      type: 'string'
    },

  	email: {
      type: 'string',
      email: true,
      unique: true
    },

    gender: {
      type: 'string'
    },

    online: {
      type: 'boolean',
      defaultsTo: false
    },

    admin: {
      type: 'boolean',
      defaultsTo: false
    },

    verified: {
      type: 'boolean',
      defaultsTo: false
    },

    profile_pic_url: {
      type: 'string'
    },

    encrypted_password: {
      type: 'string'
    }
  },

  beforeValidation: function(values, next){

    if (typeof values.verified !== 'boolean'){
      values.verified = values.verified == 'true';
    }

    next();
  }
}
