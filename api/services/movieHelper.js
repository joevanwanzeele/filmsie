var userHelper = require("./UserHelper");

module.exports = {

  addOrUpdateMovie: function(movie, cb) {
    Movie.findOneByTmdb_id(Number(movie.tmdb_id)).done(function(err, existing_movie) {
      if (err) return console.log(err);
      if (!existing_movie) {
        Movie.create({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date
        }).done(cb);
      } else {
        existing_movie.title = movie.title;
        existing_movie.poster_path = movie.poster_path;
        existing_movie.backdrop_path = movie.backdrop_path;
        existing_movie.release_date = existing_movie.release_date;
        existing_movie.save(function(err) {
          return cb(err, existing_movie);
        });
      }
    });
  },

  includeRatings: function(movies, user_id, callback) {
    var tmdb_ids = _.map(movies, function(movie) {
      return Number(movie.tmdb_id);
    });
    MovieUserRating.find()
      .where({
        tmdb_id: tmdb_ids
      })
      .exec(function(err, all_user_ratings) {
        _.each(tmdb_ids, function(tmdb_id) {
          var all_movie_ratings = _.where(all_user_ratings, {
            tmdb_id: tmdb_id
          });
          if (all_movie_ratings.length > 0) {
            var found = _.findWhere(movies, {
              tmdb_id: tmdb_id
            });

            if (found) {
              found["average_rating"] = _.reduce(all_movie_ratings, function(avg, movie_rating) {
                return avg + movie_rating.rating / all_movie_ratings.length;
              }, 0).toFixed(2); //include average review

              found["total_ratings"] = all_movie_ratings.length;
            }

            if (user_id) { //include current user reviews

              var user_rating = _.find(all_movie_ratings, function(movie_rating) {
                return movie_rating.user_id == user_id;
              });

              found["current_user_rating"] = user_rating && user_rating.rating;
            }
          }
        });
        return callback(movies);
      });
  },

  includeReviewCount: function(movies, callback) {
    async.each(movies, function(movie, cb) {
      Review.find({
        movie_id: movie.id
      }).done(function(err, movie_reviews) {
        if (err) return console.log(err);
        movie["review_count"] = movie_reviews && movie_reviews.length || 0;
        cb();
      });
    }, callback)
  },

  includeRecommendationScore: function(movies, user_id, callback) {
    userHelper.getCorrelatedUsers(user_id, function(matches) {
      async.each(movies, function(movie, cb) {
        MovieUserRating.find({
          movie_id: movie.id
        }).done(function(err, ratings) {
          if (err) return console.log(err);
          //get sum of rating * weight, and total weight.
          var weighted_ratings = _.map(ratings, function(rating) {
            //console.dir(rating);
            if (rating.user_id == user_id) return;

            var matched_user = _.find(matches, function(match) {
              return match.id == rating.user_id;
            });
            //console.dir(matched_user);
            if (matched_user) {
              var possible_rating = rating.rating + (matched_user.c_score * matched_user.avg_diff);
              return {
                rating: possible_rating,
                weight: matched_user.match_score
              };
            }
            // var weight =  matched_user ? (matched_user.c_score * matched_user.c_score) : 0; //weight is regardless of correlation direction
            // var possible_rating = matched_user && matched_user.c_score < 0 ? 11 - rating.rating : rating.rating; //if negative correlation, score is likely opposite
            // return {rating: possible_rating, weight: weight};

            return {};
          });
          weighted_ratings = _.compact(weighted_ratings);

          var total_weight = _.reduce(weighted_ratings, function(total, wr) {
            return total + wr.weight;
          }, 0);

          var total_ratings = _.reduce(weighted_ratings, function(total, wr) {
            return wr.rating * wr.weight;
          }, 0);

          //console.dir({total_ratings: total_ratings});
          //console.dir({total_weight: total_weight});

          movie["r_score"] = total_weight == 0 ? 0 : total_ratings / total_weight; //include average later..
          cb()
        });
      }, function() {
        callback(movies);
      });
    });
  }

}
