function MovieListViewModel(data, current_user){
  var self = this;
  self.current_user = current_user;
  self.thumbnail_base_url = ko.observable();
  self.large_image_base_url = ko.observable();
  self.id = ko.observable(data && data.id || null);
  self.name = ko.observable(data && data.name || null);
  self.movie_ids = ko.observableArray(data && data.movie_ids || []);
  self.movies = ko.observableArray([]);
  self.is_public = ko.observable(true && (data ? data.is_public : true));
  self.user_id = ko.observable(data && data.user_id || null);
  self.name_and_length = ko.computed(function(){
    return self.name() + "<span class='badge'>" + self.movie_ids().length + "</span>";
  });

  self.is_owner = ko.computed(function(){
    return self.user_id() == self.current_user().id();
  });

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
        if (data == "list does not exist") return bootbox.alert("List no longer exists");
        self.movies([]);
        self.name(data.list.name);
        self.is_public(data.list.is_public);
        self.user_id(data.list.user_id);
        _.each(data.movies, function(movie){
          self.movies.push(new MovieViewModel(movie, self.current_user));
        });

        self.name.subscribe(self.saveChanges);
        self.is_public.subscribe(self.saveChanges);
      }
    });
  }
}
