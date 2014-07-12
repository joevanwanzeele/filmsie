/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var bcrypt = require('bcrypt');

module.exports = {

  schema: true,

  attributes: {

    facebook_id: {
      type: 'integer',
      required: true,
      unique: true
    },

    fb_profile_url: {
      type: 'string',
      required: false
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
      //required: true,
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

    profile_pic_url: {
      type: 'string'
    },

    encrypted_password: {
      type: 'string'
    }
  },

  beforeValidation: function(values, next){

    // if (typeof values.admin !== 'undefined'){
    //   if (values.admin === 'unchecked'){
    //     values.admin = false;
    //   }
    //   else if (values.admin[1] === 'on'){
    //     values.admin = true;
    //   }
    // }
    if (typeof values.verified !== 'boolean'){
      values.verified = values.verified == 'true';
    }

    next();
  },

  beforeCreate: function(user, next){

    // if (!values.password || values.password != values.confirmation){
    //   return next({err: ["Password doesn't match password confirmation."]});
    // }
    if (user.password != null)
    {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(values.password, salt, function(err, hash) {
          if (err) {
            console.log(err);
            next(err);
          }else{
            values.password = hash;
            next(null, user);
          }
        });
      });
    }
    else{ return next(null, user); }
  }
};
