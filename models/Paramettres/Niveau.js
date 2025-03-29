const mongoose = require("mongoose");

const NiveauSchema = new mongoose.Schema({
    nom: { type: String, required: true, unique: true }, // Exemple : "Facile", "Moyen", "Difficile"
    pourcentage: { type: Number, required: true } // Pourcentage supplémentaire sur le prix de base (ex: 10% pour "Difficile")
}, { timestamps: true });

module.exports = mongoose.model("Niveau", NiveauSchema);
