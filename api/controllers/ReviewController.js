/**
 * ReviewsController
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

  add: function(req, res){
    var user_id = req.body.user_id;
    var ui_movie = req.body.movie;
    var review_content = req.body.review_content;

    movieHelper.addOrUpdateMovie(ui_movie, function(err, movie){
      Review.create({
        user_id: user_id,
        movie_id: movie.id,
        content: review_content
      }).done(function(err, review){
        if (err) return console.log(err);
          return res.json(review);
      });
    });
  },

  delete: function(req, res){},

  vote: function(req, res){
    var direction = req.body.direction;
    var user_id = req.body.user_id;
    var movie_id = req.body.movie_id;

    if (!direction){
      ReviewVote.destroy({movie_id: movie_id, user_id: user_id}).done(function(err){
        if (err) return console.log(err);
        return res.json("deleted");
      })
    }

    ReviewVote.find({movie_id: movie_id, user_id: user_id})
      .done(function(vote){
        if (!vote){
          ReviewVote.create({movie_id: movie_id, user_id: user_id, direction: direction})
            .done(function(err, new_vote){
              res.json(new_vote);
          });
        } else {
          vote.direction = direction;
          vote.save(function(err){
            if (err) return console.log(err);
            return res.json(vote);
          });
        }
      });
  },

  get: function(req, res){
    var movie_id = req.body.movie_id;
    if (!movie_id){ //there are no reviews
      return res.json([]);
    }

    Review.find({movie_id: movie_id}).done(function(err, reviews){
      if (err) return console.log(err);
      async.each(reviews, function(review, cb){
        //get the reviewers rating
        MovieUserRating.findOne({user_id: review.user_id, movie_id: review.movie_id })
          .done(function(err, user_rating){
            review["reviewer_rating"] = user_rating.rating;
            cb()
          });
      }, function(err){
          if (err) return console.log(err);

          async.each(reviews, function(review, cb){
            User.findOne(review.user_id, function(err, user){
              if (err) return console.log(err);
              review["reviewer_facebook_id"] = user.facebook_id;
              review["reviewer_name"] = user.name;
              review["reviewer_first_name"] = user.first_name;
              cb();
            });
          }, function(err){
            if (err) return console.log(err);
            res.json(reviews);
          });
        });
    });
  },

  getReviewsForUser: function(req, res){},

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ReviewsController)
   */
  _config: {}


};
