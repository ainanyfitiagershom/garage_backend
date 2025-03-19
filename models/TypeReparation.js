const mongoose = require("mongoose");

const TypeReparationSchema = new mongoose.Schema({
    nom: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    categories: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie", required: true }, // Lien vers la catégorie
    temps_estime: { type: Number, required: true }, // Temps en minutes
    prix_base: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("TypeReparation", TypeReparationSchema);
