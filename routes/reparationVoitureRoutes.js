const express = require("express");
const ReparationVoiture = require("../models/Reparation/ReparationVoiture");
const {  creationReparationVoiture , 
    insererDetailReparationEtPieces , 
    getDetailReparation} = require('../controllers/reparationController');

const router = express.Router();
const { assignerMecanicienAReparation } = require("../controllers/reparationController");

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

// Route pour récupérer les détails d'une réparation spécifique
router.get('/detail/:idReparationVoiture/:idDetailReparation', async (req, res) => {
    const { idReparationVoiture, idDetailReparation } = req.params; // Récupérer les ID depuis les params de l'URL
    await getDetailReparation(idReparationVoiture, idDetailReparation, res); // Appeler la fonction du contrôleur
});





router.post("/assigner-mecanicien", async (req, res) => {
    try {
        const { mecanicienId, idReparationVoiture, idTypeReparation, dateHeureDebut, dateHeureFin } = req.body;

        // Vérifier que toutes les données sont présentes
        if (!mecanicienId || !idReparationVoiture || !idTypeReparation || !dateHeureDebut || !dateHeureFin) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        // Appeler la fonction d'assignation
        const result = await assignerMecanicienAReparation(mecanicienId, idReparationVoiture, idTypeReparation, dateHeureDebut, dateHeureFin);
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        // Vérifier si l'assignation a échoué
        if (!result.success) {
            return res.status(400).json({ message: result.message ,reparation});
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Erreur lors de l'assignation du mécanicien :", error);
        return res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
});



// Route pour valider un détail de réparation par type
router.get("/valider/:idReparationVoiture/:idTypeReparation", async (req, res) => {
    const { idReparationVoiture, idTypeReparation } = req.params;
    await validerDetailReparationParType(idReparationVoiture, idTypeReparation, res);
    const reparation = await ReparationVoiture.findById(idReparationVoiture);
    return res.status(400).json({ message: result.message ,reparation});
});



module.exports = router;
