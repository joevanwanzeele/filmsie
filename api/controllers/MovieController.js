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

var movieHelper = require("../services/MovieHelper");
var userHelper = require("../services/UserHelper");

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

  search: function(req, res){ //use internet movie db api
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

    function processMovieResults(err, results) {
      _.each(results.results, function(movie){
        movie["tmdb_id"] = movie.id;
        Movie.findOne({tmdb_id: movie.id}).done(function(err, existing){
          movie.id = null;
          if (existing) movie.id = existing.id;
        });
      });
      var user_id = req.session.user ? req.session.user.id : null;

      //link up user reviews (if user is logged in)
      movieHelper.includeRatings(results.results, user_id, function(movies){
        movieHelper.includeReviewCount(results.results, function(err){
          if (err) return console.log(err);
          return res.json(results);
        });
      });
    } // /processMovieResults

  },

  recommended: function(req, res){
    if (!req.session.user) return res.redirect("/");

    var user_id = req.session.user.id;
    userHelper.getMatches(user_id, function(matches){
      MovieUserRating.find({user_id: user_id}).done(function(err, user_ratings){
        var rated_movie_ids = _.pluck(user_ratings, 'movie_id');
        //console.dir(rated_movie_ids);
        //have to do this hack until they fix the ability to filter by string id's
          Movie.find().exec(function(err, movies){
            movies = _.filter(movies, function(movie){ return _.indexOf(rated_movie_ids, movie.id) == -1; });
            movieHelper.includeRecommendationScore(movies, user_id, function(movies_with_recs){
              var reco_movies = _.filter(movies_with_recs, function(movie){ return movie.r_score > 0; });
              //console.dir(reco_movies);
              movieHelper.includeRatings(reco_movies, user_id, function(movies){
                movieHelper.includeReviewCount(reco_movies, function(err){
                  if (err) return console.log(err);
                  reco_movies = _.sortBy(reco_movies, "r_score").reverse();
                  return res.json({total_results: reco_movies.length, results: reco_movies});
                });
              });
            });
          });
      });
      //get movies, filter out ones user has reviewed
      // for each movie, determine r_score
      // r_score = (u.c_score * u.rating) / total u
    });
    //return res.json();
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
