const mongoose = require("mongoose");

const Favorite = mongoose.model("Favorite", {
  favId: String,
  favName: String,
  favDescription: String,
  favPath: String,

  favOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Favorite;
