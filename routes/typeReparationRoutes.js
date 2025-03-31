const express = require("express");
const TypeReparation = require("../models/Reparation/TypeReparation");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();

// Ajouter un type de réparation
router.post("/", verifyToken ,async (req, res) => {
    try {
        const { nom, description, categories, temps_estime, prix_base } = req.body;

        const typeReparation = new TypeReparation({
            nom,
            description,
            categories,
            temps_estime,
            prix_base
        });

        await typeReparation.save();
        res.status(201).json({ message: "Type de réparation ajouté avec succès", typeReparation });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir tous les types de réparations
router.get("/", verifyToken , async (req, res) => {
    try {
        const typesReparation = await TypeReparation.find().populate("categories");
        res.json(typesReparation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un type de réparation par ID
router.get("/:id", verifyToken , async (req, res) => {
    try {
        const typeReparation = await TypeReparation.findById(req.params.id).populate("categories");
        if (!typeReparation) {
            return res.status(404).json({ message: "Type de réparation non trouvé" });
        }
        res.json(typeReparation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour un type de réparation
router.put("/:id", verifyToken , async (req, res) => {
    try {
        const typeReparation = await TypeReparation.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("categories");
        res.json(typeReparation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//  Supprimer un type de réparation
router.delete("/:id", verifyToken , async (req, res) => {
    try {
        await TypeReparation.findByIdAndDelete(req.params.id);
        res.json({ message: "Type de réparation supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
