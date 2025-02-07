const mongoose = require("mongoose");

const Word = mongoose.model("Word", {
  wordForm: String,
  def: String,
  example: String,
});

module.exports = Word;
