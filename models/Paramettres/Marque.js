const mongoose = require("mongoose");

const MarqueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
});

module.exports = mongoose.model("Marque", MarqueSchema);