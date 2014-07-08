function UserViewModel(parent){
  var self = this;
  self.parent = parent;
  self.id = ko.observable();
  self.profilePicUrl = ko.observable();
  self.friends = ko.observableArray([]);
  self.firstName = ko.observable();
  self.lastName = ko.observable();
  self.email = ko.observable();
  self.fbProfileUrl = ko.observable();

  self.name = ko.computed(function(){
    return self.firstName() + " " + self.lastName();
  });

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
  self.movieIds = ko.observableArray(data && data.movieIds || data.movieIds);
  self.movies = ko.observableArray();
  self.isPublic = ko.observable(data.isPublic);

  self.nameAndLength = ko.computed(function(){
    self.movieIds();
    return self.name() + "<div class='list-length'>(" + self.movieIds().length + ")</div>"
  });

  self.addToList = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/update",
      data: {
        userId: self.parent.user().id(),
        listId: $(e.target).attr('list-id'),
        movie: {
          movieDbId: parent.selectedMovie().movieDbId(),
          title: parent.selectedMovie().title(),
          imageUrl: parent.selectedMovie().imageUrl(),
          bigImageUrl: parent.selectedMovie().bigImageUrl(),
          releaseDate: parent.selectedMovie().releaseDate()
        }
      },
      success: function(data){
        $('#addToListModal').modal('hide');
      }
    });
  }

  self.removeMovie = function(movie){
    var movieId = movie.id();

    $.ajax({
      type: "POST",
      url: "/movielist/removeMovie",
      data: { listId: self.id(), movieId: movieId },
      success: function(movieIds){
        self.movieIds(_.without(self.movieIds(), movieId));
        self.movies(_.without(self.movies(), movie));
      }
    });
  }

  self.viewList = function(vm, e){
    self.parent.showLists(vm, e);
    self.id($(e.target).attr('list-id'));
    self.getList();
  }

  self.getList = function(){
    $.ajax({
      type: "POST",
      url: "/movieList/getMoviesInList",
      data: {listId: self.id()},
      success: function(data){
        self.movies([]);
        _.each(data, function(movie){
          self.movies.push(new MovieViewModel(movie, self));
        })
        parent.selectedList(self);
      }
    });
  }

  self.movieDetails = self.parent.movieDetails;
  self.thumbnailBaseUrl = self.parent.thumbnailBaseUrl;
  self.user = self.parent.user;
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
  self.releaseDate = ko.observable(data && data.release_date || data.releaseDate);
  self.genres = ko.observableArray([]);
  self.runtime = ko.observable();
  self.synopsis = ko.observable();
  self.imdbId = ko.observable();
  self.loadingDetails = ko.observable(true);
  self.castMembers = ko.observableArray([]);
  self.castHidden = ko.observable(true);
  self.tempRating = ko.observable(self.currentUserRating());

  self.genresString = ko.computed(function(){
    return self.genres().join(", ");
  });

  self.formattedReleaseDate = ko.computed(function(){
    return moment(self.releaseDate()).format('LL')
  });

  self.titleAndYear = ko.computed(function(){
    var year = self.releaseDate() ? " (" + moment(self.releaseDate()).get('year') + ")" : "";
    return self.title() + year;
  });

  self.imdbUrl = ko.computed(function(){
    return "http://www.imdb.com/title/" + self.imdbId() + "/";
  });

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
        self.releaseDate(new Date(data.release_date));
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

  self.ratingClass = function(value, event){
    if (self.tempRating() == null) return '';

    //values will be 1-5 while currentUserRating is stored as 1-10
    var tempRating = self.tempRating() / 2;

    if (tempRating == value || (tempRating - .5) >= value) return 'fa-star golden';
    if (tempRating == value - .5) return 'fa-star-half-o golden';
    return 'fa-star-o';
  }

  self.updateRatingClass = function(vm, event){
    var el = $(event.target);
    var starValue = Number($(el).attr('star')) * 2;

    var xCoord = event.pageX - el.offset().left;

    var inLeftHalf = xCoord < el.width() / 2;

    if (inLeftHalf){
      self.tempRating(starValue - 1);
      return;
    }
    self.tempRating(starValue);
  }

  self.resetRatingClasses = function(){
    self.tempRating(self.currentUserRating());
  }

  self.setRating = function(rating, event) {
    var el = $(event.target);

    var ratingValue = rating * 2;
    var xCoord = event.pageX - el.offset().left;
    var inLeftHalf = xCoord < el.width() / 2;

    if (inLeftHalf){
      ratingValue -= 1;
    }

    if (self.currentUserRating() == ratingValue){
      ratingValue = null; //allows user to clear their rating
    }

    self.currentUserRating(ratingValue);

    if (!self.parent.user().id()) return;
    $.ajax({
      type: "POST",
      url: "/movie/rate",
      data: { movie: {
                id: self.id(),
                movieDbId: self.movieDbId(),
                title: self.title(),
                imageUrl: self.imageUrl(),
                bigImageUrl: self.bigImageUrl(),
                imdbId: self.imdbId(),
                releaseDate: self.releaseDate() },
              rating: ratingValue
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
          imageUrl: self.selectedMovie().imageUrl(),
          bigImageUrl: self.selectedMovie().bigImageUrl(),
          releaseDate: self.selectedMovie().releaseDate()
        }
      },
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
    self.search();
    $('.active').removeClass('active');
    $(e.target).closest('li').addClass('active');
    self.showingLists(false);
    self.showingFriends(false);
    self.showingMovies(true);
  }

  self.showLists = function(vm, e){
    self.getMovieLists();
    self.selectedList().getList();
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

  self.openProfileModal = function(){
    //show account options in modal dialog
    $('#userProfileModal').modal();
  };

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
              else{
                newMovie.imageUrl("../img/unavailable-image.jpeg");
              }
              self.movies.push(newMovie);
            });
            $('.movie-table-container').scroll(); //this is to load more if the initial load doesn't fill the view area
            self.getting(false);
          }
    });
  }

  self.scrolled = function(data, event){
    var lastMovie = self.movies(self.movies())

    var viewPortEl = $(event.target);
    var lastMoviePosition = viewPortEl
                              .children('.movie-container')
                              .last()
                              .offset().top;
    var lastMovieInList = viewPortEl.children('.movie-container').last();

    if (!lastMovieInList){
      self.getMovies();
      return;
    }

    if (lastMoviePosition < viewPortEl.height()){
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
