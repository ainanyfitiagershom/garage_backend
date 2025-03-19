const mongoose = require("mongoose");

const RendezVousSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Référence au client
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: "Voiture", required: true }, // Référence à la voiture
    date_demande: { type: Date, required: true }, // Date de demande de rendez-vous
    commentaire: { type: String },
    statut: { 
        type: String, 
        enum: ["En attente", "Confirmé", "Annulé"], 
        default: "En attente" 
    } // Statut du rendez-vous
}, { timestamps: true });

module.exports = mongoose.model("RendezVous", RendezVousSchema);
