function MovieListsViewModel(current_user){
  var self = this;
  self.current_user = current_user;
  self.movie_lists = ko.observableArray([]);
  self.selected_list = ko.observable();
  self.selected_movie = ko.observable()
  self.new_list_name = ko.observable();
  self.list_name_is_valid = ko.observable(true);

  self.thumbnail_base_url = ko.observable();
  self.large_image_base_url = ko.observable();

  self.getting_lists = ko.observable(false);

  self.addToListModalTitle = ko.computed(function(){
    if (self.selected_movie()) return "Add \"" + self.selected_movie().title() + "\" to list";
    return "Add to list";
  });

  self.addMovie = function(vm, e){
    $.ajax({
      type: "POST",
      url: "/movielist/addMovie",
      data: {
        list_id: vm.id(),
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
        $('#addToListModal').modal('hide');
      }
    });
  }

  self.get_movie_lists = function(list_id, show_list_page){
    self.getting_lists(true);

    self.movie_lists([]);

    $.ajax({
      type: "POST",
      url: "/movielist/index",
      data: {
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        if (!list_id && data.length && show_list_page){
          return location.hash = "lists/" + data[0].id;
        }
        _.each(data, function(list){
          var newList = new MovieListViewModel(list, self.current_user);
          self.movie_lists.push(newList);

          if (newList.id() == list_id){
            self.selected_list(newList);
          }
          if (self.selected_list()) self.selected_list().getList();
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
        user_id: self.current_user().id(),
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
          self.movie_lists.push(new MovieListViewModel(list, self.current_user));
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
            self.get_movie_lists();
          }
          else { console.log(data); }
        }
      });

    });
  }
}
