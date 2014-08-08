var async = require('async');
var mathUtils = require("./MathUtils");
var _ = require('underscore');

module.exports = {

  findByFacebookId: function(id, fn){
    User.findOne({
      facebook_id: Number(id)
    }).done(function (err, user) {
      if (err) {
        return fn(err, null, cb);
      } else {
        return fn(null, user, cb);
      }
    });
  },

  addOrUpdateFacebookUser: function(profile, cb){
    User.findOneByFacebook_id(Number(profile.id)).done(function(err, user){
      if (err) return console.log(err);
      if (!user){
        User.create({
          facebook_id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          name: profile.name,
          gender: profile.gender,
          fb_profile_url: profile.link,
          verified: profile.verified
        }).done(cb);
      } else {
        user.email = profile.email;
        user.first_name = profile.first_name;
        user.last_name = profile.last_name;
        user.name = profile.name;
        user.gender = profile.gender;
        user.fb_profile_url = profile.link;
        user.verified = profile.verified;
        user.save(function(err){return cb(err, user);});
      }
    });
  },

  calculateScore: calculateScore,

  includeCorrelationScore: includeCorrelationScore,

  getUsersByFacebookIds: function(current_user_id, facebook_ids, cb){
    User.find().where({facebook_id: facebook_ids})
      .done(function (err, users) {
        users = _.map(users, function(user){ user["current_user_id"] = current_user_id; return user; });
        async.each(users, includeCorrelationScore, function(){ cb(users);});
      });
  },

  getMatches: function(current_user_id, cb){
    User.find()
      .done(function(err, users){
        users = _.map(users, function(user){ user["current_user_id"] = current_user_id; return user; });
        async.each(users, includeCorrelationScore, function(){
          users = _.filter(users, function(user){ return user.match_score > 50 && user.id != current_user_id; });
          //console.dir(users);
          cb(users);
        });
    });
  },

  getCorrelatedUsers: function(current_user_id, cb){
    User.find()
      .done(function(err, users){
        users = _.map(users, function(user){ user["current_user_id"] = current_user_id; return user; });
        async.each(users, includeCorrelationScore, function(){
          users = _.filter(users, function(users){ return Math.abs(user.c_score) > .1 && user.id != current_user_id; });
          //console.dir(users);
          cb(users);
        });
      });
  }
}

function calculateScore(user, combined_ratings, cb){
  //console.dir(combined_ratings);
  var grouped = _.values(_.groupBy(combined_ratings, 'movie_id'));

  var two_ratings = _.compact(_.map(grouped, function(group){
    return group.length == 2 ? _.pluck(group, "rating") : false }));

  if (two_ratings.length == 0) {
    //user["c_score"] = 0; //they haven't rated any of the same movies
    user["match_score"] = 0;
    //user ["avg_diff"] = -1;
    return cb();
  }

  //console.dir(two_ratings);

  var first_array = _.map(two_ratings, function(ratings){return ratings[0];});
  var second_array = _.map(two_ratings, function(ratings){ return ratings[1];});

  //var c_score = mathUtils.getPopulationCorrelation(first_array, second_array);
  var mean_diff = mathUtils.getAverageDifference(first_array, second_array);
  var diff_array = mathUtils.getDifferences(first_array, second_array);
  var std_dev = mathUtils.getStandardDeviation(diff_array, mean_diff);
  var margin_of_error = mathUtils.getMarginOfError(std_dev, diff_array.length);

  var match_score = mathUtils.getMatchPercent(mean_diff, margin_of_error);
  //if (isNaN(c_score)) c_score = null;

  user["c_score"] = c_score ? c_score.toFixed(2) : null; //between -1 and 1, for calculations
  user["avg_diff"] = mean_diff;

  //var correlationValue = 25 + (25 * (c_score || 0)); // from 0 to 50
  //var scoreSimilarityValue = Math.max(0, 50 - (50 / (2 * first_array.length) + 5.6 * (avg_diff)));


  user["match_score"] = match_score;

  return cb();
}

function includeCorrelationScore(user, cb){
  var user_a_id = user.current_user_id;
  var user_b_id = user.id;
  MovieUserRating.find().where({user_id: [user_a_id, user_b_id]})
    .sort("movie_id")
    .done(function(err, combined_ratings){ calculateScore(user, combined_ratings, cb); });
}
