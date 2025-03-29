const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  marque: { type: mongoose.Schema.Types.ObjectId, ref: "Marque", required: true }, 
  typeVehicule: { type: mongoose.Schema.Types.ObjectId, ref: "TypeVehicule", required: true }, 
});

module.exports = mongoose.model("Model", ModelSchema);
