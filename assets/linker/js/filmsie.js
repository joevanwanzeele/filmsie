function ApplicationViewModel(){
  var self = this;
  self.movies = ko.observable(new MoviesViewModel(self));
  self.user = ko.observable(new UserViewModel(self));
  self.showingMovies = ko.observable(true);
  self.showingFriends = ko.observable(false);
  self.showingLists = ko.observable(false);

  self.showFriends = function(){
    self.showingMovies(false);
    self.showingLists(false);
    self.showingFriends(true);
  }

  self.showMovies = function(){
    self.showingFriends(false);
    self.showingLists(false);
    self.showingMovies(true);
  }

  self.showLists = function(){
    self.showingFriends(false);
    self.showingMovies(false);
    self.showingLists(true);
  }

  self.init = function(){
    self.movies().userId("<%= req.session.user ? session.user.id : '' %>");
    self.movies().init();
    
    self.user().id("<%= req.session.user ? session.user.id : '' %>");
    self.user().getFriends();
  }
}
