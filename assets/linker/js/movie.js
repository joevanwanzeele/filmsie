function MovieViewModel(data, parent) {
  var self = this;
  self.id = ko.observable(data && data.id || '');
  self.currentUserRating = ko.observable(data && data.currentUserRating || null);
  self.title = ko.observable(data && data.title || '');
  self.imageUrl = ko.observable();
  self.bigImageUrl = ko.observable();
  self.releaseDate = ko.observable();
  self.genres = ko.observableArray([]);
  self.runtime = ko.observable();
  self.synopsis = ko.observable();
  self.imdbId = ko.observable();
  self.loadingDetails = ko.observable(true);

  self.genresString = ko.computed(function(){
    return self.genres().join(", ");
  });

  self.imdbUrl = ko.computed(function(){
    return "http://www.imdb.com/title/" + self.imdbId() + "/";
  });

  self.ratingClass = function(value){
    if (self.currentUserRating() == null) return '';
    if (self.currentUserRating() == value) return 'rating-box-active';
    if (self.currentUserRating() > value) return 'rating-box-lower-score';
    return 'rating-box-inactive';
  }

  self.showDetails = function(){
    parent.movieDetails(self);
    self.loadingDetails(true);
    $('#movieDetailsModal').modal();

    $.ajax({
      type: "POST",
      url: "/movie/details",
      data: {movieDbId: self.id() },
      cache: false,
      success: function(data){
        self.releaseDate(data.release_date);
        _.each(data.genres, function(genre){
          self.genres.push(genre.name);
        });
        self.runtime(data.runtime);
        self.synopsis(data.overview);
        self.imdbId(data.imdb_id);
        self.loadingDetails(false);
      }
    });
  }

  self.setRating = function(rating) {
    if (self.currentUserRating() == rating){
      rating = null;
    }
    self.currentUserRating(rating);
    if (!$('#userId').val()) return;
    $.ajax({
      type: "POST",
      url: "/movie/rate",
      data: { movieDbId: self.id(),
              imdbId: self.imdbId(),
              rating: rating },
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
  self.totalResults = ko.observable(0);
  self.movies = ko.observableArray([]);
  self.searchParameters = ko.observable();
  self.page = ko.observable(0);
  self.getting = ko.observable(false);
  self.maxInView = self.itemsToGet * 3;
  self.searchQuery = ko.observable();
  self.thumbnailBaseUrl = ko.observable();
  self.largeImageBaseUrl = ko.observable();
  self.genres = ko.observableArray([]);
  self.selectedGenres = ko.observableArray([]);
  self.selectedYear = ko.observable();

  self.movieDetails = ko.observable(new MovieViewModel());

  self.getConfigSettings = function(){
    if (!self.thumbnailBaseUrl()){
      $.ajax({
        type: "POST",
        url: "/movie/getConfigSettings",
        success: function(data){
            self.thumbnailBaseUrl(data.images.base_url + data.images.poster_sizes[2]);
            self.largeImageBaseUrl(data.images.base_url + data.images.poster_sizes[5]);
            self.getMovies();
        }
      });
    }
  }

  self.hasSelectedYear = ko.computed(function(){
    return self.selectedYear() != null;
  });

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
      success: function(data){
        _.each(data.genres, function(genre){
          self.genres.push(new GenreViewModel(genre));
        });
      }
    });
  }

  self.getMovies = function(){
    if (self.totalResults() == self.movies().length && self.movies().length != 0) return;

    if (self.getting() === true) return;
    self.getting(true);

    self.page(self.page() + 1);
    var genres = self.selectedGenres()[0] && self.selectedGenres()[0] != undefined
        ? _.map(self.selectedGenres(), function(genre){ return genre.id; })
        : null;

    $.ajax({
      type: "POST",
      url: "/movie/search",
      data: {page: self.page(), q: self.searchQuery(), year: self.selectedYear(), genres: genres },
      cache: false,
      success: function(data){
            self.totalResults(data.total_results);
            _.each(data.results, function(movie, i){
              if (i == data.results.length) return;
              var newMovie = new MovieViewModel(movie, self);
              if (movie.poster_path){
                newMovie.imageUrl(self.thumbnailBaseUrl() + movie.poster_path);
                newMovie.bigImageUrl(self.largeImageBaseUrl() + (movie.backdrop_path || movie.poster_path));
              }
              self.movies.push(newMovie);
            });
            self.getting(false);
          }
    });

    self.selectedGenres.subscribe(function(){self.page(0); self.movies([]); self.getMovies();});
    self.selectedYear.subscribe(function(){self.page(0); self.movies([]); self.getMovies();});
  }

  self.scrolled = function(data, event){
    var el = event.target;
    var cols = Math.floor($(el).width() / 166);
    var totalRows = self.movies().length / cols;
    var rowHeight = 170;
    var viewRows = Math.floor($(el).height() / rowHeight);

    var triggerBottomPosition = rowHeight * (totalRows - 1);

    if ($(el).scrollTop() > triggerBottomPosition){
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
}
