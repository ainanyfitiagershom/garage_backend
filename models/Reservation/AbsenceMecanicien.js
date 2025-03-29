const mongoose = require("mongoose");

const AbsenceMecanicienSchema = new mongoose.Schema({
    mecanicien: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Mécanicien absent
    date_heure_debut: { type: Date, required: true }, // Date et heure de début de l'absence
    date_heure_fin: { type: Date, required: true }, // Date et heure de fin de l'absence
    motif: { type: String, enum: ["Maladie", "Congé", "Autre"], required: true }, // Motif de l'absence
    statut: { type: String, enum: ["Approuvé", "En attente", "Refusé"], default: "En attente" } // Statut de l'absence
}, { timestamps: true });

module.exports = mongoose.model("AbsenceMecanicien", AbsenceMecanicienSchema);


