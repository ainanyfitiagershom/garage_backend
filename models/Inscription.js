const mongoose = require("mongoose");

const InscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  tel: { type: String, required: true, maxlength: 10 },
  securityCode: { type: String, required: true }, 
  dates: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Inscription", InscriptionSchema);
