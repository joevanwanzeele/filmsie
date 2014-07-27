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
var reviewHelper = require("../services/ReviewHelper");

module.exports = {

  add: function(req, res){
    var user_id = req.session.user.id;
    var ui_movie = req.body.movie;
    var review_content = req.body.review_content;

    movieHelper.addOrUpdateMovie(ui_movie, function(err, movie){
      Review.findOne({user_id: user_id, movie_id: movie.id})
      .done(function(err, review){
        if (review){
          return res.json('you\'ve already reviewed this movie.'); //user has an existing review already.. they should delete it first
        }
        else {
          Review.create({
            user_id: user_id,
            movie_id: movie.id,
            content: review_content
          }).done(function(err, review){
            if (err) return console.log(err);
              ReviewVote.create({user_id: review.user_id, review_id: review.id, vote: "up"})
              .done(function(err, reviewVote){
                review["up_votes"] = 1;
                review["down_votes"] = 0;
                review["current_user_vote"] = "up";
                reviewHelper.includeReviewerRatings([review], function(err){
                  if (err) return console.log(err);
                  reviewHelper.includeReviewerProfileInfo([review], function(err){
                    if (err) return console.log(err);
                    Review.find({movie_id: movie.id}).done(function(err, reviews){
                      return res.json({review_count: reviews.length, review: review})
                    });
                  });
                });
              });
          });
        }
      });
    });
  },

  delete: function(req, res, next){

    var review_id = req.body.review_id;
    var user_id = req.session.user.id;

    Review.findOne({id: review_id, user_id: user_id}).done(function(err, review){
      if (err) return console.log(err);
      if (!review) return res.json("review not found or not owner");

      ReviewVote.destroy({review_id: review_id}).done(function(err){
        if (err) return console.log(err);
        review.destroy(function(){
          return res.json("deleted");
        });
      });
    });
  },

  vote: function(req, res){
    var direction = req.body.direction;
    var user_id = req.session.user.id;

    var review_id = req.body.review_id;

    if (direction == "none"){
      ReviewVote.destroy({review_id: review_id, user_id: user_id}).done(function(err){
        if (err) return console.log(err);
        ReviewVote.find({review_id: review_id}).done(function(err, votes){
          var counts = _.countBy(votes, function(vote){ return vote.vote == "up" ? "up" : "down"});

          return res.json({
            vote: "deleted",
            up_votes: counts.up || 0,
            down_votes: counts.down || 0
          });
        });
      });
    }

    else {
      if (direction != "up" && direction != "down" ) return res.json("invalid vote direction");

      ReviewVote.findOne({review_id: review_id, user_id: user_id})
        .done(function(err, vote){
          if (err) return console.log(err);
          if (!vote){
            ReviewVote.create({review_id: review_id, user_id: user_id, vote: direction})
              .done(function(err, new_vote){
                if (err) console.log(err);
                ReviewVote.find({review_id: review_id}).done(function(err, votes){
                  var counts = _.countBy(votes, function(vote){ return vote.vote == "up" ? "up" : "down"});
                  new_vote["up_votes"] = counts.up || 0;
                  new_vote["down_votes"] = counts.down || 0;
                  res.json(new_vote);
                });
            });
          } else {
            vote.vote = direction;
            vote.save(function(err){
              if (err) return console.log(err);
              ReviewVote.find({review_id: review_id}).done(function(err, votes){
                var counts = _.countBy(votes, function(vote){ return vote.vote == "up" ? "up" : "down"});
                vote["up_votes"] = counts.up || 0;
                vote["down_votes"] = counts.down || 0;
                return res.json(vote);
              });
            });
          }
        });
      }
  },

  get: function(req, res){

    var movie_id = req.body.movie_id;
    var user_id = req.session.user.id;
    if (!movie_id){ //there are no reviews
      return res.json([]);
    }

    Review.find({movie_id: movie_id}).done(function(err, reviews){
      reviewHelper.includeVoteTally(reviews, user_id, function(err){
        if (err) return console.log(err);
        reviewHelper.includeReviewerRatings(reviews, function(err){
            if (err) return console.log(err);
            reviewHelper.includeReviewerProfileInfo(reviews, function(err){
              if (err) return console.log(err);
              res.json(reviews);
            });
          });
        });
    });
  },

  getReviewsForUser: function(req, res){
    var user_id = req.body.user_id;
    var current_user_id = req.session.user.id;

    Review.find({user_id: user_id}).done(function(err, reviews){
      reviewHelper.includeVoteTally(reviews, current_user_id, function(err){
        if (err) return console.log(err);
        reviewHelper.includeReviewerRatings(reviews, function(err){
            if (err) return console.log(err);
            reviewHelper.includeReviewerProfileInfo(reviews, function(err){
              if (err) return console.log(err);
              reviewHelper.includeMovieInfo(reviews, function(err){
                if (err) return console.log(err);
                res.json(reviews);
              });
            });
          });
        });
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ReviewsController)
   */
  _config: {}


};
