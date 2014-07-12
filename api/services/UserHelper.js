var async = require('async');
var _ = require("underscore");
module.exports = {

  findByFacebookId: function(id, fn){
    User.findOne({
      facebook_id: id
    }).done(function (err, user) {
      if (err) {
        return fn(null, null);
      } else {
        return fn(null, user);
      }
    });
  },

  addOrUpdateFacebookUser: function(profile, cb){
    this.findByFacebookId(profile.id, function (err, user) {
      // Create a new User if it doesn't exist yet
      //console.dir(profile._json);
      if (!user) {
        User.create({
          facebook_id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          fb_profile_url: profile.link,
          gender: profile.gender,
          verified: profile.verified
        }).done(function (err, user) {
          if (user) {
            return cb(null, user, {
              message: 'Logged In Successfully'
            });
          } else {
            console.dir(err);
            return cb(err, null, {
              message: 'There was an error logging you in with Facebook'
            });
          }
        });

      // If there is already a user update and return it
      } else {
        User.update(user.id, {
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          fb_profile_url: profile.link,
          verified: profile.verified })
          .done(function(err, user){
            return cb(null, user[0], {
              message: 'Logged In Successfully'
            });
          });
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

  returnMin: function(array){
    _ = require("underscore");

    return _.min(array);
  }
}

function calculateScore(user, combined_ratings, cb){

  var grouped = _.groupBy(combined_ratings, 'movie_id');

  grouped = _.values(grouped);

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
  console.dir(user.current_user_id);
  var user_a_id = user.current_user_id;
  var user_b_id = user.id;
  MovieUserRating.find().where({user_id: [user_a_id, user_b_id]})
    .sort("movie_id")
    .exec(function(combined_ratings){ calculateScore(user, combined_ratings, cb); });
}
