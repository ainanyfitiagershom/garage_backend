const mongoose = require("mongoose");

const DiagnosticSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Référence au client
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: "Voiture", required: true }, // Référence à la voiture
    mecanicien: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Mécanicien assigné au diagnostic
    rendez_vous: { type: mongoose.Schema.Types.ObjectId, ref: "RendezVous", required: false }, // Référence au rendez-vous (optionnel)
    date_diag: { type: Date, default: Date.now }, // Date du diagnostic
    etat: { 
        type: String, 
        enum: ["En attente", "Confirmé", "Terminé", "Annulé"], 
        default: "En attente" 
    }, // Statut du diagnostic
    observation: { type: String } // Remarques du mécanicien
}, { timestamps: true });

module.exports = mongoose.model("Diagnostic", DiagnosticSchema);
