var should = require('should');
var assert = require('assert');
var userHelper = require("../../api/services/UserHelper");

describe('User Helper Tests:', function () {
    describe('Correlation Score Calculation Tests:', function () {

        it ('should return null for users with less than 4 rated movies in common', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";
          var movie_3_id = "3";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 5},
                                  {user_id: user_b_id, movie_id: movie_1_id, rating: 5},
                                  {user_id: user_a_id, movie_id: movie_2_id, rating: 5},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 5},
                                  {user_id: user_a_id, movie_id: movie_3_id, rating: 5},
                                  {user_id: user_b_id, movie_id: movie_3_id, rating: 5}];

          var user = {};
          var result = userHelper.calculateScore(user, combined_ratings, function(){});

          assert.equal(user.c_score, null);
        });

        it ('should return the correct result for users with 4 ratings in common', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";
          var movie_3_id = "3";
          var movie_4_id = "4";
          var movie_5_id = "5";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_b_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_a_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_a_id, movie_id: movie_3_id, rating: 7},
                                  {user_id: user_b_id, movie_id: movie_3_id, rating: 7},
                                  {user_id: user_a_id, movie_id: movie_4_id, rating: 2},
                                  {user_id: user_b_id, movie_id: movie_4_id, rating: 10}];

          var user = {};
          var result = userHelper.calculateScore(user, combined_ratings, function(){});

          assert.equal(user.c_score, .34);
        });

        it ('should return the correct value for users with 5 rated movies in common', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";
          var movie_3_id = "3";
          var movie_4_id = "4";
          var movie_5_id = "5";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_a_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_a_id, movie_id: movie_3_id, rating: 7},
                                  {user_id: user_a_id, movie_id: movie_4_id, rating: 9},
                                  {user_id: user_a_id, movie_id: movie_5_id, rating: 2},
                                  {user_id: user_b_id, movie_id: movie_1_id, rating: 2},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 4},
                                  {user_id: user_b_id, movie_id: movie_3_id, rating: 6},
                                  {user_id: user_b_id, movie_id: movie_4_id, rating: 8},
                                  {user_id: user_b_id, movie_id: movie_5_id, rating: 1}
                                  ];

          var user = {};
          var result = userHelper.calculateScore(user, combined_ratings, function(){});

          assert.equal(user.c_score, .96);
        });

        it ('should return the correct value for users with 5 rated movies in common, all same rating', function(){
          var user_a_id = "12345";
          var user_b_id = "67890";

          var movie_1_id = "1";
          var movie_2_id = "2";
          var movie_3_id = "3";
          var movie_4_id = "4";
          var movie_5_id = "5";

          var combined_ratings = [{user_id: user_a_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_a_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_a_id, movie_id: movie_3_id, rating: 7},
                                  {user_id: user_a_id, movie_id: movie_4_id, rating: 8},
                                  {user_id: user_a_id, movie_id: movie_5_id, rating: 10},
                                  {user_id: user_b_id, movie_id: movie_1_id, rating: 1},
                                  {user_id: user_b_id, movie_id: movie_2_id, rating: 3},
                                  {user_id: user_b_id, movie_id: movie_3_id, rating: 7},
                                  {user_id: user_b_id, movie_id: movie_4_id, rating: 8},
                                  {user_id: user_b_id, movie_id: movie_5_id, rating: 10}];

          var user = {};
          var result = userHelper.calculateScore(user, combined_ratings, function(){});

          assert.equal(user.c_score, 1);
        });
    });
});
