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
  }
};
