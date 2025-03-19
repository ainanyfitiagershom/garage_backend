const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mdp: { type: String, required: true }, // Hashed password
    contact: { type: String, required: true },
    adresse: { type: String, required: true },
    type_client: { type: String, enum: ["VIP", "Standard"], default: "Standard" }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
