const express = require("express");
const RendezVous = require("../models/Reservation/RendezVous");
const Diagnostic = require("../models/Reservation/Diagnostic");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const { validerOuAnnulerRendezVous, getRendezVousValidesAvecDiagnostic } = require('../controllers/rendezvousController');

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



// Demande de rendez-vous par un client
router.post("/demandeRendezVoususer/:userId", verifyToken, async (req, res) => {
    try {
        const {voiture, date_heure_rdv, problemes, commentaire } = req.body;
  
        const { ClientId } = req.params;
        // Créer une nouvelle demande de rendez-vous
        const nouveauRendezVous = new RendezVous({
            ClientId,
            voiture,
            date_heure_rdv,
            problemes,
            commentaire,
            statut: "En attente"
        });
  
        // Sauvegarde en base de données
        await nouveauRendezVous.save();
        res.status(201).json({ message: "Demande de rendez-vous envoyée", rendezVous: nouveauRendezVous });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  });
  

  // Récupérer tous les rendez-vous en attente
router.get("/en-attente", verifyToken, verifyRole("Manager"), async (req, res) => {
    try {
        const rendezVousEnAttente = await RendezVous.find({ statut: "En attente" })
            .populate("client", "nom email contact") // Récupérer les infos du client
            .populate("voiture", "modele annee") // Récupérer les infos de la voiture
            .populate("problemes", "nom"); // Récupérer les problèmes mentionnés par le client

        res.status(200).json(rendezVousEnAttente);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});


// Récupérer un rendez-vous spécifique
router.get("/:id", verifyToken, verifyRole("Manager"), async (req, res) => {
    try {
        const rendezVousDetail = await RendezVous.findById(req.params.id)
            .populate("client", "nom email contact") // Informations du client
            .populate("voiture", "marque modele annee") // Informations de la voiture
            .populate("problemes", "nom") // Informations sur les problèmes signalés
            .exec();

        if (!rendezVousDetail) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        res.status(200).json(rendezVousDetail);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});



// Confirmer un rendez-vous (modifier la date, l'heure et changer le statut en "Confirmé")
router.put("/confirmer/:id", async (req, res) => {
    const { date_rendezvous, statut } = req.body;  // Les informations à mettre à jour
    // Vérification si la date_rendezvous est fournie
    if (!date_rendezvous) {
        return res.status(400).json({ message: "La date et l'heure du rendez-vous doivent être spécifiées." });
    }
    const { mecanicien } = req.body; // Le mécanicien choisi par le manager

    if (!mecanicien) {
        return res.status(400).json({ message: "Un mécanicien doit être assigné." });
    }

    try {
        const rendezVous = await RendezVous.findByIdAndUpdate(
            req.params.id,
            {
                date_rendezvous,  // Nouvelle date et heure
                statut: statut || "Confirmé"  // Statut "Confirmé" si non spécifié
            },
            { new: true }  // Retourne le document mis à jour
        )
        .populate("client", "nom email contact") // Informations du client
        .populate("voiture", "marque modele annee") // Informations de la voiture
        .populate("problemes", "nom"); // Informations des problèmes signalés

        if (!rendezVous) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        // Création du diagnostic après la confirmation du rendez-vous
        const diagnostic = new Diagnostic({
            client: rendezVous.client,        // Référence au client du rendez-vous
            voiture: rendezVous.voiture,      // Référence à la voiture du client
            mecanicien: mecanicien,           // Mécanicien affecté
            rendez_vous:rendezVous.id,
            date_diag: date_rendezvous,           // Date de création du diagnostic
            etat: "En attente",               // Initialement en "En attente"
            observation: ""                   // L'observation peut être vide à ce stade
        });

        // Sauvegarde du diagnostic
        await diagnostic.save();

        // Retour de la réponse avec le rendez-vous et le diagnostic créé
        res.status(200).json({ message: "Rendez-vous confirmé et diagnostic créé", rendezVous, diagnostic });

        // Retourner le rendez-vous mis à jour
        res.status(200).json(rendezVous);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la confirmation du rendez-vous", error });
    }
});


router.get("rendez-vous/:id", verifyToken, async (req, res) => {
    try {
        // Récupérer le rendez-vous en utilisant l'ID passé dans la requête
        const rendezVous = await RendezVous.findById(req.params.id)
            .populate('client')  // Peupler la référence du client
            .populate('voiture')  // Peupler la référence de la voiture
            .populate('problemes');  // Peupler les problèmes/catégories liés au rendez-vous

        if (!rendezVous) {
            return res.status(404).json({ message: "Rendez-vous introuvable" });
        }

        // Récupérer le diagnostic associé à ce rendez-vous
        const diagnostic = await Diagnostic.findOne({ rendez_vous: rendezVous._id })
            .populate('mecanicien')  // Peupler la référence du mécanicien
            .populate('voiture');    // Peupler la voiture du diagnostic

        // Retourner les détails du rendez-vous et du diagnostic dans la réponse
        return res.status(200).json({
            rendezVous,
            diagnostic: diagnostic || null // Si aucun diagnostic, on renvoie `null`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des détails du rendez-vous', error });
    }
});





router.get("rendez_vous/client/:clientId",verifyToken, async (req, res) => {
    try {
        const { clientId } = req.params;

        const rendezVousValides = await RendezVous.find({ 
            client: clientId, 
        })
        .populate("voiture") 
        .populate("problemes") 
        .sort({ date_demande: -1 }); // Trier du plus récent au plus ancien

        res.status(200).json(rendezVousValides);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});




// Route pour valider ou annuler un rendez-vous
// L'utilisateur doit être authentifié et doit avoir le rôle 'Manager'
router.patch('/action/:id', verifyToken, verifyRole('Manager'), validerOuAnnulerRendezVous);



// Route pour obtenir la liste des rendez-vous validés avec les diagnostics pour un client
router.get('/client/:clientId/rendez-vous-valides', verifyToken , getRendezVousValidesAvecDiagnostic);




module.exports = router;
