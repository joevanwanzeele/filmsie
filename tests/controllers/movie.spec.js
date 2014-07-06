var MovieController = require('../../api/controllers/MovieController'),
    sinon = require('sinon'),
    assert = require('assert');

describe('The Movie Controller', function () {
    describe('when we load the index page', function () {
        it ('should render the view', function () {
            var view = sinon.spy();
            MovieController.index({session: { user: null } }, {
                view: view
            });
            assert.ok(view.called);
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
