/**
 * MovieListController
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

module.exports = {

  index: function(req, res, next){
    //console.dir(req.body);
    MovieList.find({user_id: req.body.user_id })
      .done(function(err, existing) {
        if (err) console.log(err);
        return res.json(existing.sort(function(a,b){return a.name > b.name;}));
      });
  },

  add: function(req, res, next){
    //console.dir(req.body)
    //add the movie to the movie database if it's not there, then get the id
    movieHelper.addOrUpdateMovie(req.body.movie, function(movie_id){
        MovieList.create({ user_id: req.body.user_id,
                           name: req.body.name,
                           movie_ids: [movie_id]})
                           .done(function(err, movie_list) {
                            if (err) {
                              return console.log(err);
                            }else {
                              return res.json(movie_list);
                            }});
    });
  },

  update: function(req, res, next){
    movieHelper.addOrUpdateMovie(req.body.movie, function(movie_id){
        MovieList.findOne(req.body.list_id, function(err, movie_list){
          movie_list.movie_ids.push(movie_id);
          movie_list.movie_ids = _.uniq(movie_list.movie_ids);
          movie_list.save(function(err){
            if (err) return console.log(err);
            return res.json(movie_list);
          });
        });
    });
  },

  getMoviesInList: function(req, res, next){
    var user_id = req.session.user.id;
    if (req.body.list_id){
      //get specific list
      MovieList.findOne({id: req.body.list_id })
        .done(function(err, list) {
          if (err) return console.log(err);
          Movie.find().where({ id: list.movie_ids }).exec(function(err, movies) {
            movieHelper.includeRatings(movies, user_id, function(movies_with_ratings){ return res.json(movies_with_ratings); });
          });
        });
    } else {
      //get all rated movies, ordered by rating (favorites)
      MovieUserRating.find({user_id: req.body.user_id})
        .done(function(err, user_ratings){
          if (err) return console.log(err);
          var sorted_ids = _.map(user_ratings.sort(function(a,b){ return a.rating - b.rating; }), function(rating){
            return rating.movie_id;
          });
          Movie.find().where({ id: sorted_ids }).exec(function(err, movies) {
            movieHelper.includeRatings(movies, user_id, function(movies_with_ratings){ return res.json(movies_with_ratings); });
          });
        });
    }
  },

  removeMovie: function(req, res, next){
    if (!req.body.list_id || !req.body.movie_id) return res.json(-1);

    MovieList.findOne({ id: req.body.list_id })
      .done(function(err, list){
        if (err) return console.log(err);
        list.movie_ids = _.without(list.movie_ids, req.body.movie_id);
        list.save(function(err){
          if (err) return console.log(err);
          return res.json(list.movie_ids);
        });
    });
  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieListController)
   */
  _config: {}


};
