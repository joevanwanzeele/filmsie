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
  }

}
