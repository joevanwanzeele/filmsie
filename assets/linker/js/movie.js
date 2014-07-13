function UserViewModel(parent, data){
  var self = this;
  self.parent = parent;
  self.id = ko.observable(data && data.id || '');
  self.facebook_id = ko.observable();
  self.authenticated = ko.observable(false);
  self.c_score = ko.observable(data && data.c_score || null)
  self.first_name = ko.observable(data && data.first_name || '');
  self.last_name = ko.observable(data && data.last_name || '');
  self.name = ko.observable(data && data.name || '');
  self.email = ko.observable(data && data.email || '');
  self.gender = ko.observable();

  self.fb_profile_url = ko.observable(data && data.fb_profile_url || '');
  self.profile_pic_url = ko.observable(data && data.profile_pic_url || '');

  self.friends = ko.observableArray([]);
  self.matches = ko.observableArray([]);


  self.processLogin = function(callback){
    FB.getLoginStatus(function(response) {
     if (response.status == "connected"){
       self.authenticated(true);
       FB.api('/me', function(user) {
         if (user.error) return console.log(user.error);
         self.facebook_id(user.id);
         self.first_name(user.first_name);
         self.last_name(user.last_name);
         self.name(user.name);
         self.email(user.email);
         self.gender(user.gender);
         self.fb_profile_url(user.link);
         user["_csrf"] = window.filmsie.csrf;
         $.ajax({
           type: "POST",
           url: "/user/login",
           data: user,
           cache: false,
           success: function(data){
             self.id(data.id);
             self.parent.init();
           }
         });
       });
     } else {
       self.parent.init();
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
        self.reset();
        parent.init();
        self.parent.loadMovies();
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

  self.reset = function(){
    self.facebook_id(null);
    self.first_name(null);
    self.last_name(null);
    self.name(null);
    self.email(null);
    self.gender(null);
    self.fb_profile_url(null);
    self.authenticated(false);
  }

  self.facebook_id.subscribe(function(value){
    if (value){
      FB.api('/me?fields=picture', function(response) {
        self.profile_pic_url(response.picture.data.url);
      });
    }
  });

  self.facebook_id(data && data.facebook_id || null);
  self.is_showing_matches = ko.observable(false);
  self.is_showing_friends = ko.observable(false);

  self.getFriends = function(){
    self.friends([]);

    FB.api(
      "/me/friends",
      function (friends) {
        if (friends && !friends.error) {
          friends['_csrf'] = window.filmsie.csrf;

          $.ajax({
            type: "POST",
            url: "/user/facebookFriends",
            data: friends,
            cache: false,
            success: function(data){
              _.each(data, function(friend){
                self.friends.push(new UserViewModel(self, friend));
              });
            }
          });
        }
    });
  },

  self.save = function(){

  }

  self.getMatches = function(){

  }

  self.scrolledPeople = function(){}
}

function MovieListViewModel(data, parent){
  var self = this;
  self.parent = parent;
  self.id = ko.observable(data && data.id || null);
  self.name = ko.observable(data && data.name || null);
  self.movie_ids = ko.observableArray(data && data.movie_ids || data.movie_ids);
  self.movies = ko.observableArray([]);
  self.is_public = ko.observable(true && (data ? data.is_public : true));
  self.user_id = ko.observable(data && data.user_id);
  self.name_and_length = ko.computed(function(){
    self.movie_ids();
    return self.name() + "<div class='list-length'>(" + self.movie_ids().length + ")</div>"
  });

  self.is_owner = ko.computed(function(){
    return self.user_id() == self.parent.user().id();
  });

  self.addMovie = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/addMovie",
      data: {
        user_id: self.parent.user().id(),
        list_id: self.id(),
        movie: {
          tmdb_id: parent.selected_movie().tmdb_id(),
          title: parent.selected_movie().title(),
          poster_path: parent.selected_movie().poster_path(),
          backdrop_path: parent.selected_movie().backdrop_path(),
          release_date: parent.selected_movie().release_date()
        },
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        $('#addToListModal').modal('hide');
      }
    });
  }

  self.removeMovie = function(movie){
    var movie_id = movie.id();

    $.ajax({
      type: "POST",
      url: "/movielist/removeMovie",
      data: {
        list_id: self.id(),
        movie_id: movie_id,
        '_csrf': window.filmsie.csrf
      },
      success: function(movie_ids){
        self.movie_ids(_.without(self.movie_ids(), movie_id));
        self.movies(_.without(self.movies(), movie));
      }
    });
  }

  self.saveChanges = function(){
    $.ajax({
      type: "POST",
      url: "/movielist/update",
      data: {
        list_id: self.id(),
        name: self.name(),
        is_public: self.is_public(),
        '_csrf': window.filmsie.csrf
      },
      success: function(list){
        console.log("saved changes to " + self.name());
      }
    });
  }

  self.getList = function(){
    $.ajax({
      type: "POST",
      url: "/movieList/getList",
      data: {
        list_id: self.id(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        self.movies([]);
        self.name(data.list.name);
        self.is_public(data.list.is_public);
        self.user_id(data.list.user_id);
        _.each(data.movies, function(movie){
          self.movies.push(new MovieViewModel(movie, self));
        })
        self.name.subscribe(self.saveChanges);
        self.is_public.subscribe(self.saveChanges);
      }
    });
  }

  self.movie_details = self.parent.movie_details;
  self.thumbnail_base_url = self.parent.thumbnail_base_url;
  self.large_image_base_url = self.parent.large_image_base_url;
  self.user = self.parent.user;
}

function CastMemberViewModel(data, parent){
  var self = this;
  self.cast_id = ko.observable(data.cast_id);
  self.name = ko.observable(data.name);
  self.character = ko.observable(data.character);
  self.image_url = ko.observable(data.profile_path != null ? parent.parent.thumbnail_base_url() + data.profile_path : null); //todo: replace with empty image path if none exists for cast member
}

function MovieViewModel(data, parent) {
  var self = this;
  self.parent = parent;
  self.id = ko.observable(data && data.id || '')
  self.tmdb_id = ko.observable(data && data.tmdb_id || '');
  self.current_user_rating = ko.observable(data && data.current_user_rating || null);
  self.title = ko.observable(data && data.title || '');
  self.poster_path = ko.observable(data && data.poster_path || '');
  self.backdrop_path = ko.observable(data && data.backdrop_path || '');
  self.image_url = ko.observable(data && data.image_url || null);
  self.genres = ko.observableArray([]);
  self.runtime = ko.observable();
  self.synopsis = ko.observable();
  self.imdb_id = ko.observable();
  self.is_loading_details = ko.observable(true);
  self.cast_members = ko.observableArray([]);
  self.cast_is_hidden = ko.observable(true);
  self.temp_rating = ko.observable(self.current_user_rating());

  var not_found_image_url = "../img/unavailable-image.jpeg";

  self.big_image_url = ko.computed(function(){
    if (!self.poster_path()) return '';
    var image_path = self.backdrop_path() || self.poster_path();
    return self.parent.large_image_base_url() + image_path;
  });

  self.image_url = ko.computed(function(){
    if (!self.poster_path()) return not_found_image_url;
    return self.parent.thumbnail_base_url() + self.poster_path();
  });

  self.release_date = ko.observable(data && data.release_date || data.release_date);

  self.genresString = ko.computed(function(){
    return self.genres().join(", ");
  });

  self.formatted_release_date = ko.computed(function(){
    return moment(self.release_date()).format('LL')
  });

  self.title_and_year = ko.computed(function(){
    var year = self.release_date() ? " (" + moment(self.release_date()).get('year') + ")" : "";
    return self.title() + year;
  });

  self.imdb_url = ko.computed(function(){
    return "http://www.imdb.com/title/" + self.imdb_id() + "/";
  });

  self.showListPopover = function(vm, e){
    e.stopPropagation();
    parent.selected_movie(self);
    parent.get_movie_lists();

    $('#addToListModal').modal();
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

  self.showDetails = function(){
    self.parent.movie_details(self);
    self.is_loading_details(true);
    $('#movie_details_modal').modal();

    $.ajax({
      type: "POST",
      url: "/movie/details",
      data: {
        tmdb_id: self.tmdb_id(),
        '_csrf': window.filmsie.csrf
      },
      cache: false,
      success: function(data){
        self.release_date(new Date(data.release_date));
        _.each(data.genres, function(genre){
          self.genres.push(genre.name);
        });
        self.runtime(data.runtime);
        self.synopsis(data.overview);
        self.imdb_id(data.imdb_id);
        self.is_loading_details(false);
      }
    });
  }

  self.getCast = function(){
    $.ajax({
      type: "POST",
      url: "/movie/cast",
      data: {
        tmdb_id: self.tmdb_id(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        if (data.length == 0) { $('.cast-container').html("(unavailable)"); }
          else{
          _.each(data, function(castMember){
            self.cast_members.push(new CastMemberViewModel(castMember, self));
          })
        }
      }
    });
  }

  self.toggleCast = function(){
    if (!self.cast_members().length) self.getCast();
    self.cast_is_hidden(!self.cast_is_hidden());
  }

  self.ratingClass = function(value, event){
    if (self.temp_rating() == null) return '';

    //values will be 1-5 while current_user_rating is stored as 1-10
    var temp_rating = self.temp_rating() / 2;

    if (temp_rating == value || (temp_rating - .5) >= value) return 'fa-star golden';
    if (temp_rating == value - .5) return 'fa-star-half-o golden';
    return 'fa-star-o';
  }

  self.updateRatingClass = function(vm, event){
    var el = $(event.target);
    var star_value = Number($(el).attr('star')) * 2;

    var x_coordinate = event.pageX - el.offset().left;

    var is_in_left_half = x_coordinate < el.width() / 2;

    if (is_in_left_half){
      self.temp_rating(star_value - 1);
      return;
    }
    self.temp_rating(star_value);
  }

  self.resetRatingClasses = function(){
    self.temp_rating(self.current_user_rating());
  }

  self.setRating = function(rating, event) {
    var el = $(event.target);

    var rating_value = rating * 2;
    var x_coordinate = event.pageX - el.offset().left;
    var is_in_left_half = x_coordinate < el.width() / 2;

    if (is_in_left_half){
      rating_value -= 1;
    }

    if (self.current_user_rating() == rating_value){
      rating_value = null; //allows user to clear their rating
    }

    self.current_user_rating(rating_value);

    if (!self.parent.user().id()) return;
    $.ajax({
      type: "POST",
      url: "/movie/rate",
      data: { movie: {
                id: self.id(),
                tmdb_id: self.tmdb_id(),
                title: self.title(),
                poster_path: self.poster_path(),
                backdrop_path: self.backdrop_path(),
                imdb_id: self.imdb_id(),
                release_date: self.release_date() },
              rating: rating_value,
              '_csrf': window.filmsie.csrf
            },
    });
  }

  self.amazon_link = ko.computed(function(){
    return "http://www.amazon.com/s/?tag=filmsie03-20&search-alias=dvd&keywords=%22"+self.title()+"%22";
  });
}

function GenreViewModel(data){
  var self = this;
  self.id = ko.observable(data.id);
  self.name = ko.observable(data.name);
}

function MoviesViewModel() {
  var self = this;
  self.user = ko.observable(new UserViewModel(self));
  self.total_results = ko.observable(0);
  self.movies = ko.observableArray([]);
  self.page = ko.observable(0);
  self.getting = ko.observable(false);
  self.search_query = ko.observable();
  self.thumbnail_base_url = ko.observable();
  self.large_image_base_url = ko.observable();
  self.genres = ko.observableArray([]);

  self.selected_genres = ko.observableArray([]);
  self.selected_year = ko.observable();
  self.movie_lists = ko.observableArray([]);
  self.new_list_name = ko.observable();
  self.selected_movie = ko.observable();
  self.selected_list = ko.observable(new MovieListViewModel({}, self));
  self.movie_details = ko.observable(new MovieViewModel({}, self));

  self.addToListModalTitle = ko.computed(function(){
    if (self.selected_movie()) return "Add \"" + self.selected_movie().title() + "\" to list";
    return "Add to list";
  });

  self.shareOnFacebook = function(){
    FB.ui({
      method: 'share_open_graph',
      action_type: 'og.likes',
      action_properties: JSON.stringify({
          object: window.location.href,
      })
    }, function(response){});
  }

  self.is_showing_people = ko.observable(false);
  self.is_showing_movies = ko.observable(false);
  self.is_showing_lists = ko.observable(false);

  self.get_movie_lists = function(list_id){
    self.movie_lists([]);

    if (!self.user().authenticated()){
        self.selected_list().id(list_id);
        self.selected_list().getList();
        return; //returning before user authentication has a chance to happen.
    }

    $.ajax({
      type: "POST",
      url: "/movielist/index",
      data: {
        user_id: self.user().id(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        _.each(data, function(list){
          var newList = new MovieListViewModel(list, self);
          self.movie_lists.push(newList);
          if (newList.id() == list_id){
            self.selected_list(newList);
            self.selected_list().getList();
          }
        });
      }
    });
  }

  self.add_new_movie_list = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/add",
      data: {
        user_id: self.user().id(),
        name: self.new_list_name(),
        movie: {
          tmdb_id: self.selected_movie().tmdb_id(),
          title: self.selected_movie().title(),
          poster_path: self.selected_movie().poster_path(),
          backdrop_path: self.selected_movie().backdrop_path(),
          release_date: self.selected_movie().release_date()
        },
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        _.each(data, function(list){
          self.movie_lists.push(new MovieListViewModel(list, self));
        });
        $('#addToListModal').modal('hide');
        self.new_list_name('');
      }
    });
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

  self.friends = ko.computed(function(){
    return self.user().friends;
  });

  self.scrolledFriends = self.user().scrolledFriends;

  self.getConfigSettings = function(callback){
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
            self.getMovies();
            if (callback) callback();
        }
      });
    }
  }

  self.years = ko.computed(function(){
    var years = [];
    var currentYear = new Date().getFullYear();
    for (var i=1905; i <= currentYear; i++){
      years.unshift(i);
    }
    return years;
  });

  self.getGenres = function(){
    self.genres([]);
    $.ajax({
      type: "POST",
      url: "/movie/genres",
      data: { '_csrf': window.filmsie.csrf },
      success: function(data){
        _.each(data.genres, function(genre){
          self.genres.push(new GenreViewModel(genre));
        });
      }
    });
  }

  self.openProfileModal = function(){
    //show account options in modal dialog
    $('#userProfileModal').modal();
  }

  self.getting.subscribe(function(value){
    if (value){
      var el = "<div id='loadingMoviesPlaceholder' class='movie-container movies-loading-placeholder' data-bind='visible: getting'><span class='fa fa-5x fa-spin fa-cog'></span></div>";
      if ($('.movie-container').length == 0) {
        $('.movie-table-container').html(el);
      }
      else {
        $('.movie-container').last().after(el);
      }
    } else {
      $('#loadingMoviesPlaceholder').remove();
    }
  });

  self.getMovies = function(){
    if (self.total_results() == self.movies().length && self.movies().length != 0) return;

    if (self.getting() === true) return;
    self.getting(true);

    self.page(self.page() + 1);
    var genres = self.selected_genres()[0] && self.selected_genres()[0] != undefined
        ? _.map(self.selected_genres(), function(genre){ return genre.id; })
        : null;

    $.ajax({
      type: "POST",
      url: "/movie/search",
      data: {
        page: self.page(),
        q: self.search_query(),
        year: self.selected_year(),
        genres: genres,
        '_csrf': window.filmsie.csrf
      },
      cache: false,
      success: function(data){
            self.total_results(data.total_results);
            _.each(data.results, function(movie, i){
              if (i == data.results.length) return;
              var new_movie = new MovieViewModel(movie, self);
              self.movies.push(new_movie);
            });
            $('.movie-table-container').scroll(); //this is to load more if the initial load doesn't fill the view area
            self.getting(false);
          }
    });
  }

  self.scrolled = function(data, event){
    var last_movie = self.movies(self.movies())

    var viewport_element = $(event.target);
    var last_movie_position = viewport_element
                              .children('.movie-container')
                              .last()
                              .offset().top;
    var last_movie_in_list = viewport_element.children('.movie-container').last();

    if (!last_movie_in_list){
      self.getMovies();
      return;
    }

    if (last_movie_position < viewport_element.height()){
      self.getMovies();
    }
  }

  self.search = function(){
    self.movies([]);
    self.page(0);
    self.getMovies();
  }

  self.searchOnEnter = function(data, event){
    if (event.keyCode == 13) self.search();
    return true;
  }

  self.init = function(callback, p){
    self.selected_genres([]);
    self.selected_year(null);
    self.movie_lists([]);
    self.new_list_name('');
    self.selected_movie(null);
    self.selected_list(null);
    self.movie_details(null);

    self.getConfigSettings();
    self.getGenres();
    self.setUpRouting();
    if (self.is_showing_movies()){
      self.search();
    }
    self.selected_genres.subscribe(self.search);
    self.selected_year.subscribe(self.search);
  }

  self.loadLists = function(list_id){
    self.get_movie_lists(list_id);
    $('.active').removeClass('active');
    $('#showListsNavButton').addClass('active');
    self.is_showing_movies(false);
    self.is_showing_people(false);
    self.is_showing_lists(true);
  }

  self.loadPeople = function(who){
    $('.active').removeClass('active');
    $('#showPeopleNavButton').addClass('active');
    self.is_showing_movies(false);
    self.is_showing_people(true);
    self.is_showing_lists(false);

    if (who == "friends") {
      self.user().getFriends();
      self.user().is_showing_friends(true);
      self.user().is_showing_matches(false);
    }
    else {
      self.user().getMatches();
      self.user().is_showing_friends(false);
      self.user().is_showing_matches(true);
    }
  }

  self.loadMovies = function(){
    $('.active').removeClass('active');
    $('#showMoviesNavButton').addClass('active');
    self.is_showing_lists(false);
    self.is_showing_people(false);
    self.is_showing_movies(true);
  }

  //client-side routing
  self.setUpRouting = function(){
    Sammy(function() {
          this.get('/#lists', function() {
            self.loadLists();
          });

          this.get('/#lists/:list_id', function() {
            self.loadLists(this.params.list_id);
          });

          this.get('/#movies', function() {
            self.loadMovies();
          });

          this.get('/#people', function(){
            self.loadPeople()
          });

          this.get('/#people/matches', function(){
            self.loadPeople("matches")
          });

          this.get('/#people/friends', function(){
            self.loadPeople("friends")
          });

          this.get('/#_=_', function(){
            return this.redirect('/');
          });

          this.get('/', function(){
            return this.redirect('/#movies');
          });

          this.get('/#user/logout', function(){
            var route = this;
            self.user().logout();
            location.hash = "movies";
          });
      }).run();
  }
}
