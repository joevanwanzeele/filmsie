function UserViewModel(data){
  var self = this;
  self.parent = ko.observable(parent);
  self.id = ko.observable(data && data.id || '');
  self.facebook_id = ko.observable(data && data.facebook_id || null);
  self.accessToken = ko.observable();
  self.c_score = ko.observable(data && data.c_score || null);
  self.match_score = ko.observable(data && data.match_score || null);
  self.rating_count = ko.observable(data && data.rating_count || 0);
  self.review_count = ko.observable(data && data.review_count || 0);
  self.first_name = ko.observable(data && data.first_name || '');
  self.last_name = ko.observable(data && data.last_name || '');
  self.name = ko.observable(data && data.name || '');
  self.email = ko.observable(data && data.email || '');
  self.gender = ko.observable(data && data.gender || '');
  self.fb_profile_url = ko.observable(data && data.fb_profile_url || '');
  self.showing_user_profile = ko.observable(false);
  self.authenticated = ko.observable(false);
  self.friends = ko.observableArray([]);
  self.matches = ko.observableArray([]);
  self.loading_profile = ko.observable(false);
  self.created_date = ko.observable(data && data.createdAt || null);
  self.favorite_movies = ko.observableArray([]);
  self.least_favorite_movies = ko.observableArray([]);
  self.reviews = ko.observableArray([]);

  self.match_percent = ko.computed(function(){
    return self.match_score() * 100;
  });

  self.member_time = ko.computed(function(){
    var begin_date = moment(self.created_date());
    return begin_date.fromNow(true);
  });

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

  // self.reset = function(){
  //   self.id(null);
  //   self.facebook_id(null);
  //   self.first_name(null);
  //   self.last_name(null);
  //   self.name(null);
  //   self.email(null);
  //   self.gender(null);
  //   self.fb_profile_url(null);
  //   self.authenticated(false);
  // }

  self.profile_pic_url = ko.computed(function(){
    return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=large&access_token=" + self.accessToken();
  });

  self.profile_pic_url_small = ko.computed(function(){
    return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=square&access_token=" + self.accessToken();
  });
}
