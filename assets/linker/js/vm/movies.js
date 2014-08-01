function MoviesViewModel(current_user) {
  var self = this;
  self.current_user = current_user;
  self.total_results = ko.observable(0);
  self.movies = ko.observableArray([]);
  self.page = ko.observable(0);
  self.getting = ko.observable(false);
  self.search_query = ko.observable();

  self.genres = ko.observableArray([]);
  self.selected_genres = ko.observableArray([]);
  self.selected_year = ko.observable();
  self.years = ko.observableArray([]);

  self.which_movies = ko.observable("browse");

  self.which_movies.subscribe(function(value){
      switch (value) {
        case 'search':
          $('#searchOptions').collapse('show');
          break;
        default:
          $('#searchOptions').collapse('hide');
      }
  });

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
    return "showing " + self.movies().length + " of " + self.total_results();
  });

  self.clearSearch = function(){
    self.search_query('');
    self.selected_genres([]);
    //self.selected_year(null);
    self.total_results(0);
  }

  self.searchButtonSearch = function(root){
    self.search();
    root.closeMenu();
  }

  self.search = function(){
    if (self.getting()) return;
    self.movies([]);
    self.page(0);
    self.getMovies();
  }

  self.searchOnEnter = function(root, data, event){
    if (event.keyCode == 13) self.searchButtonSearch(root);
    return true;
  }

  self.showSearchOptions = function(vm, e){
    location.hash = "movies/search"
  }

  self.showRecommendations = function(vm, e){
    location.hash = "movies/recommended"
  }

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
        self.selected_genres.subscribe(self.search);
      }
    });
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
          self.movies.push(new MovieViewModel(movie, self.current_user));
        });
        self.getting(false);
        $('.movie-table-container').scroll(); //this is to load more if the initial load doesn't fill the view area
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
          self.movies.push(new MovieViewModel(movie, self.current_user));
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
    self.getting(true);

    self.selected_genres([]);
    self.selected_year(null);
    self.which_movies("browse");

    self.getGenres();


    var years = [];
    var currentYear = new Date().getFullYear();
    for (var i=1905; i <= currentYear; i++){
      years.unshift(i);
    }

    self.years(years);

    self.selected_year.subscribe(self.search);
    //self.search_query.subscribe(function(value){ if (value) self.search();});

    self.getting(false);
  }

  self.loadMovies = function(which){
    self.which_movies('');
    $('.movies-nav .active').removeClass('active');

    switch(which){
      case "recommended":
        $('.recommend-btn').addClass('active');
        self.which_movies("recommended");
        self.movies([]);
        self.getRecommendedMovies();
        break;
      case "search":
        $('.search-btn').addClass('active');
        self.which_movies("search");
        self.clearSearch();
        break;
      case "browse":
        $('.browse-btn').addClass('active');
        self.which_movies("browse");
        self.clearSearch();
        self.search();
        break;
    }
  }
}
