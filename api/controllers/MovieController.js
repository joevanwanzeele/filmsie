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
      res.view({profile_pic_url: "/img/not-found.png"});
    }
  },

  search: function(req, res){
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);
    if (!req.body.q)
    {
      rotten.listDvdsCurrentReleases({page_limit: req.body.page_limit, page: req.body.page, q: req.body.q }, function(err,response){
       if (err) console.log(err);
       //console.dir(response);
       //link up user reviews (if user is logged in)
       var userId = req.session.user ? req.session.user.id : null;
       if (!userId) return res.json(response);

       var ids = _.map(response.movies, function(item){ return item.id });

       MovieUserRating.find()
        .where({rottenTomatoesId: ids, userId: req.session.user.id })
        .exec(function (err, ratings) {
            _.each(ratings, function(rating){
              var found = _.findWhere(response.movies, {id: rating.rottenTomatoesId});
              found["currentUserRating"] = rating.rating;
          });
          res.json(response);
        });
      });

    } else {
      rotten.movieSearch({page_limit: req.body.page_limit, page: req.body.page, q: req.body.q }, function(err,response){
       if (err) console.log(err);
       //console.dir(response);
       //link up user reviews (if user is logged in)
       var userId = req.session.user ? req.session.user.id : null;
       if (!userId) return res.json(response);

       var ids = _.map(response.movies, function(item){ return item.id });

       MovieUserRating.find()
        .where({rottenTomatoesId: ids, userId: req.session.user.id })
        .exec(function (err, ratings) {
            _.each(ratings, function(rating){
              var found = _.findWhere(response.movies, {id: rating.rottenTomatoesId});
              found["currentUserRating"] = rating.rating;
          });
          res.json(response);
        });
      });
    }
  },

  rate: function(req, res){
    var userId = req.session.user.id;
    var movieId = req.body.id;
    var rottenTomatoesId = req.body.rottenTomatoesId;
    var imdbId = req.body.imdbId;
    var rating = Number(req.body.rating);

    MovieUserRating.findOne({rottenTomatoesId: rottenTomatoesId, userId: userId })
      .done(function(err, existing) {
        if (err) return console.log(err);
        if (existing) {
          MovieUserRating.update(existing.id, {rating: rating }).done(function(err, existing){
            if (err) return console.log(err);
            return console.log(existing);
          });
        } else {
          MovieUserRating.create({ userId: userId,
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
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);

    rotten.movieGet({ id:req.body.rottenId }, function(err,response){
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
