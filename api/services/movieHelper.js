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
    var tmdb_ids = _.map(movies, function(movie){ return Number(movie.tmdb_id); });
    MovieUserRating.find()
    .where({tmdb_id: tmdb_ids })
     .exec(function (err, all_user_ratings) {
       _.each(tmdb_ids, function(tmdb_id){
         var all_movie_ratings = _.where(all_user_ratings, { tmdb_id: tmdb_id });
         if (all_movie_ratings.length > 0){
            var found = _.findWhere(movies, {tmdb_id: tmdb_id});

            if (found) found["average_rating"] = _.reduce(all_movie_ratings, function(avg, movie_rating){
              return avg + movie_rating.rating / all_movie_ratings.length;
            },0).toFixed(2);

            var found_rating = _.find(all_movie_ratings, function(movie_rating){
              return movie_rating.user_id == user_id;
            });

            found["current_user_rating"] = found_rating && found_rating.rating;
         }
       });
       return callback(movies);
     });
  }
};
