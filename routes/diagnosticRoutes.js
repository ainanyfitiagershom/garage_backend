const express = require("express");
const Diagnostic = require("../models/Diagnostic");

const router = express.Router();

// Ajouter un diagnostic
router.post("/", async (req, res) => {
    try {
        const { client, voiture, mecanicien, observation } = req.body;

        const nouveauDiagnostic = new Diagnostic({
            client,
            voiture,
            mecanicien,
            observation
        });

        await nouveauDiagnostic.save();
        res.status(201).json({ message: "Diagnostic ajouté avec succès", nouveauDiagnostic });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir tous les diagnostics
router.get("/", async (req, res) => {
    try {
        const diagnostics = await Diagnostic.find().populate("client voiture mecanicien");
        res.json(diagnostics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un diagnostic par ID
router.get("/:id", async (req, res) => {
    try {
        const diagnostic = await Diagnostic.findById(req.params.id).populate("client voiture mecanicien");
        if (!diagnostic) {
            return res.status(404).json({ message: "Diagnostic non trouvé" });
        }
        res.json(diagnostic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour un diagnostic (changer statut, modifier observation)
router.put("/:id", async (req, res) => {
    try {
        const diagnostic = await Diagnostic.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("client voiture mecanicien");
        res.json(diagnostic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un diagnostic
router.delete("/:id", async (req, res) => {
    try {
        await Diagnostic.findByIdAndDelete(req.params.id);
        res.json({ message: "Diagnostic supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
