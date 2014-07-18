var supertest = require("supertest");


describe('Movie Controller tests:', function () {
    /*
       Global before() and after() launcher for Sails application
       to run tests like Controller and Models test
    */
    before(function(done) {
      // Lift Sails and store the app reference
      require('sails').lift({

        // turn down the log level so we can view the test results
        log: {
          level: 'error'
        },
        adapters: {
          default: 'testMemoryDb'
        }

      }, function(err, sails) {
           // export properties for upcoming tests with supertest.js
           sails.localAppURL = localAppURL = ( sails.usingSSL ? 'https' : 'http' ) + '://' + sails.config.host + ':' + sails.config.port + '';
           // save reference for teardown function
           done(err);
         });

    });

    // After Function
    after(function(done) {
      sails.lower(done);
    });

    describe('when we load the index page:', function () {
        it ('should render the view', function (done) {
        supertest(sails.express.app)
        .get('/')
        .expect(200, done);
        });
    });

    describe('when we rate a movie:', function(){
      it ('should create a new movie if it does not exist', function(){
        // supertest(sails.express.app).
        //   .post()
      });
    });

    // describe('when we request the config settings from the movie db api', function(){
    //   it ('should return them', function(){
    //     var result = sinon.spy();
    //     var sails = { config: {mdbApi: {api_key : '1234' } } };
    //     MovieController.getConfigSettings(null, result);
    //     assert.ok(result.json.called);
    //   });
    // });
});
