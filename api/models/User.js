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

    firstName: {
      type: 'string'
    },

    lastName: {
      type: 'string'
    },

    userName: {
      type: 'string'
    },

  	email: {
      type: 'string',
      email: true,
      required: true,
      unique: true
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

    encryptedPassword: {
      type: 'string'
    }
  },

  beforeValidation: function(values, next){

    if (typeof values.admin !== 'undefined'){
      if (values.admin === 'unchecked'){
        values.admin = false;
      }
      else if (values.admin[1] === 'on'){
        values.admin = true;
      }
    }
    next();
  },

  beforeCreate: function(values, next){

    if (!values.password || values.password != values.confirmation){
      return next({err: ["Password doesn't match password confirmation."]});
    }

    require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword){
      if (err) return next(err);
      values.encryptedPassword = encryptedPassword;
      next();
    });
  }
};
