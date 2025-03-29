const mongoose = require("mongoose");

const MoteurSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
});

module.exports = mongoose.model("Moteur", MoteurSchema);