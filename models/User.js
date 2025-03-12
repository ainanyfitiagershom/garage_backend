const mongoose = require("mongoose");

// Définition du schéma utilisateur avec un champ pour le rôle
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  tel: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, 
  dates: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
