const express = require("express");
const Paiement = require("../models/Paiement");
const Facture = require("../models/Facture");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { facture } = req.body;

        // Vérifier si la facture existe
        const factureExistante = await Facture.findById(facture);
        if (!factureExistante) {
            return res.status(404).json({ message: "Facture introuvable" });
        }

        // Vérifier si un paiement existe déjà
        const paiementExistant = await Paiement.findOne({ facture });
        if (paiementExistant) {
            return res.status(400).json({ message: "Un paiement existe déjà pour cette facture" });
        }

        // Créer un paiement vide au départ
        const paiement = new Paiement({ facture, montant_total_paye: 0, details_paiement: [] });
        await paiement.save();

        res.status(201).json({ message: "Paiement créé avec succès", paiement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.post("/:id/details", async (req, res) => {
    try {
        const { montant_paye, mode_paiement } = req.body;
        const paiement = await Paiement.findById(req.params.id).populate("facture");

        if (!paiement) {
            return res.status(404).json({ message: "Paiement introuvable" });
        }

        // Vérifier que le montant payé ne dépasse pas le total de la facture
        if (paiement.montant_total_paye + montant_paye > paiement.facture.montant_total) {
            return res.status(400).json({ message: "Le montant dépasse le total de la facture" });
        }

        // Ajouter le paiement partiel
        const nouveauPaiement = { montant_paye, mode_paiement, date_paiement: new Date() };
        paiement.details_paiement.push(nouveauPaiement);
        paiement.montant_total_paye += montant_paye;

        // Mettre à jour le statut
        if (paiement.montant_total_paye >= paiement.facture.montant_total) {
            paiement.statut = "Payé";
            paiement.facture.mode_paiement = mode_paiement;
            paiement.facture.date_paiement = new Date();
            await paiement.facture.save();
        }

        await paiement.save();

        res.status(201).json({ message: "Paiement ajouté avec succès", paiement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.get("/", async (req, res) => {
    try {
        const paiements = await Paiement.find().populate("facture");
        res.json(paiements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        await Paiement.findByIdAndDelete(req.params.id);
        res.json({ message: "Paiement supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;