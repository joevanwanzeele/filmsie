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
var movieHelper = require("../services/movieHelper");

module.exports = {

  index: function(req, res, next){
    //console.dir(req.body);
    MovieList.find({userId: req.body.userId })
      .done(function(err, existing) {
        if (err) console.log(err);
        return res.json(existing.sort());
      });
  },

  add: function(req, res, next){
    //console.dir(req.body)
    //add the movie to the movie database if it's not there, then get the id
    movieHelper.addOrUpdateMovie(req.body.movie, function(movieId){
        MovieList.create({ userId: req.body.userId,
                           name: req.body.name,
                           movieIds: [movieId]})
                           .done(function(err, movieList) {
                            if (err) {
                              return console.log(err);
                            }else {
                              return res.json(movieList);
                            }});
    });
  },

  update: function(req, res, next){
    movieHelper.addOrUpdateMovie(req.body.movie, function(movieId){
        MovieList.findOne(req.body.listId, function(err, movieList){
          movieList.movieIds.push(movieId);
          movieList.save(function(err){
            if (err) return console.log(err);
            return res.json(movieList);
          });
        });
    });
  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieListController)
   */
  _config: {}


};
