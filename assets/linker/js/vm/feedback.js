function FeedbackViewModel(){
  var self = this;
  self.feedback_type = ko.observable("comment");
  self.message = ko.observable();
  self.sending = ko.observable(false);
  self.sent = ko.observable(false);

  self.sent.subscribe(function(value){
    setTimeout(function(){
      $('#feedbackModal').modal("hide");
      self.sent(false);
      self.feedback_type("comment");
      self.message(null);
    },
    3000);
  });

  self.confirmMessage = ko.computed(function(){
    if (self.feedback_type() == "question"){
      return "We will respond to your question as soon as possible.";
    }
    return "Your comments are appreciated."
  });

  self.submitFeedback = function(){
    self.sending(true);
    $.ajax({
      type: "POST",
      url: "/feedback/create",
      data: {
        feedback_type: self.feedback_type(),
        message: self.message(),
        '_csrf': window.filmsie.csrf
      },
      success: function(data){
        if (data == "feedback submitted"){
          self.sent(true);
        }
        self.sending(false);
      }
    });
  }
}
