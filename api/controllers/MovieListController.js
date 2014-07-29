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
    var user = req.session.user || null;
    if (!user) return res.json("must be logged in to view your movie lists");
    var user_id = user.id;

    //console.dir(req.body);
    MovieList.find({user_id: user_id })
      .done(function(err, existing) {
        if (err) console.log(err);
        return res.json(existing.sort(function(a,b){return a.name > b.name;}));
      });
  },

  add: function(req, res, next){
    var user = req.session.user || null;
    if (!user) return res.json("must be logged in to create a list");

    var user_id = user.id;
    var list_id = req.body.list_id;
    var movie_param = req.body.movie;
    var list_name = req.body.name;

    //add the movie to the movie database if it's not there, then get the id
    movieHelper.addOrUpdateMovie(movie_param, function(err, movie){
        MovieList.create({ user_id: user_id,
                           name: list_name,
                           movie_ids: [movie.id]})
                           .done(function(err, movie_list) {
                            if (err) {
                              return console.log(err);
                            }else {
                              return res.json(movie_list);
                            }});
    });
  },

  addMovie: function(req, res, next){
    var user = req.session.user || null;
    if (!user) return res.json("must be logged in to add a movie");

    var user_id = user.id;
    var list_id = req.body.list_id;

    movieHelper.addOrUpdateMovie(req.body.movie, function(err, movie){
        MovieList.findOne({id: list_id, user_id: user_id}, function(err, movie_list){
          if (err) return console.log(err);
          movie_list.movie_ids.push(movie.id);
          movie_list.movie_ids = _.uniq(movie_list.movie_ids);
          movie_list.save(function(err){
            if (err) return console.log(err);
            return res.json(movie_list);
          });
        });
    });
  },

  update: function(req, res, next){
    MovieList.findOne(req.body.list_id, function(err, movie_list){
      movie_list.name = req.body.name;
      movie_list.is_public = req.body.is_public;
      movie_list.save(function(err){
        if (err) return console.log(err);
        return res.json(movie_list);
      });
    });
  },

  delete: function(req, res, next){
    var list_id = req.body.list_id;
    var user_id = req.session.user && req.session.user.id || null;
    if (!user_id) return res.json("must be logged in to remove a list");

    //console.dir({list_id: list_id, user_id: user_id});

    MovieList.findOne({id: list_id, user_id: user_id}).done(function(err, movie_list){
      if (err) return console.log(err);
      if (!movie_list) return res.json("list not found or not owner");
      movie_list.destroy(function(){
        return res.json("deleted");
      });
    });
  },

  getList: function(req, res, next){
    var user_id = req.session.user && req.session.user.id || null;
    if (req.body.list_id){
      //get specific list
      MovieList.findOne({id: req.body.list_id })
        .done(function(err, list) {
          if (err) return console.log(err);
          if (!list) return res.json("list does not exist");
          Movie.find().where({ id: list.movie_ids }).exec(function(err, movies) {
            if (err) return console.log(err);
            movieHelper.includeRatings(movies, user_id, function(movies_with_ratings){
              return res.json({list: list, movies: movies_with_ratings});
            });
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
