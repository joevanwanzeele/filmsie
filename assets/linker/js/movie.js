function UserViewModel(parent){
  var self = this;
  self.parent = parent;
  self.id = ko.observable();
  self.profilePicUrl = ko.observable();
  self.friends = ko.observableArray([]);

  self.getFriends = function(){
    $.ajax({
      type: "POST",
      url: "/user/facebookFriends",
      cache: false,
      success: function(data){
        console.dir(data);
      }
    });
  }

  self.scrolledFriends = function(){}
}

function MovieListViewModel(data, parent){
  var self = this;
  self.parent = parent;
  self.id = ko.observable(data && data.id || null);
  self.name = ko.observable(data && data.name || null);
  self.movies = ko.observableArray(data && data.movieIds || data.movieIds);

  self.nameAndLength = ko.computed(function(){
    return self.name() + "<div class='list-length'>(" + self.movies().length + ")</div>"
  });

  self.addToList = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/update",
      data: {
        userId: parent.user().id(),
        listId: $(e.target).attr('list-id'),
        movie: {
          movieDbId: parent.selectedMovie().movieDbId(),
          title: parent.selectedMovie().title(),
          imageUrl: parent.selectedMovie().imageUrl(),
          bigImageUrl: parent.selectedMovie().bigImageUrl() }},

        success: function(data){
          $('#addToListModal').modal('hide');
        }
    });
  }

  self.viewList = function(vm, e){
    self.parent.showLists(vm, e);
    var listId = $(e.target).attr('list-id');
    $.ajax({
      type: "POST",
      url: "/movieList/getMoviesInList",
      data: {listId: listId},
      success: function(data){
        self.movies([]);
        _.each(data, function(movie){
          self.movies.push(new MovieViewModel(movie, self));
        })
        parent.selectedList(self);
      }
    });
  }

  self.movieDetails = function(movie){
    self.parent.movieDetails(movie);
  }

  self.thumbnailBaseUrl = parent.thumbnailBaseUrl;
}

function CastMemberViewModel(data, parent){
  var self = this;
  self.cast_id = ko.observable(data.cast_id);
  self.name = ko.observable(data.name);
  self.character = ko.observable(data.character);
  self.imageUrl = ko.observable(data.profile_path != null ? parent.parent.thumbnailBaseUrl() + data.profile_path : null); //todo: replace with empty image path if none exists for cast member
}

