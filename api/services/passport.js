// var passport = require('passport'),
//   FacebookStrategy = require('passport-facebook').Strategy;
//
// function findById(id, fn) {
//   User.findOne(id).done(function (err, user) {
//     if (err) {
//       return fn(null, null);
//     } else {
//       return fn(null, user);
//     }
//   });
// }
//
// function findByFacebookId(id, fn) {
//   User.findOne({
//     facebookId: id
//   }).done(function (err, user) {
//     if (err) {
//       return fn(null, null);
//     } else {
//       return fn(null, user);
//     }
//   });
// }
//
// module.exports = {
//
//   init: function(){
//     passport.serializeUser(function (user, done) {
//       done(null, user.id);
//     });
//
//     passport.deserializeUser(function (id, done) {
//       findById(id, function (err, user) {
//         done(err, user);
//       });
//     });
//
//     passport.use(new FacebookStrategy({
//         clientID: sails.config.facebook.client_id,
//         clientSecret: sails.config.facebook.client_secret,
//         callbackURL: sails.config.facebook.callback_url,
//         enableProof: false
//       }, function (accessToken, refreshToken, profile, done) {
//         findByFacebookId(profile.id, function (err, user) {
//           // Create a new User if it doesn't exist yet
//           //console.dir(profile._json);
//           if (!user) {
//             User.create({
//               facebookId: profile._json.id,
//               facebookAccessToken: accessToken,
//               email: profile._json.email,
//               firstName: profile._json.first_name,
//               lastName: profile._json.last_name,
//               facebookProfileUrl: profile._json.link,
//
//             }).done(function (err, user) {
//               if (user) {
//                 return done(null, user, {
//                   message: 'Logged In Successfully'
//                 });
//               } else {
//                 console.dir(err);
//                 return done(err, null, {
//                   message: 'There was an error logging you in with Facebook'
//                 });
//               }
//             });
//
//           // If there is already a user update and return it
//           } else {
//             User.update(user.id, {
//               facebookAccessToken: accessToken,
//               email: profile._json.email,
//               firstName: profile._json.first_name,
//               lastName: profile._json.last_name,
//               facebookProfileUrl: profile._json.link });
//             return done(null, user, {
//               message: 'Logged In Successfully'
//             });
//           }
//         });
//       }
//   ));
//   }
// }
