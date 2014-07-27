function MovieReviewViewModel(data, current_user){
  var self = this;
  self.current_user = current_user;
  self.id = ko.observable(data && data.id || null);
  self.user_id = ko.observable(data && data.user_id || null);
  //self.movie = ko.observable(parent);
  self.createdAt = ko.observable(data && data.createdAt);
  self.content = ko.observable(data && data.content || null);
  self.up_votes = ko.observable(data && data.up_votes || 0);
  self.down_votes = ko.observable(data && data.down_votes || 0);
  self.current_user_vote = ko.observable(data && data.current_user_vote || null)

  self.movie_title = ko.observable(data && data.movie_title || null);
  self.movie_poster_path = ko.observable(data && data.movie_poster_path || null)

  self.movie_image_url = function(root){
    return self.movie_poster_path() ?
      root.thumbnail_base_url() + self.movie_poster_path() :
      root.not_found_image_url;
    }

  self.reviewer_name = ko.observable(data && data.reviewer_first_name || null);
  self.reviewer_facebook_id = ko.observable(data && data.reviewer_facebook_id || null);
  self.reviewer_rating = ko.observable(data && data.reviewer_rating || null);

  self.review_score = ko.computed(function(){
    return self.up_votes() - self.down_votes();
  });

  self.reviewer_picture_url = ko.computed(function(){
    return "https://graph.facebook.com/"+ self.reviewer_facebook_id() + "/picture?type=large&access_token=" + self.current_user().accessToken();
  });

  self.is_owner = ko.computed(function(){
    return self.user_id() == self.current_user().id();
  });

  self.average_star_css = function(value){
    if (value > self.reviewer_rating() + 1 || self.reviewer_rating() == 0) return "";
    return self.reviewer_rating() < value ? "fa-star-half" : "fa-star";
  }

  self.thumb_up_style = ko.computed(function(){
    if (self.current_user_vote() == "up") return "fa-thumbs-up";
    return "fa-thumbs-o-up";
  });

  self.thumb_down_style = ko.computed(function(){
    if (self.current_user_vote() == "down") return "fa-thumbs-down";
    return "fa-thumbs-o-down";
  });

  self.created_date = ko.computed(function(){
    return moment(self.createdAt()).format('LL')
  });

  self.vote = function(direction){
    if (!self.current_user().authenticated()) return bootbox.alert("sign in to vote!");

    if (self.current_user_vote() == direction) direction = "none"; //toggle removing vote
    self.current_user_vote(direction);

    $.ajax({
      url: '/review/vote',
      type: 'POST',
      data: {
        review_id: self.id(),
        direction: direction,
        "_csrf": window.filmsie.csrf
      },
      success: function(data){
        self.up_votes(data.up_votes);
        self.down_votes(data.down_votes);

        if (data == "deleted"){
          return self.current_user_vote(null);
        }
        self.current_user_vote(data.vote);
      }
    });
  }

  self.voteUp = function(){
    self.vote("up");
  }

  self.voteDown = function(){
    self.vote("down");
  }
}
