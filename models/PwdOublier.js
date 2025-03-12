const mongoose = require("mongoose");

const PwdOublierSchema = new mongoose.Schema({
  User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, 
  securityCode: { type: String, required: true }, 
  dates: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PwdOublier", PwdOublierSchema);
