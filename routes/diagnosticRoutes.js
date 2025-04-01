const express = require("express");
const Diagnostic = require("../models/Reservation/Diagnostic");
const router = express.Router();
const { getDiagnosticsParMecanicien,
    getDiagnostiquesTermines ,
    listerDiagnosticsClient
} = require('../controllers/diagnosticController');

const { deposer_voiture ,
    getReparationByDiagnostic
} = require('../controllers/reparationController');


const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

// Ajouter un diagnostic
router.post("/",verifyToken, async (req, res) => {
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
router.get("/",verifyToken, async (req, res) => {
    try {
        const diagnostics = await Diagnostic.find().populate("client voiture mecanicien");
        res.json(diagnostics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un diagnostic par ID
router.get("/:id",verifyToken, async (req, res) => {
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
router.put("/:id", verifyToken ,async (req, res) => {
    try {
        const diagnostic = await Diagnostic.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("client voiture mecanicien");
        res.json(diagnostic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un diagnostic
router.delete("/:id",verifyToken, async (req, res) => {
    try {
        await Diagnostic.findByIdAndDelete(req.params.id);
        res.json({ message: "Diagnostic supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




// Route pour obtenir la liste des diagnostics d'un mécanicien
// Déclaration de la route Express
router.get('/mecanicien/:mecanicienId',verifyToken, getDiagnosticsParMecanicien);


// Route Express pour récupérer les diagnostics d'un client
router.get('/client/:clientId', verifyToken ,listerDiagnosticsClient);

// Définir le routeur pour le dépôt de voiture
router.get('/deposer/:idrdv',verifyToken, deposer_voiture);

// Route pour récupérer les diagnostics terminés
router.get('/liste/termines', verifyToken, getDiagnostiquesTermines);

// Route pour récupérer la réparation par l'ID du diagnostic
router.get('/reparations/:idDiagnostic', verifyToken , getReparationByDiagnostic);

module.exports = router;
