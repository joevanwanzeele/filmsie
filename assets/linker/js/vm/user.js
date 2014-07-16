function UserViewModel(parent, data){
  var self = this;
  self.parent = ko.observable(parent);
  self.id = ko.observable(data && data.id || '');
  self.facebook_id = ko.observable(data && data.facebook_id || null);
  self.accessToken = ko.observable();
  self.c_score = ko.observable(data && data.c_score || null)
  self.first_name = ko.observable(data && data.first_name || '');
  self.last_name = ko.observable(data && data.last_name || '');
  self.name = ko.observable(data && data.name || '');
  self.email = ko.observable(data && data.email || '');
  self.gender = ko.observable(data && data.gender || '');
  self.fb_profile_url = ko.observable(data && data.fb_profile_url || '');

  self.authenticated = ko.observable(false);
  self.friends = ko.observableArray([]);
  self.matches = ko.observableArray([]);

  self.is_showing_matches = ko.observable(false);
  self.is_showing_friends = ko.observable(false);


  self.processLogin = function(callback){
    FB.getLoginStatus(function(response) {
     if (response.status == "connected"){
       self.accessToken(response.authResponse.accessToken);
       self.authenticated(true);
       FB.api('/me', function(user) {
         if (user.error) return console.log(user.error);
         self.facebook_id(user.id);
         self.first_name(user.first_name);
         self.last_name(user.last_name);
         self.name(user.name);
         self.email(user.email);
         self.gender(user.gender);
         self.fb_profile_url(user.link);
         user["_csrf"] = window.filmsie.csrf;
         $.ajax({
           type: "POST",
           url: "/user/login",
           data: user,
           cache: false,
           success: function(data){
             self.id(data.id);
             self.parent().init();
           }
         });
       });
     } else {
       self.parent().init();
     }
    });
  }

  self.processLogout = function(callback){
    $.ajax({
      type: "POST",
      url: "/user/logout",
      data: {"_csrf": window.filmsie.csrf },
      cache: false,
      success: function(data){
        self.reset();
        parent.init();
        self.parent().loadMovies();
      }
    });
  }

  self.login = function(callback){
    FB.login(function(response) {
      self.processLogin(response, callback);
    }, {scope: 'public_profile, email, user_friends'});
  }

  self.logout = function(callback){
    FB.logout(function(response) {
      // Person is now logged out
      self.processLogout(callback);
    });
  }

  self.reset = function(){
    self.id(null);
    self.facebook_id(null);
    self.first_name(null);
    self.last_name(null);
    self.name(null);
    self.email(null);
    self.gender(null);
    self.fb_profile_url(null);
    self.authenticated(false);
  }

  self.profile_pic_url = ko.computed(function(){
    //return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=large&access_token="+ self.accessToken();
    return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=large";
  });

  self.getFriends = function(){
    self.friends([]);

    FB.api(
      "/me/friends",
      function (friends) {
        if (friends && !friends.error) {
          friends['_csrf'] = window.filmsie.csrf;

          $.ajax({
            type: "POST",
            url: "/user/friends",
            data: friends,
            cache: false,
            success: function(data){
              _.each(data, function(friend){
                var person = new UserViewModel(self, friend);
                person.accessToken(self.accessToken());
                self.friends.push(person);
              });
            }
          });
        }
    });
  },

  self.save = function(){

  }

  self.getMatches = function(){
    self.matches([]);
    $.ajax({
      type: "POST",
      url: "/user/matches",
      data: {'_csrf': window.filmsie.csrf },
      cache: false,
      success: function(data){
        _.each(data, function(match){
          var person = new UserViewModel(self, match);
          person.accessToken(self.accessToken());
          self.matches.push(person);
        });
      }
    });
  }

  self.scrolledPeople = function(){}
}
