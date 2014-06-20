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
    var picture;
    if (req.session.user){
      graph.setAccessToken(req.session.user.facebookAccessToken);
      graph.get(req.session.user.facebookId + "?fields=picture", function(err, response) {
        picture = response.picture.data.url; // { picture: 'http://profile.ak.fbcdn.net/'... }
      });
    }
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);

    rotten.listMoviesInTheaters({page_limit: 25, page: 1}, function(err,response){
	   if (err) console.log(err);
	   //console.dir(response);
     res.view({items: response.movies, profile_pic_url: picture});
    });
  },

  search: function(req, res){
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);
    if (!req.body.q)
    {
      rotten.listDvdsCurrentReleases({page_limit: req.body.page_limit, page: req.body.page, q: req.body.q }, function(err,response){
       if (err) console.log(err);
       //console.dir(response);
       //link up user reviews
       res.json(response);
      });

    } else {
      rotten.movieSearch({page_limit: req.body.page_limit, page: req.body.page, q: req.body.q }, function(err,response){
       if (err) console.log(err);
       //console.dir(response);
       //link up user reviews
       res.json(response);
      });
    }
  },

  details: function(req, res){
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);

    rotten.movieGet({ id:req.body.rottenId }, function(err,response){
	     if (err) console.log(err);
	     console.log(response);
       res.json(response);
    });
  },

  /*
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieController)
   */
  _config: {}


};
