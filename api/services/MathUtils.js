module.exports = {

  getPopulationCorrelation: function(x, y){
    //**assume x and y are ordered arrays of same length**

    if (x.length < 5 && _.isEqual(x,y)) return 0;
    if (_.isEqual(x,y)) return 1; //if they have all (and only) same ratings, we'll call them positively correlated.

    var meanX = _.reduce(x, function(memo, num){ return memo + num; }, 0) / x.length;
    var meanY = _.reduce(y, function(memo, num){ return memo + num; }, 0) / y.length;

    var stdX = this.getStandardDeviation(x, meanX) || .0000001; //to avoid /0 errors
    var stdY = this.getStandardDeviation(y, meanY) || .0000001;

    var sum = 0;

    for (var i=0; i<x.length; i++){
      sum += ((x[i] - meanX) / stdX) * ((y[i] - meanY) / stdY);
    }

    return 1/x.length * sum;
  },

  getStandardDeviation: function(array, mean){
    if (!mean){
      mean = _.reduce(array, function(memo, num){ return memo + num; }, 0) / array.length; //for performance
    }
    return Math.sqrt(_.reduce(array, function(memo, num){ return Math.pow(num - mean, 2) + memo; }, 0) / array.length );
  },

  getAverageDifference: function(x, y){
    //** assume x and y are ordered arrays of same length **
    var length = x.length;
    var sum = 0;
    for (var i = 0; i<length; i++){
      sum += Math.abs(x[i] - y[i]);
    }

    return sum/length;
  }

}
