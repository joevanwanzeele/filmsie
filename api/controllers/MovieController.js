/**
 * MovieController
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

var graph = require('fbgraph');

module.exports = {

  index: function(req, res){
    if (req.session.user){
      graph.setAccessToken(req.session.user.facebookAccessToken);
      graph.get(req.session.user.facebookId + "?fields=picture", function(err, response) {
        res.view({profile_pic_url: response.picture.data.url});
      });
    }
    else{
      res.view({profile_pic_url: "/img/not-found.png"});  //image doesn't exist yet
    }
  },

  getConfigSettings: function(req, res){
    var tmdb = require('tmdbv3').init(sails.config.mdbApi.api_key);
    tmdb.configuration(function(err, response){
      res.json(response);
    });
  },

  genres: function(req, res){
    var tmdb = require('tmdbv3').init(sails.config.mdbApi.api_key);
    tmdb.genre.list(function(err, response){
      res.json(response);
    });
  },

  search: function(req, response){ //use internet movie db api
    var tmdb = require('tmdbv3').init(sails.config.mdbApi.api_key);

    if (!req.body.q)
    {
      tmdb.misc.nowPlaying(Number(req.body.page), function(err,res) {
        //link up user reviews (if user is logged in)

        var userId = req.session.user ? req.session.user.id : null;
        //console.log(res);

        if (!userId) return response.json(res);

        var ids = _.map(res.results, function(item){ return item.id });

        MovieUserRating.find()
        .where({movieDbId: ids, userId: req.session.user.id })
         .exec(function (err, ratings) {
             _.each(ratings, function(rating){
               var found = _.findWhere(res.results, {id: rating.movieDbId});
               found["currentUserRating"] = rating.rating;
           });
           response.json(res);
         });
       });
    } else {
      tmdb.search.movie(req.body.q, Number(req.body.page), function(err,res){
       if (err) console.log(err);
       //console.dir(response);
       //link up user reviews (if user is logged in)
       var userId = req.session.user ? req.session.user.id : null;
       if (!userId) return response.json(res);

       var ids = _.map(res.results, function(item){ return item.id });
       MovieUserRating.find()
        .where({movieDbId: ids, userId: req.session.user.id })
        .exec(function (err, ratings) {
            _.each(ratings, function(rating){
              var found = _.findWhere(res.results, {id: rating.movieDbId});
              found["currentUserRating"] = rating.rating;
          });
          return response.json(res);
        });
      });
    }
  },

  rate: function(req, res){
    var userId = req.session.user.id;
    var movieId = req.body.id;
    var movieDbId = req.body.movieDbId;
    var rottenTomatoesId = req.body.rottenTomatoesId;
    var imdbId = req.body.imdbId;
    var rating = Number(req.body.rating);

    MovieUserRating.findOne({movieDbId: movieDbId, userId: userId })
      .done(function(err, existing) {
        if (err) return console.log(err);
        if (existing) {
          MovieUserRating.update(existing.id, {rating: rating }).done(function(err, existing){
            if (err) return console.log(err);
          });
        } else {
          MovieUserRating.create({ userId: userId,
                                   movieDbId: movieDbId,
                                   rottenTomatoesId: rottenTomatoesId,
                                   imdbId: imdbId,
                                   rating: rating })
                                   .done(function(err, rating) {
                                    if (err) {
                                      return console.log(err);
                                    }else {
                                      return console.log(rating);
                                    }});
        }
    });
  },

  details: function(req, res){
    var tmdb = require('tmdbv3').init(sails.config.mdbApi.api_key);
    tmdb.movie.info(req.body.movieDbId, function(err, response){
      if (err) console.log(err);
      res.json(response);
    });
  },

  /*
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieController)
   */
  _config: {}


};
