const express = require("express");
const Facture = require("../models/Facture");

const router = express.Router();
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const {  voirFacture,listerFactures ,getFactureDetail } = require('../controllers/factureControllers');

// Créer une facture avec détails
router.post("/",verifyToken ,async (req, res) => {
    try {
        const { client, reparation, montant_total, details } = req.body;

        if (!Array.isArray(details) || details.length === 0) {
            return res.status(400).json({ message: "Les détails de la facture sont requis" });
        }

        let total_calculé = details.reduce((total, item) => total + (item.quantite * item.prix_unitaire), 0);
        if (total_calculé !== montant_total) {
            return res.status(400).json({ message: "Le montant total ne correspond pas au calcul des détails" });
        }

        const nouvelleFacture = new Facture({ client, reparation, montant_total, details });
        await nouvelleFacture.save();

        res.status(201).json({ message: "Facture créée avec succès", nouvelleFacture });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Récupérer toutes les factures avec leurs détails
router.get("/",verifyToken, async (req, res) => {
    try {
        const factures = await Facture.find().populate("client reparation");
        res.json(factures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour une facture (ajouter un paiement ou modifier les détails)
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const { date_paiement, mode_paiement, details } = req.body;

        let updateData = {};
        if (date_paiement && mode_paiement) {
            if (!["Espèces", "Carte", "Virement", "Non payé"].includes(mode_paiement)) {
                return res.status(400).json({ message: "Mode de paiement non valide" });
            }
            updateData.date_paiement = date_paiement;
            updateData.mode_paiement = mode_paiement;
        }

        if (details) {
            updateData.details = details;
            updateData.montant_total = details.reduce((total, item) => total + (item.quantite * item.prix_unitaire), 0);
        }

        const facture = await Facture.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        res.json({ message: "Facture mise à jour", facture });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une facture
router.delete("/:id",verifyToken, async (req, res) => {
    try {
        const facture = await Facture.findByIdAndDelete(req.params.id);
        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée" });
        }

        res.json({ message: "Facture supprimée" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route pour voir la facture d'une réparation
router.get("/reparation/:idReparationVoiture", verifyToken, async (req, res) => {
    const { idReparationVoiture } = req.params;

    // Appel de la fonction voirFacture avec l'ID de la réparation et la réponse
    await voirFacture(idReparationVoiture, res);
})


// Route pour récupérer les factures d'un client spécifique
router.get('/client/:idClient', verifyToken ,(req, res) => {
    const idClient = req.params.idClient;
    listerFactures(idClient, res);
});

// Route pour récupérer les factures d'un client spécifique
router.get('/detail/:idFacture', verifyToken ,(req, res) => {
    const idFacture = req.params.idFacture;
    getFactureDetail(idFacture, res);
});


module.exports = router;
