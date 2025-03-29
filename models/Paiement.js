const mongoose = require("mongoose");

const PaiementSchema = new mongoose.Schema({
    facture: { type: mongoose.Schema.Types.ObjectId, ref: "Facture", required: true }, // Référence à la facture
    montant_total_facture: { type: Number, required: true }, // Montant total de la facture
    montant_total_paye: { type: Number, default: 0 }, // Somme totale payée
    montant_restant: { type: Number, required: true }, // Reste à payer
    statut: { 
        type: String, 
        enum: ["En cours", "Payé"], 
        default: "En cours" 
    }, // Statut du paiement
    details_paiement: [
        {
            montant_paye: { type: Number, required: true, min: 0 }, // Montant payé à cette date
            date_paiement: { type: Date, default: Date.now }, // Date du paiement
            mode_paiement: { 
                type: String, 
                enum: ["Espèces", "Carte", "Virement"], 
                required: true 
            }, // Mode de paiement
            etat: { 
                type: String, 
                enum: ["En attente", "Validé", "Rejeté"], 
                default: "En attente" 
            } // État du paiement
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Paiement", PaiementSchema);