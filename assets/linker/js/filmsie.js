function ApplicationViewModel(){
  var self = this;
  self.movies = ko.observable(new MoviesViewModel(self));
  self.user = ko.observable(new UserViewModel(self));
}
