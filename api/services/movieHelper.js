module.exports = {

  addOrUpdateMovie: function(movie, callback){
    Movie.findOne({ tmdb_id: movie.tmdb_id }).done(function(err, existing_movie){
      if (err) return console.log(err);
      if (!existing_movie){
        Movie.create({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          image_url: movie.image_url,
          big_image_url: movie.big_image_url,
          release_date: movie.release_date
        }).done(function(err, new_movie){
          if (err) return console.log(err);
          return callback(new_movie.id);
        });
      } else {
        existing_movie.title = movie.title;
        existing_movie.image_url = movie.image_url;
        existing_movie.big_image_url = movie.big_image_url;
        existing_movie.release_date = existing_movie.release_date;
        return callback(existing_movie.id);
      }
    });
  },

  includeRatings: function(movies, user_id, callback){
    var ids = _.map(movies, function(movie){ return Number(movie.tmdb_id); });
    if (user_id){ //include current user ratings
    MovieUserRating.find()
    .where({tmdb_id: ids, user_id: user_id })
     .exec(function (err, ratings) {
       _.each(ratings, function(rating){
         var found = _.findWhere(movies, {tmdb_id: rating.tmdb_id});
         if (found) found["current_user_rating"] = rating.rating;
       });
       return callback(movies);
     });
   }
   else return callback(movies); //no userId, so dont include user ratings.. but include averages
  }
};
