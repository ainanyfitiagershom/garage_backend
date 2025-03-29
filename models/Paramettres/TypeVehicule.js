const mongoose = require("mongoose");

const TypeVehiculeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
});

module.exports = mongoose.model("TypeVehicule", TypeVehiculeSchema);