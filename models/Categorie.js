const mongoose = require('mongoose');

const CategorieSchema = new mongoose.Schema({
    nom: { type: String, required: true, unique: true }, // Nom unique de la catégorie
    description: { type: String, required: true } // Courte description
}, { timestamps: true });

module.exports = mongoose.model('Categorie', CategorieSchema);
