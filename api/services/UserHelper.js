var async = require('async');
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
    console.dir(current_user_id);
    User.find().where({facebook_id: facebook_ids})
      .done(function (err, users) {
        console.dir(current_user_id);
        users = _.map(users, function(user){ user["current_user_id"] = current_user_id; return user; });
        async.each(users, includeCorrelationScore, function(){ cb(users);});
      });
  },

  returnMin: function(array){
    _ = require("underscore");

    return _.min(array);
  }
}

function calculateScore(user, combined_ratings, cb){

  var grouped = _.values(_.groupBy(combined_ratings, 'movie_id'));
  console.dir(combined_ratings);
  var two_ratings = _.compact(_.map(grouped, function(group){
    return group.length == 2 ? _.pluck(group, "rating") : false }));

  if (two_ratings.length == 0) {
    user["c_score"] = -1; //they haven't rated any of the same movies
    return cb();
  }

  var getDifference = _.memoize(function(both_ratings){ return Math.abs(both_ratings[0] - both_ratings[1]) + 1; });
  var differences = _.map(two_ratings, getDifference);

  var score = two_ratings.length / _.reduce(differences, function(mem, val){ return mem + val});

  user["c_score"] = score.toFixed(2);
  return cb();
}

function includeCorrelationScore(user, cb){
  var user_a_id = user.current_user_id;
  var user_b_id = user.id;
  MovieUserRating.find().where({user_id: [user_a_id, user_b_id]})
    .sort("movie_id")
    .done(function(err, combined_ratings){ calculateScore(user, combined_ratings, cb); });
}
