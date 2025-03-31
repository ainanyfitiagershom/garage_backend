const express = require("express");
const router = express.Router();
const Paiement = require("../models/Paiement");
const Facture = require("../models/Facture");

router.put("/valider/:idPaiement/:detailPaiementId", async (req, res) => {
    try {
        const  detailPaiementId  = req.params.detailPaiementId; // L'ID du détail de paiement à valider

        // Vérifier que l'ID du détail est fourni
        if (!detailPaiementId) {
            return res.status(400).json({ message: "L'ID du détail de paiement est requis." });
        }

        // Trouver le paiement
        const paiement = await Paiement.findById(req.params.idPaiement);

        // Vérifier si le paiement existe
        if (!paiement) {
            return res.status(404).json({ message: "Paiement non trouvé." });
        }

        // Vérifier si le tableau details_paiement existe et contient des éléments
        if (!paiement.details_paiement || paiement.details_paiement.length === 0) {
            return res.status(400).json({ message: "Aucun détail de paiement trouvé pour ce paiement." });
        }

        // Trouver le détail de paiement correspondant à l'ID fourni
        const detailPaiement = paiement.details_paiement.find(
            (detail) => detail._id.toString() === detailPaiementId
        );

        // Vérifier si le détail de paiement existe
        if (!detailPaiement) {
            return res.status(400).json({ message: "Détail de paiement invalide ou introuvable." });
        }

        // Vérifier si le détail de paiement est déjà validé
        if (detailPaiement.etat === "Validé") {
            return res.status(400).json({ message: "Ce paiement a déjà été validé." });
        }

        // Mettre à jour l'état du détail de paiement à "Validé"
        detailPaiement.etat = "Validé";

        // Vérifier si tous les paiements sont validés
        const montantPayeTotal = paiement.details_paiement.reduce((acc, detail) => {
            return detail.etat === "Validé" ? acc + detail.montant_paye : acc;
        }, 0);

        // Mettre à jour le statut global du paiement si tout est payé
        if (montantPayeTotal >= paiement.montant_total_facture) {
            paiement.statut = "Payé";
        }

        // Sauvegarder les modifications
        await paiement.save();

        return res.status(200).json({ message: "Paiement validé avec succès.", paiement });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la validation du paiement.", error });
    }
});





router.put("/paiement/ajouter/:idPaiement", async (req, res) => {
    try {
        const { montant_paye, mode_paiement } = req.body;

        // Vérifier que le paiement est valide et existe
        const paiement = await Paiement.findById(req.params.idPaiement);
        if (!paiement) {
            return res.status(404).json({ message: "Paiement non trouvé." });
        }

        // Ajouter un nouveau paiement à la liste des paiements
        const detailPaiement = {
            montant_paye,
            mode_paiement,
            etat: "En attente" // L'état initial est "En attente" jusqu'à validation
        };

        paiement.details_paiement.push(detailPaiement);

        // Mettre à jour le montant total payé
        paiement.montant_total_paye += montant_paye;

        // Vérifier si le paiement est complet (si le montant total payé est égal ou supérieur au montant de la facture)
        if (paiement.montant_total_paye >= paiement.montant_total_facture) {
            paiement.statut = "Payé"; // Si payé, on change le statut à "Payé"
        }

        // Sauvegarder le paiement mis à jour
        await paiement.save();

        return res.status(200).json({ message: "Paiement partiel ajouté avec succès.", paiement });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de l'ajout du paiement.", error });
    }
});


router.put("/payer/:idFacture", async (req, res) => {
    try {
        const { montant_paye, mode_paiement } = req.body;

        // Vérifier que le montant à payer est valide
        if (!montant_paye || montant_paye <= 0) {
            return res.status(400).json({ message: "Le montant à payer est invalide." });
        }

        // Récupérer la facture par son ID
        const facture = await Facture.findById(req.params.idFacture);
        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée." });
        }

        // Vérifier si un paiement existe déjà pour cette facture
        let paiement = await Paiement.findOne({ facture: facture._id });
        if (!paiement) {
            // Si aucun paiement n'existe, créer un nouveau paiement
            paiement = new Paiement({
                facture: facture._id,
                montant_total_facture: facture.montant_total,  // Montant total de la facture
                montant_total_paye: 0,  // Initialement 0
                montant_restant: facture.montant_total,  // Initialement égal au montant total de la facture
                statut: "En cours",
                details_paiement: []
            });
        }

        // Ajouter le paiement partiel dans la liste des détails de paiement
        const detailPaiement = {
            montant_paye,
            mode_paiement,
            etat: "En attente"  // Initialement, l'état du paiement est "En attente" jusqu'à validation
        };

        paiement.details_paiement.push(detailPaiement);

        // Mettre à jour les montants
        paiement.montant_total_paye += montant_paye;
        paiement.montant_restant -= montant_paye;

        // Si le paiement est complet, mettre à jour le statut
        if (paiement.montant_total_paye >= paiement.montant_total_facture) {
            paiement.statut = "Payé";
            paiement.montant_restant = 0;  // Si payé en entier, il n'y a plus de montant restant
        }

        // Sauvegarder le paiement dans la base de données
        await paiement.save();

        // Répondre avec le paiement mis à jour
        return res.status(200).json({
            message: "Paiement effectué avec succès.",
            paiement
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors du paiement de la facture.", error });
    }
});


module.exports = router;
