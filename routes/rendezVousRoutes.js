const express = require("express");
const RendezVous = require("../models/RendezVous");

const router = express.Router();

// Ajouter un rendez-vous
router.post("/", async (req, res) => {
    try {
        const { client, voiture, date_demande, commentaire } = req.body;

        const nouveauRendezVous = new RendezVous({
            client,
            voiture,
            date_demande,
            commentaire
        });

        await nouveauRendezVous.save();
        res.status(201).json({ message: "Rendez-vous ajouté avec succès", nouveauRendezVous });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtenir tous les rendez-vous
router.get("/", async (req, res) => {
    try {
        const rendezVous = await RendezVous.find().populate("client voiture");
        res.json(rendezVous);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un rendez-vous par ID
router.get("/:id", async (req, res) => {
    try {
        const rendezVous = await RendezVous.findById(req.params.id).populate("client voiture");
        if (!rendezVous) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }
        res.json(rendezVous);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour un rendez-vous (changer statut, modifier date, etc.)
router.put("/:id", async (req, res) => {
    try {
        const rendezVous = await RendezVous.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("client voiture");
        res.json(rendezVous);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un rendez-vous
router.delete("/:id", async (req, res) => {
    try {
        await RendezVous.findByIdAndDelete(req.params.id);
        res.json({ message: "Rendez-vous supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
