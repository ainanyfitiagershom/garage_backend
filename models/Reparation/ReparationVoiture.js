const mongoose = require("mongoose");

const ReparationVoitureSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voiture: { type: mongoose.Schema.Types.ObjectId, ref: "Voiture", required: true },
    diagnostic: { type: mongoose.Schema.Types.ObjectId, ref: "Diagnostic", required: true },  // Ajout de la référence au diagnostic
    date_depot: { type: Date, required: true },
    date_debut: { type: Date },
    date_fin: { type: Date },
    date_recup: { type: Date },
    etat: { type: String, enum: ["En attente","En cours", "Terminé", "Annulé"], default: "En attente" },
    // Détails de réparation imbriqués ici
    details_reparation: [
        {
            id_type_reparation: { type: mongoose.Schema.Types.ObjectId, ref: "TypeReparation", required: true },
            mecaniciens: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
            difficulte: { type: mongoose.Schema.Types.ObjectId, ref: "Niveau", required: true },
            etat: { type: String, enum: ["En attente", "En cours","Terminé", "Annulé"], default: "En attente" },
            prix: { type: Number, required: true }, // Prix de la réparation
            
            // Durée estimée pour le type de réparation (en minutes)
            duree_estimee: { type: Number, required: true },

            // Horaires réels de la réparation
            date_heure_debut: { type: Date }, // Heure de début réelle
            date_heure_fin: { type: Date }   // Heure de fin réelle
        }
    ],
    // Pièces utilisées dans la réparation
    // Pièces utilisées dans la réparation (liées à un `id_type_reparation`)
    pieces_utilisees: [
        {
            id_type_reparation: { type: mongoose.Schema.Types.ObjectId, ref: "TypeReparation", required: true }, // Lié à un type de réparation
            piece: { type: mongoose.Schema.Types.ObjectId, ref: "Piece", required: true }, // Référence à la pièce
            nom: { type: String, required: true }, // Nom de la pièce
            nombre: { type: Number, required: true, min: 1 }, // Nombre de pièces utilisées
            etat: { type: String, enum: ["Prise", "Non prise"], required: true }, // Etat de la pièce
            prix: { type: Number, required: true } // Prix unitaire de la pièce
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("ReparationVoiture", ReparationVoitureSchema);
