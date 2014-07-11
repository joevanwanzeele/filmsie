

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

  addOrUpdateUser: function(profile, cb){
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

  getUsersByFacebookIds: function(current_user_id, facebook_ids, cb){
    User.find().where({facebook_id: facebook_ids})
      .then(function (err, users) {
        _.each(users, function(user){
          var c_score = this.getCorrelationScore(current_user_id, user.id);
          user["c_score"] = c_score;
        });
        return callback(users);
      });
  },

  getCorrelationScore: function(user_a_id, user_b_id){
    MovieUserRating.find().where({user_id: [user_a_id, user_b_id]})
      .sort("movie_id")
      .then(this.calculateScore);
  },

  calculateScore: function(combined_ratings){
    _ = require("underscore");

    var grouped = _.groupBy(combined_ratings, 'movie_id');

    grouped = _.values(grouped);

    var two_ratings = _.compact(_.map(grouped, function(group){
      return group.length == 2 ? _.pluck(group, "rating") : false }));

    if (two_ratings.length == 0) return -1; //they haven't rated any of the same movies

    var getDifference = _.memoize(function(both_ratings){ return Math.abs(both_ratings[0] - both_ratings[1]) + 1; });

    var differences = _.map(two_ratings, getDifference);

    var score = two_ratings.length / _.reduce(differences, function(mem, val){ return mem + val});

    return score;
  },

  returnMin: function(array){
    _ = require("underscore");

    return _.min(array);
  }

}
