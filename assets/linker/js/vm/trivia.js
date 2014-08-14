function TriviaQuestionViewModel(data){
  var self = this;
  self.question_text = ko.observable()
  self.answer_choices = ko.observableArray([]);
  self.selected_answer = ko.observable();

  self.addAnswerChoice = function(){
    self.answer_choices.push("");
  }

  self.submitAnswer = function(){
    //save answer, return correct answer.
  }
}
