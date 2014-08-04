var should = require('should');
var assert = require('assert');
var mathUtils = require("../../api/services/mathUtils");

describe('Math Utils Tests:', function () {

  describe('Standard Deviation Calculation Tests:', function () {

    it ('should return correct standard deviation for a population', function(){

      var stddev = MathUtils.getStandardDeviation([9, 2, 5, 4, 12, 7, 8, 11, 9, 3, 7, 4, 12, 5, 4, 10, 9, 6, 9, 4]);
      assert.equal(stddev.toFixed(3), 2.983);
    });
  });

  describe('Population Correlation Coefficient Calculation Tests:', function () {

    it ('should return correct Correlation Coefficient for two populations', function(){
      var x = [2,4,1,5,9,7];
      var y = [2,2,3,5,8,4];

      var cc = MathUtils.getPopulationCorrelation(x,y);

      assert.equal(cc.toFixed(3), .816);
    });

    it ('should return correct Correlation Coefficient for two same populations', function(){
      var x = [5,5,5,5,5,5];
      var y = [5,5,5,5,5,5];

      var cc = MathUtils.getPopulationCorrelation(x,y);

      assert.equal(cc.toFixed(3), 1);
    });

  });

  describe('Average Difference Tests:', function () {
    it ('should return correct average difference for two populations', function(){

      var x = [1,1,1,1,1];
      var y = [6,6,6,6,6];

      var avg_diff = MathUtils.getAverageDifference(x,y);

      assert.equal(avg_diff,5);
    });

    it ('should return correct average difference for two populations with varying values', function(){

      var x = [1,2,3,4,5];
      var y = [9,8,7,6,5];

      var avg_diff = MathUtils.getAverageDifference(x,y);

      assert.equal(avg_diff,4);
    });

  });

});
