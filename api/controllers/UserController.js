/**
 * UserController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var userHelper = require("../services/UserHelper");
var graph = require('fbgraph');

module.exports = {

  logIn: function (req, res) {
    userHelper.addOrUpdateUser(req.body, function(err, user){
      req.session.user = user;
      req.session.authenticated = true;
      res.json(user);
    });
  },

  dashboard: function (req, res) {
    res.view();
  },

  logout: function (req, res){
    req.session.user = null;
    req.session.authenticated = false;
    req.session.flash = 'You have logged out';
    res.redirect('/');
  },

  facebookFriends: function(req, res, next){
    graph.setAccessToken(req.session.user.facebookAccessToken);
    //graph.setAppSecret(sails.config.facebook.client_secret);
    graph.get(req.session.user.facebookId + "/friends?fields=name,picture", function(err, response) {
      res.json(response.data);
    });
  },

  'facebook': function (req, res, next) {
     passport.authenticate('facebook', { scope: ['email', 'user_about_me', 'user_friends']},
          function (err, user) {
            req.logIn(user, function (err) {
            if(err) {
                req.session.flash = 'There was an error';
                res.redirect('/');
            } else {
                req.session.user = user;
                req.session.authenticated = true;
                res.redirect('/');
            }
        });
    })(req, res, next);
  },

  'facebook/callback': function (req, res, next) {
     passport.authenticate('facebook',
        function (req, res) {
            res.redirect('/');
        })(req, res, next);
  },

  privacy: function(req, res, next){
    return res.view('privacy', { layout: null });
  }

};
