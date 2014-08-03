function FilmsieViewModel(){
  var self = this;
  self.current_user = ko.observable(new UserViewModel());
  self.movies = ko.observable();
  self.movie_lists = ko.observable();
  self.people = ko.observable();

  self.windowInnerHeight = ko.observable(window.innerHeight);
  self.windowInnerWidth = ko.observable(window.innerWidth);

  self.is_showing_people = ko.observable(false);
  self.is_showing_movies = ko.observable(false);
  self.is_showing_lists = ko.observable(false);

  self.movie_details = ko.observable();
  self.selected_movie = ko.observable();

  self.current_url = ko.observable();

  self.is_loading_details = ko.observable(false);

  self.thumbnail_base_url = ko.observable();
  self.large_image_base_url = ko.observable();
  self.not_found_image_url = "../img/unavailable-image.jpeg";

  self.left_menu_is_open = ko.observable(true);

  self.toggle_left_menu = function(){
    self.left_menu_is_open(!self.left_menu_is_open());
  };

  self.feedback = ko.observable(new FeedbackViewModel(self));

  self.current_user_profile_link = ko.computed(function(){
    return "/#people/profile/" + self.current_user().id()
  });

  self.facebook_iframe_url = ko.computed(function(){
    self.people();
    self.movies();
    self.movie_lists();
    return "http://www.facebook.com/plugins/like.php?href=" +
    encodeURIComponent(self.current_url()) + "&width=200&layout=button_count&action=like&show_faces=true&share=true&height=21&appId=248849825312110";
  });

  self.twitterLink = ko.computed(function(){
    return "https://twitter.com/intent/tweet?url=" +
      encodeURIComponent(self.current_url()) +
      "&hashtags=filmsie";
  });

  self.redditLink = ko.computed(function(){
    return "http://www.reddit.com/submit?url=" + encodeURIComponent(self.current_url());
  });

  window.onhashchange = function () {
    self.current_url(window.location.href);
  }

  $(window).resize(function(){
    self.windowInnerHeight(window.innerHeight);
    self.windowInnerWidth(window.innerWidth);
  });

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
    self.selected_movie(vm);
    self.selected_movie().getReviews();

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

  self.left_menu_class = ko.computed(function(){
    if (self.left_menu_is_open()){
      return "fa-angle-double-left";
    }
    return "fa-angle-double-right";
  });

  self.closeMenu = function(){
    self.left_menu_is_open(false);
    return true;
  }

  self.left_panel_class = ko.computed(function(){
    return self.left_menu_is_open() ? "col-xs-2" : "";
  });

  self.left_menu_button_top_padding = ko.computed(function(){
    return (self.windowInnerHeight() - 140)/2 + "px";
  });

  self.right_panel_class = ko.computed(function(){
    return self.left_menu_is_open() ? "col-xs-10" : "col-xs-12";
  });

  self.movie_container_margin = ko.computed(function(){
    var main_content_margin = 40;
    if (navigator.appVersion.indexOf("Win")!=-1) {
      main_content_margin = 0; //to account for scrollbar.
    }

    return 5 + ((self.windowInnerWidth() - main_content_margin) % 210) / (Math.floor((self.windowInnerWidth() - main_content_margin) / 210) * 2) + "px";
    //dividing the remaining extra space up among the total number of movies
  });

  self.movie_table_container_height = ko.computed(function(){
    return self.windowInnerHeight() - 100 + 'px';
  });

  self.people_container_height = ko.computed(function(){
    return self.windowInnerHeight() - 53 + 'px';
  });

  self.expand_panel_margin_left = ko.computed(function(){
    if (navigator.appVersion.indexOf("Win")!=-1) {
      return "62px"; //to account for scrollbar.
    }
    return "70px";
  });

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
             self.beginSessionPolling();
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

  self.beginSessionPolling = function(){
    setInterval(function(){
      FB.getLoginStatus(function(response) {
        if (response.status == "connected"){
          self.current_user().accessToken(response.authResponse.accessToken);
        } else {
          self.processLogout();
        }
      }, true); }, 180000); //every 3 minutes
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

    if (navigator.appVersion.indexOf("Win")!=-1) {
      $('.expand-panel').css("margin-left", "62px"); //to account for scrollbar.
    }
  }

  self.loadLists = function(list_id){
    self.movie_lists().get_movie_lists(list_id, true);
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
            self.left_menu_is_open(true);
          });

          this.get('/#lists/:list_id', function() {
            self.loadLists(this.params.list_id);
          });

          this.get('/#feedback', function(){
            self.showFeedbackModal();
          });

          this.get('/#movies', function(){
            self.loadMovies('browse');
            self.left_menu_is_open(true);
          });

          this.get('/#movies/recommended', function(){
            self.loadMovies('recommended');
          });

          this.get('/#movies/search', function(){
            self.loadMovies('search');
            self.left_menu_is_open(true);
          });

          this.get('/#movies/browse', function(){
            self.loadMovies('browse');
          });

          this.get('/#people', function(){
            self.loadPeople();
            self.people().loadPeople();
            self.left_menu_is_open(true);
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
