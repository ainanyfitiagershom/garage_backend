const mongoose = require("mongoose");

const PieceReparationSchema = new mongoose.Schema({
    reparation: { type: mongoose.Schema.Types.ObjectId, ref: "ReparationVoiture", required: true }, // Référence à la réparation
    piece: { type: mongoose.Schema.Types.ObjectId, ref: "Piece", required: false }, // Référence à la pièce (null si achetée en externe)
    nom: { type: String, required: true }, // Nom de la pièce utilisée
    nombre: { type: Number, required: true, min: 1 }, // Nombre de pièces utilisées
    etat: { 
        type: String, 
        enum: ["Prise", "Non prise"], 
        required: true 
    }, // Indique si la pièce a été prise pour la réparation
}, { timestamps: true });

module.exports = mongoose.model("PieceReparation", PieceReparationSchema);
