const mongoose = require("mongoose");

const PieceSchema = new mongoose.Schema({
    nom: { type: String, required: true }, // Nom de la pièce
    quantite: { type: Number, required: true, min: 0 }, // Quantité en stock
    prix_unitaire: { type: Number, required: true, min: 0 }, // Prix d'une unité de la pièce
}, { timestamps: true });

module.exports = mongoose.model("Piece", PieceSchema);
