const mongoose = require("mongoose");

const DetailsPaiementSchema = new mongoose.Schema({
    montant_paye: { type: Number, required: true, min: 0 }, // Montant payé à cette date
    date_paiement: { type: Date, default: Date.now }, // Date du paiement
    mode_paiement: { 
        type: String, 
        enum: ["Espèces", "Carte", "Virement"], 
        required: true 
    }, // Mode de paiement
}, { _id: false }); // Pas besoin d’un ID pour chaque détail

const PaiementSchema = new mongoose.Schema({
    facture: { type: mongoose.Schema.Types.ObjectId, ref: "Facture", required: true }, // Référence à la facture
    montant_total_paye: { type: Number, default: 0 }, // Somme totale payée
    statut: { 
        type: String, 
        enum: ["En cours", "Payé"], 
        default: "En cours" 
    }, // Statut du paiement
    details_paiement: [DetailsPaiementSchema] // Liste des paiements partiels
}, { timestamps: true });

module.exports = mongoose.model("Paiement", PaiementSchema);
