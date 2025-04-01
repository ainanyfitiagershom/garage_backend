const express = require("express");
const RendezVous = require("../models/Reservation/RendezVous");
const Diagnostic = require("../models/Reservation/Diagnostic");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const { validerOuAnnulerRendezVous, getRendezVousValidesAvecDiagnostic } = require('../controllers/rendezvousController');
const Client = require("../models/Utilisateur/Client");
const Categorie = require("../models/Paramettres/Categorie");
const { estMecanicienDisponible, insertPlanningDiagnostic } = require('../controllers/planningController');
const User = require("../models/Utilisateur/User");
const Role = require("../models/Utilisateur/Role"); 

const router = express.Router();

// Ajouter un rendez-vous
router.post("/", verifyToken ,async (req, res) => {
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


// Mettre à jour un rendez-vous (changer statut, modifier date, etc.)
router.put("/:id",verifyToken , async (req, res) => {
    try {
        const rendezVous = await RendezVous.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("client voiture");
        res.json(rendezVous);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un rendez-vous
router.delete("/:id",verifyToken , async (req, res) => {
    try {
        await RendezVous.findByIdAndDelete(req.params.id);
        res.json({ message: "Rendez-vous supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



/// Demande de rendez-vous par un client
router.post("/demandeRendezVoususer/:clientId", verifyToken , async (req, res) => {
    try {
        const { voiture, date_heure_rdv, problemes, commentaire } = req.body;

        const clientId = req.params.clientId;  // Correction ici : obtenir le paramètre clientId

        // Vérifier si le client existe
        const clientExiste = await Client.findById(clientId);
        if (!clientExiste) {
            return res.status(404).json({ message: "Client introuvable." });
        }


          // Vérifier si les problèmes sont des ID de catégories valides
          const categoriesExist = await Categorie.find({ '_id': { $in: problemes } });
          if (categoriesExist.length !== problemes.length) {
              return res.status(404).json({ message: "Certaines catégories de problèmes sont invalides." });
          }

        // Créer une nouvelle demande de rendez-vous
        const nouveauRendezVous = new RendezVous({
            client: clientId,   // Lier le rendez-vous au client
            voiture,
            date_heure_rdv,
            categorie: problemes,
            commentaire,
            statut: "En attente"
        });

        // Sauvegarder en base de données
        await nouveauRendezVous.save();
        res.status(201).json({ message: "Demande de rendez-vous envoyée", rendezVous: nouveauRendezVous });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

  

  // Récupérer tous les rendez-vous en attente
  router.get("/liste/attente", verifyToken , async (req, res) => {
    try {
        // Rechercher les rendez-vous avec le statut "En attente"
        const rendezVousEnAttente = await RendezVous.find({ statut: "En attente" })
            .populate("client", "nom email contact") // Récupérer les infos du client
            .populate({
                path: "voiture",
                populate: [
                  { path: "model" },
                  { path: "energie" },
                  { path: "transmission" }
                ]
              }) // Informations sur la voiture
            .populate("categorie", "nom"); // Récupérer les problèmes mentionnés par le client

        // Si aucun rendez-vous en attente n'est trouvé
        if (rendezVousEnAttente.length === 0) {
            return res.status(404).json({ message: "Aucun rendez-vous en attente trouvé." });
        }

        // Retourner les rendez-vous en attente
        res.status(200).json(rendezVousEnAttente);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});


// Récupérer un rendez-vous spécifique
router.get("/:id", verifyToken , async (req, res) => {
    try {
        const rendezVousDetail = await RendezVous.findById(req.params.id)
            .populate("client", "nom email contact") // Informations du client
            .populate("voiture", "marque modele annee") // Informations de la voiture
            .populate("categorie", "nom") // Informations sur les problèmes signalés
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
router.put("/confirmer/:id", verifyToken , async (req, res) => {
    const { date_rendezvous, mecanicien } = req.body;

    // Vérification si la date_rendezvous est fournie
    if (!date_rendezvous) {
        return res.status(400).json({ message: "La date et l'heure du rendez-vous doivent être spécifiées." });
    }

    // Vérifier si le mécanicien est spécifié
    if (!mecanicien) {
        return res.status(400).json({ message: "Un mécanicien doit être assigné." });
    }

    try {
        // Trouver et mettre à jour le rendez-vous
        const rendezVous = await RendezVous.findByIdAndUpdate(
            req.params.id,
            {
                date_rendezvous,  // Nouvelle date et heure
                statut: "Confirmé"  // Statut "Confirmé" si non spécifié
            },
            { new: true }  // Retourner le document mis à jour
        )
        .populate("client", "nom email contact") // Informations du client
        .populate("voiture", "marque modele annee") // Informations de la voiture
        .populate("categorie", "nom"); // Informations des problèmes signalés

        if (!rendezVous) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        // Vérifier si un diagnostic existe déjà pour ce rendez-vous
        const existingDiagnostic = await Diagnostic.findOne({ rendez_vous: rendezVous._id });
        if (existingDiagnostic) {
            return res.status(400).json({ message: "Un diagnostic existe déjà pour ce rendez-vous." });
        }

        // Vérifier la disponibilité du mécanicien
        const disponible = await estMecanicienDisponible(mecanicien, date_rendezvous, date_rendezvous);
        if (!disponible) {
            return res.status(400).json({ message: "Le mécanicien n'est pas disponible à cette date." });
        }


        // Création du diagnostic après la confirmation du rendez-vous
        const diagnostic = new Diagnostic({
            client: rendezVous.client,        // Référence au client du rendez-vous
            voiture: rendezVous.voiture,      // Référence à la voiture du client
            mecanicien: mecanicien,           // Mécanicien affecté
            rendez_vous: rendezVous._id,      // Référence au rendez-vous
            date_diag: date_rendezvous,       // Date de création du diagnostic
            etat: "En attente",               // Initialement en "En attente"
            observation: ""                   // L'observation peut être vide à ce stade
        });

        // Sauvegarde du diagnostic
        await diagnostic.save();

        console.log("iddddddd!" + diagnostic._id);
         // Insérer le diagnostic dans le planning du mécanicien
         await insertPlanningDiagnostic(mecanicien, diagnostic._id, date_rendezvous, date_rendezvous);

        // Retourner la réponse avec le rendez-vous et le diagnostic créé
        res.status(200).json({ message: "Rendez-vous confirmé et diagnostic créé", rendezVous, diagnostic });

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





router.get("/client/:clientId", verifyToken , async (req, res) => {
    try {
        const { clientId } = req.params;

        // Récupérer les rendez-vous confirmés pour un client donné
        const rendezVousValides = await RendezVous.find({ 
            client: clientId
        })
        .populate({
            path: "voiture",
            populate: [
              { path: "model" },
              { path: "energie" },
              { path: "transmission" }
            ]
          }) // Informations sur la voiture
        .populate("categorie") // Récupérer les problèmes signalés
        .sort({ date_demande: -1 }) // Trier du plus récent au plus ancien
        .lean(); // Convertir en objets JS purs pour manipulation

        if (!rendezVousValides || rendezVousValides.length === 0) {
            return res.status(404).json({ message: "Aucun rendez-vous confirmé trouvé pour ce client." });
        }

        // Récupérer les diagnostics liés aux rendez-vous
        const rendezVousIds = rendezVousValides.map(rdv => rdv._id);
        const diagnostics = await Diagnostic.find({ rendez_vous: { $in: rendezVousIds } })
            .populate("mecanicien", "nom") // Peupler le mécanicien
            .lean();

        // Associer les diagnostics aux rendez-vous correspondants
        const rendezVousAvecMecanicien = rendezVousValides.map(rdv => {
            const diagnostic = diagnostics.find(diag => String(diag.rendez_vous) === String(rdv._id));
            return {
                ...rdv,
                mecanicien: diagnostic ? diagnostic.mecanicien : null // Ajouter le mécanicien
            };
        });

        res.status(200).json(rendezVousAvecMecanicien);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});





// Route pour valider ou annuler un rendez-vous
// L'utilisateur doit être authentifié et doit avoir le rôle 'Manager'
router.put('/action/:id',  verifyToken , validerOuAnnulerRendezVous);



// Route pour obtenir la liste des rendez-vous validés avec les diagnostics pour un client
router.get('/client/:clientId/rendez-vous-valides', verifyToken , verifyToken , getRendezVousValidesAvecDiagnostic);

router.get("/users/mecaniciens", async (req, res) => {
    try {
      // Trouver le rôle "Mécanicien" dans la collection 'roles'
      const mecanicienRole = await Role.findOne({ name: 'Mécanicien' });
  
      if (!mecanicienRole) {
        return res.status(404).json({ message: "Rôle Mécanicien non trouvé." });
      }
  
      // Trouver les utilisateurs ayant ce rôle
      const mecaniciens = await User.find({ role: mecanicienRole._id }).populate('role');
  
      console.log("Mécaniciens récupérés :", mecaniciens); // Ajout de log pour vérifier
      
      if (!mecaniciens || mecaniciens.length === 0) {
        return res.status(404).json({ message: "Aucun mécanicien trouvé." });
      }
  
      res.status(200).json(mecaniciens);
    } catch (err) {
      console.error("Erreur lors de la récupération des mécaniciens :", err);
      res.status(500).json({ erreur: err.message });
    }
  });  



module.exports = router;
