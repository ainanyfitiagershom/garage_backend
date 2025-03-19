const express = require("express");
const PieceReparation = require("../models/PieceReparation");

const router = express.Router();

// Ajouter une pièce à une réparation
router.post("/", async (req, res) => {
    try {
        const { reparation, piece, nom, nombre, etat } = req.body;
        const nouvellePieceReparation = new PieceReparation({ reparation, piece, nom, nombre, etat });
        await nouvellePieceReparation.save();
        res.status(201).json({ message: "Pièce ajoutée à la réparation", nouvellePieceReparation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir toutes les pièces utilisées en réparation
router.get("/", async (req, res) => {
    try {
        const piecesReparation = await PieceReparation.find().populate("reparation piece");
        res.json(piecesReparation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour l'état d'une pièce utilisée dans une réparation
router.put("/:id", async (req, res) => {
    try {
        const { etat } = req.body;
        if (!["Prise", "Non prise"].includes(etat)) {
            return res.status(400).json({ message: "État non valide" });
        }

        const pieceReparation = await PieceReparation.findByIdAndUpdate(
            req.params.id, 
            { etat }, 
            { new: true }
        );

        if (!pieceReparation) {
            return res.status(404).json({ message: "Pièce non trouvée" });
        }

        res.json({ message: "État de la pièce mis à jour", pieceReparation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une pièce d'une réparation
router.delete("/:id", async (req, res) => {
    try {
        const pieceReparation = await PieceReparation.findByIdAndDelete(req.params.id);
        if (!pieceReparation) {
            return res.status(404).json({ message: "Pièce non trouvée" });
        }

        res.json({ message: "Pièce supprimée de la réparation" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
