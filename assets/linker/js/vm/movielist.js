function MovieListViewModel(parent, data){
  var self = this;
  self.parent = ko.observable(parent);
  self.id = ko.observable(data && data.id || null);
  self.name = ko.observable(data && data.name || null);
  self.movie_ids = ko.observableArray(data && data.movie_ids || []);
  self.movies = ko.observableArray([]);
  self.is_public = ko.observable(true && (data ? data.is_public : true));
  self.user_id = ko.observable(data && data.user_id);
  self.name_and_length = ko.computed(function(){
    return self.name() + "<span class='badge'>" + self.movie_ids().length + "</span>";
  });

  self.is_owner = ko.computed(function(){
    return self.user_id() == self.parent().user().id();
  });


  self.addMovie = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/addMovie",
      data: {
        user_id: self.parent().user().id(),
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
          self.movies.push(new MovieViewModel(self, movie));
        })
        self.name.subscribe(self.saveChanges);
        self.is_public.subscribe(self.saveChanges);
      }
    });
  }

  self.twitterLink = ko.computed(function(){
    return "https://twitter.com/intent/tweet?url=" +
      encodeURIComponent("http://www.filmsie.com/#lists/" + self.id()) +
      "&hashtags=filmsie&text=" + self.name();
  });

  self.movie_details = self.parent().movie_details;
  self.thumbnail_base_url = self.parent().thumbnail_base_url;
  self.large_image_base_url = self.parent().large_image_base_url;
  self.user = self.parent().user;
}
