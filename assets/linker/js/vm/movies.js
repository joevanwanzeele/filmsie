function FeedbackViewModel(parent){
  var self = this;
  self.parent = ko.observable(parent);
  self.feedback_type = ko.observable("comment");
  self.message = ko.observable();
  self.sending = ko.observable(false);
  self.sent = ko.observable(false);

  self.sent.subscribe(function(value){
    setTimeout(function(){
      $('#feedbackModal').modal("hide");
      self.sent(false);
      self.feedback_type("comment");
      self.message(null);
    },
    3000);
  });

  self.confirmMessage = ko.computed(function(){
    if (self.feedback_type() == "question"){
      return "We will respond to your question as soon as possible.";
    }
    return "Your comments are appreciated."
  });

  self.submitFeedback = function(){
    self.sending(true);
    $.ajax({
      type: "POST",
      url: "/feedback/create",
      data: {
        feedback_type: self.feedback_type(),
        message: self.message(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        if (data == "feedback submitted"){
          self.sent(true);
        }
        self.sending(false);
      }
    });
  }
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
  self.getting_lists = ko.observable(false);
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

  self.feedback = ko.observable(new FeedbackViewModel(self));

  self.which_movies = ko.observable("browse");

  self.list_name_is_valid = ko.observable(true);

  self.search_title = ko.computed(function(){
    if (self.which_movies() == "recommended"){
      if (self.movies().length == 0 && !self.getting()) return "We recommend that you rate some more movies!";
      return "Recommended for you";
    }

    if (self.which_movies() == "browse"){
      return "Browsing the latest movies";
    }
    var prefix = "";
    if (self.which_movies() == "search"){
      if ((!self.selected_genres[0] ||
        !self.selected_genres[0].name()) &&
        !self.selected_year() &&
        !self.search_query()){
          return "Search for movies by title, year or genre";
        } else {
          prefix = "Searching for ";
      }
    }

    var genre = self.selected_genres()[0] != undefined && self.selected_genres()[0].name() + ' ' || 'all ';
    if (self.selected_genres.length > 0 && self.selected_genres.length > 1) genre = _.pluck(self.selected_genres(), 'name').join(', ') + " ";
    var title = genre + "movies ";
    if (self.selected_year()) title += "from " + self.selected_year();
    title += self.search_query() ? " containing \"" + self.search_query() + "\"" : '';
    return prefix + title;
  });

  self.movie_count_text = ko.computed(function(){
    if (self.total_results() == 0) return "";
    return "showing (" + self.movies().length + " of " + self.total_results() + ")";
  });

  self.addToListModalTitle = ko.computed(function(){
    if (self.selected_movie()) return "Add \"" + self.selected_movie().title() + "\" to list";
    return "Add to list";
  });

  self.clearSearch = function(){
    self.getting(true);
    self.search_query('');
    self.selected_genres([]);
    self.selected_year(null);
    self.total_results(0);
    self.getting(false);
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

  self.is_showing_people = ko.observable(false);
  self.is_showing_movies = ko.observable(false);
  self.is_showing_lists = ko.observable(false);

  self.get_movie_lists = function(list_id){
    self.getting_lists(true);
    self.movie_lists([]);

    if (!self.user().authenticated()){
      if (list_id){
        self.selected_list().id(list_id);
        self.selected_list().getList();
      }
      return;
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
          if (!self.selected_list() || newList.id() == list_id){
            self.selected_list(newList);
          }
          self.selected_list().getList();
          self.getting_lists(false);
        });
      }
    });
  }

  self.add_new_movie_list = function(vm, e){
    if (!self.new_list_name()){
      self.list_name_is_valid(false);
      $('#newListName').popover({
        title: "error",
        content: "You have to name the list.",
        placement: "left"});
      return;
    }

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
        self.list_name_is_valid(true);
      }
    });
  }

  self.deleteList = function(list){
    bootbox.confirm('Are you sure you want to permanently delete this list?', function(answer){
      if (!answer) return;

      $.ajax({
        type: "POST",
        url: '/movielist/delete',
        data:{
          list_id: list.id,
          '_csrf': window.filmsie.csrf
        },
        success: function(data){
          if (data == "deleted"){
            bootbox.alert("\"" + list.name() + "\"" + " has been deleted.");
            self.movie_lists.remove(list);
            self.selected_list(null);
            self.showLists();
          }
          else { console.log(data); }
        }
      });

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

  self.showSearchOptions = function(vm, e){
    location.hash = "movies/search"
  }

  self.showRecommendations = function(vm, e){
    location.hash = "movies/recommended"
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
    self.selected_genres([]);
    $.ajax({
      type: "POST",
      url: "/movie/genres",
      data: { '_csrf': window.filmsie.csrf },
      success: function(data){
        _.each(data.genres, function(genre){
          self.genres.push(new GenreViewModel(genre));
        });
        self.selected_genres.subscribe(function(){ self.search();});
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
      if ($('.movie-table-container > .movie-container').length == 0) {
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
        _.each(data.results, function(movie){
          self.movies.push(new MovieViewModel(movie, self));
        });
        $('.movie-table-container').scroll(); //this is to load more if the initial load doesn't fill the view area
        self.getting(false);
      }
    });
  }

  self.getRecommendedMovies = function(){
    //include paging functionality
    if (self.getting() === true) return;
    self.getting(true);

    $.ajax({
      type: "POST",
      url: "movie/recommended",
      data: { '_csrf': window.filmsie.csrf },
      success: function(data){
        self.total_results(data.total_results);
        _.each(data.results, function(movie){
          self.movies.push(new MovieViewModel(movie, self));
        });
        $('.movie-table-container').scroll(); //this is to load more if the initial load doesn't fill the view area
        self.getting(false);
      }
    });
  }

  self.scrolled = function(data, event){
    if (self.movies().length == self.total_results()) return;

    var viewport_element = $(event.target);
    var last_movie_in_list = viewport_element.children('.movie-container').last();

    if (!last_movie_in_list) return; //there are none, so scrolling shouldn't do anything


    var last_movie_position = viewport_element
                              .children('.movie-container')
                              .last()
                              .offset().top;

    if (last_movie_position < viewport_element.height()){

      switch (self.which_movies()){
        case "recommended":
          self.getRecommendedMovies();
          break;
        case "search":
        case "browse":
          self.getMovies();
      }
    }
  }



  self.init = function(callback, p){
    self.selected_genres([]);
    self.selected_year(null);
    self.movie_lists([]);
    self.new_list_name('');
    self.selected_movie(null);
    self.selected_list(null);
    self.movie_details(null);
    self.which_movies(null);

    self.getConfigSettings();
    self.getGenres();
    self.setUpRouting();

    self.selected_year.subscribe(function(value){ self.search();});
    self.search_query.subscribe(function(value){ if (value) self.search();});
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

  self.loadMovies = function(which){
    $('.active').removeClass('active');
    $('#showMoviesNavButton').addClass('active');

    self.is_showing_lists(false);
    self.is_showing_people(false);
    self.is_showing_movies(true);
    switch(which){
      case "recommended":
        self.which_movies("recommended");
        $('#searchOptions').collapse('hide');
        $('.search-row').addClass("hide-behind");
        self.movies([]);
        self.clearSearch();
        self.getRecommendedMovies();
        break;
      case "search":
        self.which_movies("search");
        $('#searchOptions').collapse({toggle: false});
        $('#searchOptions').collapse('show');
        $('.search-row').removeClass("hide-behind");
        self.clearSearch();
        break;
      default:
        self.which_movies("browse");
        $('#searchOptions').collapse('hide');
        $('.search-row').addClass("hide-behind");
        self.clearSearch();
        self.search();
        break;
    }
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

          this.get('/#feedback', function(){
            self.showFeedbackModal();
          });

          this.get('/#movies', function() {
            switch(self.which_movies()){
            case "search":
              return this.redirect('/#movies/search');
              break;
            case "recommended":
              return this.redirect('/#movies/recommended');
              break;
            default:
              return this.redirect('/#movies/browse');
              break;
            }
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
            return this.redirect('/#movies/browse');
          });

          this.get('/#user/logout', function(){
            var route = this;
            self.user().logout();
            location.hash = "movies";
            self.clearSearch();
          });

          this.get('/#user/account', function(){
            self.openProfileModal();
          });
      }).run();
  }
}
