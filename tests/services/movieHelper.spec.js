var should = require('should');
var assert = require('assert');
var userHelper = require("../../api/services/UserHelper");
var movieHelper = require("../../api/services/MovieHelper");

describe('Movie Helper Tests:', function () {

    var test_users = [{ id: 1, facebook_id: 12345, first_name: "Joe"},
                      { id: 2, facebook_id: 6789, first_name: "Bob"},
                      { id: 3, facebook_id: 54321, first_name: "Jill"}];

    var test_movies = [{ id: 1, title: "Return to Buttville" },
                       { id: 2, title: "Escape from Buttville" },
                       { id: 3, title: "The Scourge of Buttville" },
                       { id: 4, title: "Welcome to Buttville" },
                       { id: 5, title: "The end of Buttville" }];

    var test_ratings = [{ movie_id: test_movies[0].id, user_id: test_users[0].id, rating: 10 },
                        { movie_id: test_movies[0].id, user_id: test_users[1].id, rating: 10 },
                        { movie_id: test_movies[1].id, user_id: test_users[0].id, rating: 2 },
                        { movie_id: test_movies[1].id, user_id: test_users[1].id, rating: 2 },
                        { movie_id: test_movies[1].id, user_id: test_users[2].id, rating: 2 },
                        { movie_id: test_movies[2].id, user_id: test_users[0].id, rating: 4 },
                        { movie_id: test_movies[2].id, user_id: test_users[1].id, rating: 4 },
                        { movie_id: test_movies[3].id, user_id: test_users[0].id, rating: 4 },
                        { movie_id: test_movies[3].id, user_id: test_users[1].id, rating: 4 },
                        { movie_id: test_movies[4].id, user_id: test_users[1].id, rating: 10 }];

    before(function(done){
      User.adapter = 'testMemoryDb';
      Movie.adapter = 'testMemoryDb';
      Review.adapter = 'testMemoryDb';
      MovieUserRating.adapter = 'testMemoryDb';
      done();
    });

    describe('Recommended Score Calculation Tests:', function () {

        beforeEach(function(done){

          User.destroy({}, function(err){ //clear users
            if (err) return done(err);
            User.create(test_users)
            .done(function(err, user){ //create one user
              if (err) return done(err);
              Movie.destroy({}, function(err){ //clear movies
                if (err) return done(err);
                Movie.create(test_movies)
                .done(function(err, movies){ //create one movie
                  if (err) return done(err);
                  MovieUserRating.destroy({}, function(err){ //clear ratings
                    MovieUserRating.create(test_ratings)
                    .done(function(err, ratings){
                      done();
                    });
                  });
                });
              });
            });
          });

        });

        it ('should return 0 for movies with no ratings', function(){
          MovieUserRating.destroy({}).done(function(err){
            movieHelper.includeRecommendationScore([test_movies[0]], test_users[0].id, function(movies){
              assert.equal(movies[0].r_score, 0);
            });
          });
        });

        it ('should return 0 for movies with ratings from users who are not correlated', function(){
          MovieUserRating.destroy({user_id: test_users[0].id}).done(function(err){
            movieHelper.includeRecommendationScore([test_movies[0]], test_users[0].id, function(movies){
              assert.equal(movies[0].r_score, 0);
            });
          });
        });

        it ('should return 10 for movies with one 10 rating from a user who is 100% correlated', function(){
          movieHelper.includeRecommendationScore([test_movies[0]], test_users[0].id, function(movies){
            assert.equal(movies[0].r_score, 10);
          });
        });

        if ('should return the correct value for a more complicated example', function(){
          //same as above test, but add another user who rated the same movie as a 1 and has
          //a c_score of .5.  result should be (50 * 1 + 100 * 10) / 150 = (7) ;


        });
    });

    describe('Review Count tests:', function () {

        it ('should return 0 for movies with no reviews', function(){
          movieHelper.includeReviewCount([test_movies[0]], function(){
            assert.equal(test_movies[0].review_count, 0);
          })
        });

        it ('should return the correct number of reviews for movies with reviews', function(){
          Review.destroy({}).done(function(err){
            Review.create({user_id: test_users[0].id, movie_id: test_movies[0].id, content: "it sucked!"})
              .done(function(err, review){
                if (err) throw err;
                movieHelper.includeReviewCount([test_movies[0]], function(){
                  assert.equal(test_movies[0].review_count, 1);
                });
              });
          });
        });
    });
});
