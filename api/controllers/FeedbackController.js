/**
 * FeedbackController
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
var nodemailer = require("nodemailer");

module.exports = {
  create: function(req, res, next){
    console.dir(req.body);
    var user = req.session.user || null;
    if (!user) return res.json("must be logged in to submit feedback");

    var user_id = user.id;
    var user_name = user.name;
    var user_email = user.email;

    var feedback_type = req.body.feedback_type;
    var feedback_message = "user_id: " + user_id +
      "\nuser_name: " + user_name +
      "\nuser_email: " + user_email +
      "\n\n" + req.body.message;

    var smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "joe@filmsie.com",
        pass: sails.config.smtpConfig.passwd,
        XOAuth2: {
          user: "joe@filmsie.com",
          clientId: sails.config.smtpConfig.clientId,
          clientSecret: sails.config.smtpConfig.clientSecret,
          refreshToken: sails.config.smtpConfig.refreshToken
        }
      }
    });

    var mailOptions = {
     from: "joe@filmsie.com", // sender address
     to: "joe@filmsie.com", // list of receivers
     subject: "Feedback - " + feedback_type , // Subject line
     text: feedback_message // plaintext body
    }

    smtpTransport.sendMail(mailOptions, function(error, response){
     if(error){
         console.log(error);
     }else{
         console.log("Message sent: " + response);
     }
    });

    return res.json("feedback submitted");
  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to FeedbackController)
   */
  _config: {}


};
