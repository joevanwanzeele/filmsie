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
  self.isAdmin = ko.observable();  //change it if you want, we validate on the server. ;)
  self.friends = ko.observableArray([]);
  self.matches = ko.observableArray([]);
  self.loading_profile = ko.observable(false);
  self.created_date = ko.observable(data && data.createdAt || null);
  self.favorite_movies = ko.observableArray([]);
  self.least_favorite_movies = ko.observableArray([]);
  self.reviews = ko.observableArray([]);
  self.receive_emails = ko.observable(true && (data ? data.receive_emails : true));
  self.not_found_image_url = "../img/unavailable-image.jpeg";

  self.match_percent = ko.computed(function(){
    return Math.round(self.match_score());
    //return Math.round(self.c_score() * 100);
  });

  self.member_time = ko.computed(function(){
    var begin_date = moment(self.created_date());
    return begin_date.fromNow(true);
  });

  self.profile_pic_url = ko.computed(function(){
    if (!self.facebook_id() || !self.accessToken()) return self.not_found_image_url;
    return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=large&access_token=" + self.accessToken();
  });

  self.profile_pic_url_small = ko.computed(function(){
    if (!self.facebook_id() || !self.accessToken()) return self.not_found_image_url;
    return "https://graph.facebook.com/"+ self.facebook_id() + "/picture?type=square&access_token=" + self.accessToken();
  });
}
