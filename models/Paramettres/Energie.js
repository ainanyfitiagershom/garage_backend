const mongoose = require("mongoose");

const EnergieSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
});

module.exports = mongoose.model("Energie", EnergieSchema);