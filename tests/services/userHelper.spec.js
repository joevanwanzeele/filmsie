var should = require('should');
var assert = require('assert');
var userHelper = require("../../api/services/UserHelper");

describe('User Helper Tests:', function () {
    describe('Correlation Score Calculation Tests:', function () {
        it ('should add two numbers', function () {
            var result = userHelper.returnMin([1,2,3]);
            assert.equal(result, 1);
        });

        it ('should return -1 for users with no rated movies in common:', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 5},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 5}];

          var result = userHelper.calculateScore(combined_ratings);

          assert.equal(result, -1);
        });

        it ('should return the correct value for users with 2 rated movies in common:', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";
          var movie_3_id = "3";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_b_id, movie_id: movie_1_id, rating: 2},
                                  {user_id: user_a_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 1},
                                  {user_id: user_b_id, movie_id: movie_3_id, rating: 2}];

          var result = userHelper.calculateScore(combined_ratings);

          assert.equal(result, .4);
        });
    });
});
