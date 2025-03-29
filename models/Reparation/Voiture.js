const mongoose = require('mongoose');

const VoitureSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    matricule: { type: String, required: true, unique: true },
    annees: { type: String, required: true, unique: true ,  maxlength: 4},
    model: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true }, 
    energie: { type: mongoose.Schema.Types.ObjectId, ref: "Energie", required: true }, 
    moteur: { type: mongoose.Schema.Types.ObjectId, ref: "Moteur", required: true }, 
    transmission: { type: mongoose.Schema.Types.ObjectId, ref: "Transmission", required: true }, 
    dates: { type: Date, default: Date.now },
    kilometrage: { type: Number, required: true },
    photo: { type: String }, // URL de l'image de la voiture
}, { timestamps: true });

module.exports = mongoose.model('Voiture', VoitureSchema);
