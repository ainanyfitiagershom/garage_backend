const express = require('express');
const router = express.Router();
const Categorie = require('../models/Paramettres/Categorie');
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

// ➤ Ajouter une nouvelle catégorie
router.post('/',verifyToken, async (req, res) => {
    try {
        const categorie = new Categorie(req.body);
        await categorie.save();
        res.status(201).json(categorie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ➤ Récupérer toutes les catégories
router.get('/',verifyToken, async (req, res) => {
    try {
        const categories = await Categorie.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ➤ Récupérer une seule catégorie par ID
router.get('/:id',verifyToken, async (req, res) => {
    try {
        const categorie = await Categorie.findById(req.params.id);
        if (!categorie) return res.status(404).json({ message: "Catégorie non trouvée" });
        res.json(categorie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ➤ Mettre à jour une catégorie
router.put('/:id',verifyToken, async (req, res) => {
    try {
        const categorie = await Categorie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(categorie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ➤ Supprimer une catégorie
router.delete('/:id',verifyToken, async (req, res) => {
    try {
        await Categorie.findByIdAndDelete(req.params.id);
        res.json({ message: "Catégorie supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
