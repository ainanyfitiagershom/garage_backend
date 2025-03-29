const mongoose = require("mongoose");

// Définition du schéma utilisateur avec un champ pour le rôle
const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mdp: { type: String, required: true }, // Mot de passe haché
  contact: { type: String, required: true },
  adresse: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, 
  dates: { type: Date, default: Date.now },
  salaire_mensuel: { type: Number, required: true },
  specialites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' }] // Spécialités liées aux catégories de réparation
}, { timestamps: true });
  

module.exports = mongoose.model("User", UserSchema);
