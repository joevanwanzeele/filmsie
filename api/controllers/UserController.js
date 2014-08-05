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
var movieHelper = require("../services/MovieHelper");
var fbParser = require("fb-signed-parser");

module.exports = {

  login: function (req, res) {

    userHelper.addOrUpdateFacebookUser(req.body, function(err, user){
      if (user instanceof Array) user = user[0];
      req.session.user = user;
      req.session.authenticated = true;
      res.json(user);
    });
  },

  logout: function (req, res){

    req.session.user = null;
    req.session.authenticated = false;
    res.redirect('/');
  },

  deauthorize: function(req, res){

    var signed_request = req.param('signed_request');
    var data = fb_parser.parse(signed_request, sails.config.facebook.app_secret);
    var facebook_id = data.user_id;

    User.findOne({facebook_id: facebook_id})
      .done(function(err, user){
        if (err) console.log(err);
        user.fb_authorized = false;
        user.save();
      });
    console.log(data);
    return res.json("ok");
  },

  friends: function(req, res, next){

    var facebook_user_ids = _.map(req.body.data, function(fb_user){ return Number(fb_user.id); });

    var current_user_id = req.session.user.id;

    userHelper.getUsersByFacebookIds(current_user_id, facebook_user_ids,
      function(friends){
        res.json(friends.sort(function(a,b){ return b.match_score - a.match_score; }));
      });
  },

  matches: function(req, res, next){

    userHelper.getMatches(req.session.user.id,
      function(matches){
        res.json(matches.sort(function(a,b){ return b.match_score - a.match_score; }));
      });
  },

  get: function(req, res, next){

    var current_user_id = req.session.user.id;
    var user_id = req.body.id;
    User.findOne(user_id).done(function(err, user){
      if (err) return console.log(err);
      if (!user) return res.json("user not found");
      user['current_user_id'] = current_user_id;
      userHelper.includeCorrelationScore(user, function(){
        MovieUserRating.find({user_id: user.id}).done(function(err, ratings){
          if (err) return console.log(err);
          user['rating_count'] = ratings.length;
          Review.find({user_id: user.id}).done(function(err, reviews){
            if (err) return console.log(err);
            user['review_count'] = reviews.length;
            return res.json(user);
          });
        });
      });
    });
  },

  favorites: function(req, res, next){
    var current_user_id = req.session.user.id;
    var user_id = req.body.id;

    MovieUserRating.find()
      .where({user_id: user_id})
      .sort('rating desc')
      //.limit(20)
      .exec(function(err, ratings){
        if (err) return console.log(err);
        var movie_ids = _.pluck(ratings, 'movie_id');
        //console.log(movie_ids);
        Movie.find().where({id: movie_ids}).done(function(err, movies){
          //console.dir(movies);
          _.each(movies, function(movie){
            var rating = _.findWhere(ratings, {movie_id: movie.id });
            //console.dir(rating);
            movie['profile_user_rating'] = rating.rating;
          });
          movieHelper.includeReviewCount(movies, function(){
            movieHelper.includeRatings(movies, current_user_id, function(movies_with_ratings){
              return res.json(movies_with_ratings.sort(function(left,right){return right.profile_user_rating - left.profile_user_rating; }));
            });
          });
        });
      });
  },

  leastFavorites: function(req, res, next){
    var current_user_id = req.session.user.id;
    var user_id = req.body.id;

    MovieUserRating.find()
      .where({user_id: user_id})
      .sort('rating asc')
      //.limit(20)
      .exec(function(err, ratings){
        if (err) return console.log(err);
        var movie_ids = _.pluck(ratings, 'movie_id');
        //console.log(movie_ids);
        Movie.find().where({id: movie_ids}).done(function(err, movies){
          //console.dir(movies);
          _.each(movies, function(movie){
            var rating = _.findWhere(ratings, {movie_id: movie.id });
            //console.dir(rating);
            movie['profile_user_rating'] = rating.rating;
          });
          movieHelper.includeReviewCount(movies, function(){
            movieHelper.includeRatings(movies, current_user_id, function(movies_with_ratings){
              return res.json(movies_with_ratings.sort(function(left,right){return left.profile_user_rating - right.profile_user_rating; }));
            });
          });
        });
      });
  },

  privacy: function(req, res, next){
    return res.view('privacy', { layout: null });
  }

};
