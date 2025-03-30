const express = require("express");
const ReparationVoiture = require("../models/Reparation/ReparationVoiture");
const {  creationReparationVoiture , insererDetailReparationEtPieces } = require('../controllers/reparationController');

const router = express.Router();

// Ajouter une réparation de voiture avec des détails
router.post("/", async (req, res) => {
    try {
        const { client, voiture, date_depot, details_reparation } = req.body;

        const nouvelleReparation = new ReparationVoiture({
            client,
            voiture,
            date_depot,
            details_reparation
        });

        await nouvelleReparation.save();
        res.status(201).json({ message: "Réparation ajoutée avec succès", nouvelleReparation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Ajouter un détail de réparation à une réparation existante
router.put("/:id/details", async (req, res) => {
    try {
        const { id_type_reparation, mecaniciens, difficulte, etat } = req.body;

        const reparation = await ReparationVoiture.findById(req.params.id);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        reparation.details_reparation.push({ id_type_reparation, mecaniciens, difficulte, etat });
        await reparation.save();

        res.json({ message: "Détail ajouté à la réparation", reparation });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Récupérer toutes les réparations
router.get("/", async (req, res) => {
    try {
        const reparations = await ReparationVoiture.find()
            .populate("client voiture details_reparation.id_type_reparation details_reparation.mecaniciens details_reparation.difficulte");
        res.json(reparations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer un détail de réparation d'une réparation
router.delete("/:id/details/:detailId", async (req, res) => {
    try {
        const reparation = await ReparationVoiture.findById(req.params.id);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        // On filtre pour supprimer le détail correspondant
        reparation.details_reparation = reparation.details_reparation.filter(
            (detail) => detail._id.toString() !== req.params.detailId
        );

        await reparation.save();
        res.json({ message: "Détail supprimé", reparation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



router.post("/creation-reparation/:idDiagnostic", creationReparationVoiture );

router.post('/ajouter/:idReparationVoiture', async (req, res) => {
    const { idReparationVoiture } = req.params;
    const { idTypeReparation, idNiveau, pieces } = req.body;
    await insererDetailReparationEtPieces(idReparationVoiture, idTypeReparation, idNiveau, pieces, res);
});

module.exports = router;
