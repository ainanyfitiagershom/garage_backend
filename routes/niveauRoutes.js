const express = require("express");
const Niveau = require("../models/Niveau");

const router = express.Router();

// Ajouter un niveau de difficulté
router.post("/", async (req, res) => {
    try {
        const { nom, pourcentage } = req.body;

        const nouveauNiveau = new Niveau({ nom, pourcentage });
        await nouveauNiveau.save();

        res.status(201).json({ message: "Niveau ajouté avec succès", nouveauNiveau });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir tous les niveaux
router.get("/", async (req, res) => {
    try {
        const niveaux = await Niveau.find();
        res.json(niveaux);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un niveau par ID
router.get("/:id", async (req, res) => {
    try {
        const niveau = await Niveau.findById(req.params.id);
        if (!niveau) {
            return res.status(404).json({ message: "Niveau non trouvé" });
        }
        res.json(niveau);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour un niveau
router.put("/:id", async (req, res) => {
    try {
        const niveau = await Niveau.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(niveau);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un niveau
router.delete("/:id", async (req, res) => {
    try {
        await Niveau.findByIdAndDelete(req.params.id);
        res.json({ message: "Niveau supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
