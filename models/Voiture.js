const mongoose = require('mongoose');

const VoitureSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    annee: { type: Number, required: true },
    immatriculation: { type: String, required: true, unique: true },
    kilometrage: { type: Number, required: true },
    photo: { type: String }, // URL de l'image de la voiture
    carte_grise_photo: { type: String }, // URL de la carte grise
    boite: { type: String, enum: ["Manuelle", "Automatique"], required: true },
    energie: { type: String, enum: ["Essence", "Diesel", "Électrique", "Hybride"], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Voiture', VoitureSchema);
