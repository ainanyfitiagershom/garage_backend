const express = require("express");
const Piece = require("../models/Piece");

const router = express.Router();

// Ajouter une nouvelle pièce
router.post("/", async (req, res) => {
    try {
        const { nom, quantite, prix_unitaire } = req.body;
        const nouvellePiece = new Piece({ nom, quantite, prix_unitaire });
        await nouvellePiece.save();
        res.status(201).json({ message: "Pièce ajoutée avec succès", nouvellePiece });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir toutes les pièces
router.get("/", async (req, res) => {
    try {
        const pieces = await Piece.find();
        res.json(pieces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir une pièce par ID
router.get("/:id", async (req, res) => {
    try {
        const piece = await Piece.findById(req.params.id);
        if (!piece) {
            return res.status(404).json({ message: "Pièce non trouvée" });
        }
        res.json(piece);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour une pièce
router.put("/:id", async (req, res) => {
    try {
        const { nom, quantite, prix_unitaire } = req.body;
        const piece = await Piece.findByIdAndUpdate(req.params.id, { nom, quantite, prix_unitaire }, { new: true });

        if (!piece) {
            return res.status(404).json({ message: "Pièce non trouvée" });
        }

        res.json({ message: "Pièce mise à jour", piece });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une pièce
router.delete("/:id", async (req, res) => {
    try {
        const piece = await Piece.findByIdAndDelete(req.params.id);
        if (!piece) {
            return res.status(404).json({ message: "Pièce non trouvée" });
        }

        res.json({ message: "Pièce supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
