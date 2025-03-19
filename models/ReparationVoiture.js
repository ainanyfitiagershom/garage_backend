const mongoose = require("mongoose");

const ReparationVoitureSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: "Voiture", required: true },
    date_depot: { type: Date, required: true },
    date_debut: { type: Date },
    date_fin: { type: Date },
    date_recup: { type: Date },
    etat: { type: String, enum: ["En cours", "Terminé", "Annulé"], default: "En cours" },

    // 🛠 Détails de réparation imbriqués ici
    details_reparation: [
        {
            id_type_reparation: { type: mongoose.Schema.Types.ObjectId, ref: "TypeReparation", required: true },
            mecaniciens: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Mécaniciens affectés
            difficulte: { type: mongoose.Schema.Types.ObjectId, ref: "Niveau", required: true },
            etat: { type: String, enum: ["En attente", "En cours", "Terminé"], default: "En attente" }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("ReparationVoiture", ReparationVoitureSchema);