function MovieViewModel(data, parent) {
  var self = this;
  self.parent = parent;
  self.id = ko.observable(data && data.id || '')
  self.movieDbId = ko.observable(data && data.movieDbId || '');
  self.currentUserRating = ko.observable(data && data.currentUserRating || null);
  self.title = ko.observable(data && data.title || '');
  self.imageUrl = ko.observable(data && data.imageUrl || null);
  self.bigImageUrl = ko.observable(data && data.bigImageUrl || null);
  self.releaseDate = ko.observable();
  self.genres = ko.observableArray([]);
  self.runtime = ko.observable();
  self.synopsis = ko.observable();
  self.imdbId = ko.observable();
  self.loadingDetails = ko.observable(true);
  self.castMembers = ko.observableArray([]);
  self.castHidden = ko.observable(true);

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

  self.showListPopover = function(vm, e){
    e.stopPropagation();
    parent.selectedMovie(self);
    parent.getMovieLists();

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
    self.parent.movieDetails(self);
    self.loadingDetails(true);
    $('#movieDetailsModal').modal();

    $.ajax({
      type: "POST",
      url: "/movie/details",
      data: {movieDbId: self.movieDbId() },
      cache: false,
      success: function(data){
        self.releaseDate(moment(data.release_date).format('LL'));
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

  self.getCast = function(){
    $.ajax({
      type: "POST",
      url: "/movie/cast",
      data: { movieDbId: self.movieDbId() },
      success: function(data){
        if (data.length == 0) { $('.cast-container').html("(unavailable)"); }
          else{
          _.each(data, function(castMember){
            self.castMembers.push(new CastMemberViewModel(castMember, self));
          })
        }
      }
    });
  }

  self.toggleCast = function(){
    if (!self.castMembers().length) self.getCast();
    self.castHidden(!self.castHidden());
  }

  self.setRating = function(rating) {
    if (self.currentUserRating() == rating){
      rating = null;
    }
    self.currentUserRating(rating);
    if (!parent.user().id()) return;
    $.ajax({
      type: "POST",
      url: "/movie/rate",
      data: { movie: {
                id: self.id(),
                movieDbId: self.movieDbId(),
                title: self.title(),
                imageUrl: self.imageUrl(),
                bigImageUrl: self.bigImageUrl(),
                imdbId: self.imdbId() },
              rating: rating
            },
    });
  }

  self.amazonLink = ko.computed(function(){
    return "http://www.amazon.com/s/?tag=filmsie03-20&search-alias=dvd&keywords=%22"+self.title()+"%22";
  });
}

function GenreViewModel(data){
  var self = this;
  self.id = ko.observable(data.id);
  self.name = ko.observable(data.name);
}

function MoviesViewModel(parent) {
  var self = this;
  self.parent = parent;
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
  self.movieLists = ko.observableArray([]);
  self.newListName = ko.observable();
  self.selectedMovie = ko.observable();
  self.selectedList = ko.observable(new MovieListViewModel({}, self));
  self.movieDetails = ko.observable(new MovieViewModel({}, self));
  self.user = ko.observable(new UserViewModel(self));

  self.addToListModalTitle = ko.computed(function(){
    if (self.selectedMovie()) return "Add \"" + self.selectedMovie().title() + "\" to list";
    return "Add to list";
  });

  self.showingFriends = ko.observable(false);
  self.showingMovies = ko.observable(true);
  self.showingLists = ko.observable(false);

  self.getMovieLists = function(){
    self.movieLists([]);
    $.ajax({
      type: "POST",
      url: "/movielist/index",
      data: { userId: self.user().id() },
      success: function(data){
        _.each(data, function(list){
          self.movieLists.push(new MovieListViewModel(list, self));
        });
      }
    });
  }

  self.addNewMovieList = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/add",
      data: {
        userId: self.user().id(),
        name: self.newListName(),
        movie: {
          movieDbId: self.selectedMovie().movieDbId(),
          title: self.selectedMovie().title(),
          imageUrl: self.selectedMovie().imageUrl() } },
      success: function(data){
        _.each(data, function(list){
          self.movieLists.push(new MovieListViewModel(list, self));
        });
        $('#addToListModal').modal('hide');
        self.newListName('');
      }
    });
  }

  self.showFriends = function(vm, e){
    $('.active').removeClass('active');
    $(e.target).closest('li').addClass('active');
    if (self.user().friends().length == 0) self.user().getFriends();
    self.showingMovies(false);
    self.showingLists(false);
    self.showingFriends(true);
  }

  self.showMovies = function(vm, e){
    $('.active').removeClass('active');
    $(e.target).closest('li').addClass('active');
    self.showingLists(false);
    self.showingFriends(false);
    self.showingMovies(true);
  }

  self.showLists = function(vm, e){
    self.getMovieLists();
    $('.active').removeClass('active');
    $(e.target).closest('li').addClass('active');
    self.showingMovies(false);
    self.showingFriends(false);
    self.showingLists(true);
  }

  self.friends = ko.computed(function(){
    return self.user().friends;
  });

  self.scrolledFriends = self.user().scrolledFriends;

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

  self.openAccountModal = function(){
    //show account options in modal dialog
  };

  self.getting.subscribe(function(value){
    if (value){
      var el = "<div id='loadingMoviesPlaceholder' class='movie-container movies-loading-placeholder' data-bind='visible: getting'><img src='/img/moviesloading.gif' alt='loading' /></div>";
      if ($('.movie-container').length == 0) {
        $('.movie-table-container').html(el);
      }
      else {
        $('.movie-container').last().after(el);
      }
    } else {
      $('#loadingMoviesPlaceholder').remove();
      $('.rating-box').on("mouseover", function(){
        //add .rating-box-lower-score to less values
        var ratedElement = $(this).siblings('.rating-box-active');

        $(this).prevAll().addClass('rating-box-lower-score');
        $(this).nextAll().removeClass('rating-box-lower-score');
        ratedElement.prevAll().addClass('rating-box-lower-score');
      });
      $('.rating-container').on("mouseout", function(){
        var ratedElement = $(this).children('.rating-box-active');
        if (ratedElement.length > 0){
          ratedElement.removeClass('rating-box-lower-score');
          ratedElement.nextAll().removeClass('rating-box-lower-score');
          ratedElement.prevAll().addClass('rating-box-lower-score');
        } else {
          $(this).children('.rating-box').removeClass('rating-box-lower-score');
        }
      });
    }
  });

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

  self.init = function(){
    self.getConfigSettings();
    self.getGenres();
    self.getMovieLists();
  }

  self.selectedGenres.subscribe(self.search);
  self.selectedYear.subscribe(self.search);
}
