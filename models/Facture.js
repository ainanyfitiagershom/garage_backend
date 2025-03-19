const mongoose = require("mongoose");

const FactureSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Référence au client
    reparation: { type: mongoose.Schema.Types.ObjectId, ref: "ReparationVoiture", required: true }, // Référence à la réparation
    date_facture: { type: Date, default: Date.now }, // Date de création de la facture
    montant_total: { type: Number, required: true }, // Montant total à payer
    date_paiement: { type: Date, required: false }, // Date du paiement (null si non payé)
    mode_paiement: { 
        type: String, 
        enum: ["Espèces", "Carte", "Virement", "Non payé"], 
        default: "Non payé" 
    }, // Mode de paiement
    details: [
        {
            libelle: { type: String, required: true }, // Nom du service ou pièce
            quantite: { type: Number, required: true }, // Nombre d'unités
            prix_unitaire: { type: Number, required: true }, // Prix unitaire
            prix_total: { type: Number, required: true } // Prix total (quantité * prix unitaire)
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Facture", FactureSchema);
