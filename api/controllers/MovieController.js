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
var movieHelper = require("../services/MovieHelper");

module.exports = {

  index: function(req, res){
      res.view({profile_pic_url: ""});  //image doesn't exist yet
  },

  getConfigSettings: function(req, res){
    var tmdb = require('moviedb')(sails.config.mdbApi.api_key);
    tmdb.configuration(function(err, response){
      res.json(response);
    });
  },

  genres: function(req, res){
    var tmdb = require('moviedb')(sails.config.mdbApi.api_key);
    tmdb.genreList(function(err, response){
      res.json(response);
    });
  },

  search: function(req, response){ //use internet movie db api
    var tmdb = require('moviedb')(sails.config.mdbApi.api_key);

    if (req.body.q){
      tmdb.searchMovie({
        query: req.body.q,
        year: req.body.year ? Number(req.body.year) : null,
        page: Number(req.body.page) },
        processMovieResults);
    }
    else if (req.body.year){
      var genres = req.body.genres ? req.body.genres.join('|') : null;
      tmdb.discoverMovie({ with_genres: genres,
                            primary_release_year: Number(req.body.year),
                            page: Number(req.body.page),
                            sort_by: 'popularity.desc'},
                            processMovieResults);
    } else if (req.body.genres){
      var genre = req.body.genres[0];
      tmdb.genreMovies({id: genre}, processMovieResults);
    } else tmdb.miscNowPlayingMovies({page: Number(req.body.page)}, processMovieResults);

    function processMovieResults(err,res) {
      _.each(res.results, function(movie){
        movie["tmdb_id"] = movie.id;
        movie.id = null;
      });
      var user_id = req.session.user ? req.session.user.id : null;
      if (!user_id) return response.json(res);
      //link up user reviews (if user is logged in)
      movieHelper.includeRatings(res.results, user_id, function(){ return response.json(res); });
    }

  },

  rate: function(req, res){
    if (!req.session.user) return;
    var user_id = req.session.user.id;
    var ui_movie = req.body.movie;
    var rating = Number(req.body.rating);

    movieHelper.addOrUpdateMovie(ui_movie, function(err, movie){
      MovieUserRating.findOne({
        tmdb_id: movie.tmdb_id,
        user_id: user_id })
        .done(function(err, existing) {
          if (err) return console.log(err);
          if (existing) {
            MovieUserRating.update(existing.id, {
              rating: rating,
              movie_id: movie.id
            }).done(function(err, existing){
              if (err) return console.log(err);
            });
          } else {
            MovieUserRating.create({ user_id: user_id,
                                     movie_id: movie.id,
                                     tmdb_id: movie.tmdb_id,
                                     rotten_tomatoes_id: movie.rotten_tomatoes_id,
                                     imdb_id: movie.imdb_id,
                                     rating: rating })
                                     .done(function(err, rating) {
                                      if (err) {
                                        return console.log(err);
                                      }else {
                                        return res.json(rating);
                                      }});
          }
      });
    });
  },

  details: function(req, res){
    var tmdb = require('moviedb')(sails.config.mdbApi.api_key);

    tmdb.movieInfo({id: req.body.tmdb_id}, function(err, response){
      if (err) {return console.log(err);}
      res.json(response);
    });
  },

  cast: function(req, res){
    var tmdb = require('moviedb')(sails.config.mdbApi.api_key);

    tmdb.movieCredits({id: req.body.tmdb_id}, function(err, response){
      if (err) {return console.log(err);}
      res.json(response.cast);
    });
  },

  /*
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieController)
   */
  _config: {}


};
