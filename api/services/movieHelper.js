module.exports = {

  addOrUpdateMovie: function(movie, cb){
    Movie.findOneByTmdb_id(Number(movie.tmdb_id)).done(function(err, existing_movie){
      if (err) return console.log(err);
      if (!existing_movie){
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
        existing_movie.save(function(err){return cb(err, existing_movie);});
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
