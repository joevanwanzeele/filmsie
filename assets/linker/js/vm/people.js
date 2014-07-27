function PeopleViewModel(current_user){
  var self = this;
  self.current_user = current_user;
  self.friends = ko.observableArray([]);
  self.matches = ko.observableArray([]);

  self.viewing_profile_for = ko.observable();
  self.favorite_movies = ko.observableArray([]);
  self.least_favorite_movies = ko.observableArray([]);
  self.reviews = ko.observableArray([]);

  self.showing_user_profile = ko.observable(false);
  self.loading_profile = ko.observable(false);

  self.which_people = ko.observable('matches');

  self.which_people.subscribe(function(value){
    switch(value){
    case 'matches':
      $('.matches-row').removeClass('hide-behind');
      $('.friends-row').addClass('hide-behind');
      $('#peopleMatches').collapse('show');
      $('#peopleFriends').collapse('hide');
      break;
    case 'friends':
      $('.matches-row').addClass('hide-behind');
      $('.friends-row').removeClass('hide-behind');
      $('#peopleMatches').collapse('hide');
      $('#peopleFriends').collapse('show');
      break;
    }
  });

  self.loadPeople = function(who, id){
    self.showing_user_profile(false);
    $('#peopleFriends').collapse({toggle: false});
    $('#peopleMatches').collapse({toggle: false});
    self.which_people('');

    switch(who){
    case "friends":
      self.getFriends();
      break;
    case "profile":
      self.loadUserProfile(id);
      break;
    case "matches":
    default:
      self.getMatches();
    }
  }

  self.peopleSort = function(left, right){
      if (left.c_score() == right.c_score()){
        return left.name() < right.name();
      }
      return left.c_score() < right.c_score();
  }

  self.getFriends = function(){
    self.friends([]);

    FB.api(
      "/me/friends",
      function (friends) {
        if (friends && !friends.error) {
          friends['_csrf'] = window.filmsie.csrf;

          $.ajax({
            type: "POST",
            url: "/user/friends",
            data: friends,
            cache: false,
            success: function(data){
              _.each(data, function(friend){
                var person = new UserViewModel(friend);
                //set image urls instead of access token.. or not
                person.accessToken(self.current_user().accessToken());
                self.friends.push(person);
              });
              self.friends.sort(self.peopleSort);
              self.which_people('friends');
            }
          });
        }
    });
  },

  self.getMatches = function(){
    self.matches([]);
    $.ajax({
      type: "POST",
      url: "/user/matches",
      data: {'_csrf': window.filmsie.csrf },
      cache: false,
      success: function(data){
        if (data == "unauthorized") return;
        _.each(data, function(match){
          var person = new UserViewModel(match);
          //set image urls
          person.accessToken(self.current_user().accessToken());
          self.matches.push(person);
        });
        self.matches.sort(self.peopleSort);
        self.which_people('matches');
      }
    });
  }

  self.viewUserProfile = function(vm){
    if (self.loading_profile()) return;
    location.hash = "people/profile/" + vm.id();
  }

  self.loadUserProfile = function(user_id){
    if (self.loading_profile()) return;
    self.loading_profile(true);
    $.ajax({
      type: "POST",
      url: "/user/get",
      data: {
        id: user_id,
        '_csrf': window.filmsie.csrf },
      success: function(data){
        if (data == "unauthorized") return;

        if (data == "user not found"){
          bootbox.alert("There is no user with that ID.");
        }
        var user = new UserViewModel(data);
        user.accessToken(self.current_user().accessToken());
        self.viewing_profile_for(user);
        self.showing_user_profile(true);
        self.loading_profile(false);

        self.loadFavorites(user_id);
        self.loadLeastFavorites(user_id);
        self.loadReviews(user_id);
      },
      error: function(err){
        console.log(err);
        self.loading_profile(false);
      }
    });
  }

  self.loadFavorites = function(user_id){
    self.favorite_movies([]);
    $.ajax({
      type: "POST",
      url: "/user/favorites",
      data: {
        id: user_id,
        '_csrf': window.filmsie.csrf },
      success: function(data){
        if (data == "unauthorized") return;

        if (data == "no movies"){
          return;
        }
        _.each(data, function(movie){
          self.favorite_movies.push(new MovieViewModel(movie, self.current_user));
        });

      },
      error: function(err){
        console.log(err);
      }
    });
  }

  self.loadLeastFavorites = function(user_id){
    self.least_favorite_movies([]);
    $.ajax({
      type: "POST",
      url: "/user/leastFavorites",
      data: {
        id: user_id,
        '_csrf': window.filmsie.csrf },
      success: function(data){
        if (data == "unauthorized") return;

        if (data == "no movies"){
          return;
        }
        _.each(data, function(movie){
          self.least_favorite_movies.push(new MovieViewModel(movie, self.current_user));
        });
      },
      error: function(err){
        console.log(err);
      }
    });
  }

  self.loadReviews = function(user_id){
    self.reviews([]);
    $.ajax({
      type: "POST",
      url: "/review/getReviewsForUser",
      data: {
        user_id: user_id,
        '_csrf': window.filmsie.csrf },
      success: function(data){
        console.dir(data);
        if (data == "no reviews"){
          return;
        }
        _.each(data, function(review){
          self.reviews.push(new MovieReviewViewModel(review, self.current_user));
        });
      },
      error: function(err){
        console.log(err);
      }
    });
  }
}
