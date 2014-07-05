module.exports = {

  addOrUpdateMovie: function(movie, callback){
    Movie.findOne({ movieDbId: movie.movieDbId }).done(function(err, existingMovie){
      if (err) return console.log(err);
      if (!existingMovie){
        Movie.create({
          movieDbId: movie.movieDbId,
          title: movie.title,
          imageUrl: movie.imageUrl,
          bigImageUrl: movie.bigImageUrl
        }).done(function(err, newMovie){
          if (err) return console.log(err);
          return callback(newMovie.id);
        });
      } else {
        existingMovie.title = movie.title;
        existingMovie.imageUrl = movie.imageUrl;
        existingMovie.bigImageUrl = movie.bigImageUrl;
        return callback(existingMovie.id);
      }
    });
  },

  includeRatings: function(movies, userId, callback){
    var ids = _.map(movies, function(movie){ return Number(movie.movieDbId); });
    if (userId){ //include current user ratings
    MovieUserRating.find()
    .where({movieDbId: ids, userId: userId })
     .exec(function (err, ratings) {
         _.each(ratings, function(rating){
           var found = _.findWhere(movies, {movieDbId: rating.movieDbId});
           if (found) found["currentUserRating"] = rating.rating;
       });
       return callback(movies);
     });
   }
   else return callback(movies); //no userId, so dont include user ratings.. but include averages
  }
};
