module.exports = {

  addOrUpdateMovie: function(movie, callback){
    Movie.findOne({ movieDbId: movie.movieDbId }).done(function(err, existingMovie){
      if (err) return console.log(err);
      if (!existingMovie){
        Movie.create({
          movieDbId: movie.movieDbId,
          title: movie.title,
          thumbnailImageUrl: movie.imageUrl
        }).done(function(err, newMovie){
          if (err) return console.log(err);
          return callback(newMovie.id);
        });
      } else {
        return callback(existingMovie.id);
      }
    });
  }
};
