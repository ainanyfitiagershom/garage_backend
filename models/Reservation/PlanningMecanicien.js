const mongoose = require("mongoose");

const PlanningMecanicienSchema = new mongoose.Schema({
    mecanicien: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Mécanicien concerné
    type_tache: { type: String, enum: ["Diagnostic", "Réparation"], required: true }, // Type de tâche

    id_tache: { type: mongoose.Schema.Types.ObjectId, required: true }, //  Soit un ID de diagnostic, soit un ID de type réparation
    id_reparation_voiture: { type: mongoose.Schema.Types.ObjectId, ref: "ReparationVoiture", default: null }, // ID de la réparation voiture si applicable

    date_heure_debut: { type: Date, required: true }, //  Date et heure de début
    date_heure_fin: { type: Date, required: true }, //  Date et heure de fin

    statut: { type: String, enum: ["Réservé", "En cours","Terminé", "Annulé"], default: "Réservé" } //  Statut de la tâche
}, { timestamps: true });

module.exports = mongoose.model("PlanningMecanicien", PlanningMecanicienSchema);

