function CastMemberViewModel(data, parent){
  var self = this;
  self.parent = ko.observable(parent);
  self.cast_id = ko.observable(data.cast_id);
  self.name = ko.observable(data.name);
  self.character = ko.observable(data.character);
  self.image_url = ko.observable(data.profile_path != null ?
    self.parent().parent().thumbnail_base_url() + data.profile_path :
    self.parent().not_found_image_url); //todo: replace with empty image path if none exists for cast member
}

function MovieViewModel(data, parent) {
  var self = this;
  self.parent = ko.observable(parent);
  self.id = ko.observable(data && data.id || '')
  self.tmdb_id = ko.observable(data && data.tmdb_id || '');
  self.current_user_rating = ko.observable(data && data.current_user_rating || null);
  self.average_rating = ko.observable(data && data.average_rating || null);
  self.title = ko.observable(data && data.title || '');
  self.backdrop_path = ko.observable(data && data.backdrop_path || null);
  self.poster_path = ko.observable(data && data.poster_path || null);
  self.genres = ko.observableArray([]);
  self.runtime = ko.observable();
  self.synopsis = ko.observable();
  self.imdb_id = ko.observable();
  self.is_loading_details = ko.observable(true);
  self.is_loading_cast = ko.observable(false);
  self.cast_members = ko.observableArray([]);
  self.cast_is_hidden = ko.observable(true);
  self.temp_rating = ko.observable(self.current_user_rating());
  self.release_date = ko.observable(data && data.release_date || null);
  self.review_count = ko.observable(data && data.review_count || 0)
  //reviews
  self.reviews = ko.observableArray([]);
  self.new_review_text = ko.observable();

  self.reviewCountText = ko.computed(function(){
    return self.review_count() > 0 ? self.review_count() : '';
  });

  self.showReviewsModal = function(vm, e){
    e.stopPropagation();
    parent.selected_movie(self);
    self.getReviews();

    $('#reviewsModal').modal();
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

  self.reviewsModalTitle = ko.computed(function(){
    return "Reviews for " + self.title();
  });

  self.saveReview = function(){
    $.ajax({
      url: '/review/add',
      type: 'POST',
      data: {
        user_id: self.parent().user().id(),
        movie: {
          id: self.id(),
          tmdb_id: self.tmdb_id(),
          title: self.title(),
          poster_path: self.poster_path(),
          backdrop_path: self.backdrop_path(),
          imdb_id: self.imdb_id(),
          release_date: self.release_date() },
        review_content: self.new_review_text(),
        '_csrf': window.filmsie.csrf },
      success: function(data){
        if (!data.review) return alert(data);
        self.review_count(data.review_count);
        self.reviews.push(new MovieReviewViewModel(self, data.review));
      }
    });
  }

  self.getReviews = function(){
    self.reviews([]);
    $.ajax({
      url: '/review/get',
      type: 'POST',
      data: {
        movie_id: self.id(),
        '_csrf': window.filmsie.csrf
      },
      success: function(reviews){
        _.each(reviews, function(review){
          self.reviews.push(new MovieReviewViewModel(self, review));
        });
        self.reviews.sort(function(a,b){ return b.review_score() - a.review_score() }); //sort by review vote
      }
    });
  }

  self.current_user_has_reviewed = ko.computed(function(){
    var review = _.find(self.reviews(), function(review){ return review.user_id() == self.parent().user().id() });
    return typeof review != "undefined";
  });

  self.not_found_image_url = "../img/unavailable-image.jpeg";

  self.image_url = ko.computed(function(){
    return self.parent().thumbnail_base_url() && self.poster_path() ?
      self.parent().thumbnail_base_url() + self.poster_path() :
      self.not_found_image_url;
  });

  self.big_image_url = ko.computed(function(){
    var image_path = self.backdrop_path() || self.poster_path();

    return (self.parent().large_image_base_url() && image_path) ?
      self.parent().large_image_base_url() + image_path :
      '';
  });

  self.genresString = ko.computed(function(){
    return self.genres().join(", ");
  });

  self.formatted_release_date = ko.computed(function(){
    return moment(self.release_date()).format('LL')
  });

  self.title_and_year = ko.computed(function(){
    var year = self.release_date() ? " (" + moment(self.release_date()).get('year') + ")" : "";
    return self.title() + year;
  });

  self.imdb_url = ko.computed(function(){
    return "http://www.imdb.com/title/" + self.imdb_id() + "/";
  });

  self.rounded_average = ko.computed(function(){
    return .5 * self.average_rating() / .5;
  });

  self.average_star_css = function(value){
    var rounded_rating = Math.round(self.average_rating());
    if (value > rounded_rating + 1 || rounded_rating == 0) return "";
    return rounded_rating < value ? "fa-star-half" : "fa-star";
  }

  self.showAddToListModal = function(vm, e){
    e.stopPropagation();

    if (!self.parent().user().authenticated()) return alert("sign in to create movie lists");

    self.parent().selected_movie(self);
    self.parent().get_movie_lists();

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
    self.parent().movie_details(self);
    self.is_loading_details(true);
    $('#movie_details_modal').modal();

    $.ajax({
      type: "POST",
      url: "/movie/details",
      data: {
        tmdb_id: self.tmdb_id(),
        '_csrf': window.filmsie.csrf
      },
      cache: false,
      success: function(data){
        self.release_date(new Date(data.release_date));
        _.each(data.genres, function(genre){
          self.genres.push(genre.name);
        });
        self.runtime(data.runtime);
        self.synopsis(data.overview);
        self.imdb_id(data.imdb_id);
        self.is_loading_details(false);
      }
    });
  }

  self.getCast = function(){
    self.is_loading_cast(true);
    $.ajax({
      type: "POST",
      url: "/movie/cast",
      data: {
        tmdb_id: self.tmdb_id(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        console.dir(data);
        if (data.length == 0) { $('.cast-container').html("(unavailable)"); }
          else{
          _.each(data, function(castMember){
            self.cast_members.push(new CastMemberViewModel(castMember, self));
          });

        }
        self.is_loading_cast(false);
      }
    });
  }

  self.toggleCast = function(vm, e){
    e.stopPropagation();

    if (!self.cast_members().length) self.getCast();
    self.cast_is_hidden(!self.cast_is_hidden());
  }

  self.ratingClass = function(value, event){
    if (self.temp_rating() == null) return '';

    //values will be 1-5 while current_user_rating is stored as 1-10
    var temp_rating = self.temp_rating() / 2;

    if (temp_rating == value || (temp_rating - .5) >= value) return 'fa-star golden';
    if (temp_rating == value - .5) return 'fa-star-half-o golden';
    return 'fa-star-o';
  }

  self.updateRatingClass = function(vm, event){
    var el = $(event.target);
    var star_value = Number($(el).attr('star')) * 2;

    var x_coordinate = event.pageX - el.offset().left;

    var is_in_left_half = x_coordinate < el.width() / 2;

    if (is_in_left_half){
      self.temp_rating(star_value - 1);
      return;
    }
    self.temp_rating(star_value);
  }

  self.resetRatingClasses = function(){
    self.temp_rating(self.current_user_rating());
  }

  self.setRating = function(rating, event) {
    if (!self.parent().user().authenticated()){
      return alert("Sign in to save your rating");
    };

    var el = $(event.target);

    var rating_value = rating * 2;
    var x_coordinate = event.pageX - el.offset().left;
    var is_in_left_half = x_coordinate < el.width() / 2;

    if (is_in_left_half){
      rating_value -= 1;
    }

    if (self.current_user_rating() == rating_value){
      rating_value = null; //allows user to clear their rating
    }

    self.current_user_rating(rating_value);


    $.ajax({
      type: "POST",
      url: "/movie/rate",
      data: { movie: {
                id: self.id(),
                tmdb_id: self.tmdb_id(),
                title: self.title(),
                poster_path: self.poster_path(),
                backdrop_path: self.backdrop_path(),
                imdb_id: self.imdb_id(),
                release_date: self.release_date() },
              rating: rating_value,
              '_csrf': window.filmsie.csrf
            },
    });
  }

  self.amazon_link = ko.computed(function(){
    return "http://www.amazon.com/s/?tag=filmsie03-20&search-alias=dvd&keywords=%22"+self.title()+"%22";
  });
}
