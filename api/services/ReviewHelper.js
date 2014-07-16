module.exports = {

  includeReviewerRatings: function(reviews, callback){
    async.each(reviews, function(review, cb){
      //get the reviewers rating
      MovieUserRating.findOne({user_id: review.user_id, movie_id: review.movie_id })
        .done(function(err, user_rating){
          if (user_rating) review["reviewer_rating"] = user_rating.rating; //we should really enforce that they rate the movie before reviewing it
          cb()
        });
      }, callback);
  },

  includeReviewerProfileInfo: function(reviews, callback){
    async.each(reviews, function(review, cb){
      User.findOne(review.user_id, function(err, user){
        if (err) return console.log(err);
        review["reviewer_facebook_id"] = user.facebook_id;
        review["reviewer_name"] = user.name;
        review["reviewer_first_name"] = user.first_name;
        cb();
      });
    }, callback);
  },

  includeVoteTally: function(reviews, user_id, callback){
    async.each(reviews, function(review, cb){
      ReviewVote.find({review_id: review.id})
      .done(function(err, votes){
        if (err) return console.log(err);
          var counts = _.countBy(votes, function(vote){ return vote.vote == "up" ? "up" : "down"});
          review["up_votes"] = counts.up;
          review["down_votes"] = counts.down;
          if (user_id){
            var current_user_vote = _.findWhere(votes, {user_id: user_id});
            review["current_user_vote"] = current_user_vote && current_user_vote.vote || null;
          }
          cb();
      });
    }, callback);
  }
}
