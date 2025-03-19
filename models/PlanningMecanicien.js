const mongoose = require("mongoose");

const PlanningMecanicienSchema = new mongoose.Schema({
    mecanicien: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Référence au mécanicien
    type_tache: { type: String, enum: ["Diagnostic", "Réparation"], required: true }, // Type de tâche
    id_tache: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID de la tâche concernée (diagnostic ou réparation)
    date: { type: Date, required: true }, // Date de la tâche
    heure_debut: { type: String, required: true }, // Heure de début (ex: "09:00")
    heure_fin: { type: String, required: true }, // Heure de fin (ex: "10:30")
    statut: { type: String, enum: ["Réservé", "Terminé", "Annulé"], default: "Réservé" } // Statut de la réservation
}, { timestamps: true });

module.exports = mongoose.model("PlanningMecanicien", PlanningMecanicienSchema);
