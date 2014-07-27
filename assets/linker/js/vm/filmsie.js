function FilmsieViewModel(){
  var self = this;
  self.current_user = ko.observable(new UserViewModel());
  self.movies = ko.observable();
  self.movie_lists = ko.observable();
  self.people = ko.observable();

  self.is_showing_people = ko.observable(false);
  self.is_showing_movies = ko.observable(false);
  self.is_showing_lists = ko.observable(false);

  self.movie_details = ko.observable();
  self.selected_movie = ko.observable();

  self.is_loading_details = ko.observable(false);

  self.thumbnail_base_url = ko.observable();
  self.large_image_base_url = ko.observable();
  self.not_found_image_url = "../img/unavailable-image.jpeg";

  self.feedback = ko.observable(new FeedbackViewModel(self));

  self.getConfigSettings = function(){
    if (!self.thumbnail_base_url()){
      $.ajax({
        type: "POST",
        url: "/movie/getConfigSettings",
        data: {
          '_csrf': window.filmsie.csrf
        },
        success: function(data){
          self.thumbnail_base_url(data.images.base_url + data.images.poster_sizes[2]);
          self.large_image_base_url(data.images.base_url + data.images.poster_sizes[5]);
        }
      });
    }
  }

  self.showPeople = function(vm, e){
    location.hash = "people";
  }

  self.showMovies = function(vm, e){
    location.hash = "movies";
  }

  self.showLists = function(vm, e){
    location.hash = "lists";
  }

  self.shareOnFacebook = function(){
    FB.ui({
      method: 'share_open_graph',
      action_type: 'og.likes',
      action_properties: JSON.stringify({
          object: window.location.href,
      })
    }, function(response){});
  }

  self.showFeedbackModal = function(vm, e){
    e.stopPropagation();
    $('#feedbackModal').modal();
  }

  self.showAddToListModal = function(vm, e){
    e.stopPropagation();

    if (!self.current_user().authenticated()) return bootbox.alert("sign in to create movie lists");

    self.movie_lists().selected_movie(vm);
    self.movie_lists().get_movie_lists();

    $('#addToListModal').modal();
    self.setModalProperties();
  }

  self.showReviewsModal = function(vm, e){
    e.stopPropagation();
    vm.getReviews();
    self.selected_movie(vm);

    $('#reviewsModal').modal();
    self.setModalProperties();
  }

  self.showDetails = function(vm){
    self.movie_details(vm);
    self.is_loading_details(true);

    $('#movie_details_modal').modal();
    self.setModalProperties();

    $.ajax({
      type: "POST",
      url: "/movie/details",
      data: {
        tmdb_id: vm.tmdb_id(),
        '_csrf': window.filmsie.csrf
      },
      cache: false,
      success: function(data){
        vm.release_date(new Date(data.release_date));
        _.each(data.genres, function(genre){
          vm.genres.push(genre.name);
        });
        vm.runtime(data.runtime);
        vm.synopsis(data.overview);
        vm.imdb_id(data.imdb_id);
        vm.is_loading_details(false);
      }
    });
  }

  self.processLogin = function(callback){
    FB.getLoginStatus(function(response) {
     if (response.status == "connected"){
       FB.api('/me', function(user) {
         if (user.error) return console.log(user.error);
         self.current_user(new UserViewModel(user));
         self.current_user().accessToken(response.authResponse.accessToken);
         self.current_user().authenticated(true);
         self.current_user().facebook_id(user.id);
         user["_csrf"] = window.filmsie.csrf;
         $.ajax({
           type: "POST",
           url: "/user/login",
           data: user,
           cache: false,
           success: function(data){
             self.current_user().id(data.id);
             self.init();
           }
         });
       });
     } else {
       self.init();
     }
    });
  }

  self.processLogout = function(callback){
    $.ajax({
      type: "POST",
      url: "/user/logout",
      data: {"_csrf": window.filmsie.csrf },
      cache: false,
      success: function(data){
        self.current_user(new UserViewModel());
        self.init();
        location.hash = "movies";
      }
    });
  }

  self.login = function(callback){
    FB.login(function(response) {
      self.processLogin(response, callback);
    }, {scope: 'public_profile, email, user_friends'});
  }

  self.logout = function(callback){
    FB.logout(function(response) {
      // Person is now logged out
      self.processLogout(callback);
    });
  }

  self.init = function(){
    self.getConfigSettings();

    self.movies(new MoviesViewModel(self.current_user));
    self.people(new PeopleViewModel(self.current_user));
    self.movie_lists(new MovieListsViewModel(self.current_user));
    self.selected_movie(null);

    self.movie_details(null);

    self.movies().init();

    self.movie_lists().thumbnail_base_url = self.movies().thumbnail_base_url;
    self.movie_lists().large_image_base_url = self.movies().large_image_base_url;
    self.people().thumbnail_base_url = self.movies().thumbnail_base_url;
    self.people().large_image_base_url = self.movies().large_image_base_url;
    self.setUpRouting();
  }

  self.loadLists = function(){
    $('.active').removeClass('active');
    $('#showListsNavButton').addClass('active');
    self.is_showing_movies(false);
    self.is_showing_people(false);
    self.is_showing_lists(true);
  }

  self.loadPeople = function(){
    $('.active').removeClass('active');
    $('#showPeopleNavButton').addClass('active');
    self.is_showing_movies(false);
    self.is_showing_people(true);
    self.is_showing_lists(false);
  }

  self.loadMovies = function(which){
    $('.navbar-nav .active').removeClass('active');
    $('#showMoviesNavButton').addClass('active');
    self.movies().loadMovies(which);
    self.is_showing_lists(false);
    self.is_showing_people(false);
    self.is_showing_movies(true);
  }

  self.openProfileModal = function(){
    $('#userProfileModal').modal();
    self.setModalProperties();
  }

  self.setModalProperties = function(){
    $('.modal').on("click", function(e){
      $(this).modal('hide');
    });
    $('.modal-dialog').on("click", function(e){
      e.stopPropagation();
    });
    $('.close').on("click", function(e){
      $(e.target).closest('.modal').modal('hide');
    });
  }

  self.setUpRouting = function(){
    var app = Sammy(function() {
          this.get('/#lists', function() {
            self.loadLists();
            self.movie_lists().get_movie_lists()
          });

          this.get('/#lists/:list_id', function() {
            self.loadLists();
            self.movie_lists().get_movie_lists(this.params.list_id)
          });

          this.get('/#feedback', function(){
            self.showFeedbackModal();
          });

          this.get('/#movies', function(){
            self.loadMovies();
          });

          this.get('/#movies/recommended', function(){
            self.loadMovies('recommended');
          });

          this.get('/#movies/search', function(){
            self.loadMovies('search');
          });

          this.get('/#movies/browse', function(){
            self.loadMovies('browse');
          });

          this.get('/#people', function(){
            self.loadPeople();
            self.people().loadPeople();
          });

          this.get('/#people/matches', function(){
            self.loadPeople()
            self.people().loadPeople("matches");
          });

          this.get('/#people/friends', function(){
            self.loadPeople()
            self.people().loadPeople("friends");
          });

          this.get('/#people/profile/:id', function(){
            self.loadPeople();
            self.people().loadPeople("profile", this.params.id);
          });

          this.get('/#_=_', function(){
            return this.redirect('/');
          });

          this.get('/', function(){
            return this.redirect('/#movies/browse');
          });

          this.get('/#user/logout', function(){
            self.logout();
          });

          this.get('/#user/account', function(){
            self.openProfileModal();
          });
      });
      app.raise_errors = true;
      app.run();
  }
}
