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

module.exports = {

  index: function(req, res){
    var rotten = require('rotten-tomatoes-api')(sails.config.rotten.api_key);

    rotten.listMoviesInTheaters({page_limit: 16, page: 1}, function(err,response){
	   if (err) console.log(err);
	   console.dir(response);
     res.view({items: response.movies});
    });
    //
    // mdb.configuration({}, function(err, response){
    //     var config = response;
    //     mdb.miscPopularMovies({}, function(err, response){
    //       var items = response.results;
    //       console.dir(items);
    //       res.view({items: items, config: config});
    //     });
    // });

  },

  /*
   * Overrides for the settings in `config/controllers.js`
   * (specific to MovieController)
   */
  _config: {}


};
