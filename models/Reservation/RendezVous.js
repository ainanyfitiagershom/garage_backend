const mongoose = require("mongoose");

const RendezVousSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true }, // Référence au client
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: "Voiture", required: true }, // Référence à la voiture
    date_demande: { type: Date, default: Date.now }, // Date de demande de rendez-vous
    date_heure_rdv: { type: Date, required: true }, // Date et heure du rendez-vous
    categorie: [{ type: mongoose.Schema.Types.ObjectId, ref: "Categorie" }],
    commentaire: { type: String },
    statut: { 
        type: String, 
        enum: ["En attente", "Confirmé","Validé", "Annulé"], 
        default: "En attente" 
    } // Statut du rendez-vous
}, { timestamps: true });

module.exports = mongoose.model("RendezVous", RendezVousSchema);
