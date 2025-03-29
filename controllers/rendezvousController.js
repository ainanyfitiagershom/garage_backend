const RendezVous = require('../models/RendezVous');
const Diagnostic = require("../models/Diagnostic");
const { insertPlanningDiagnostic } = require("./path/to/insertPlanningDiagnostic"); // Importer la fonction d'insertion du planning
const { estMecanicienDisponible, insertPlanningDiagnostic } = require("../controllers/planningController");



const validerOuAnnulerRendezVous = async (req, res) => {
    const { id } = req.params;  // Récupère l'ID du rendez-vous dans les paramètres de l'URL
    // const { action, dateHeureDebut, dateHeureFin, mecanicienId } = req.body;  // Récupère l'action, la date et l'heure de début et fin, et l'ID du mécanicien depuis le corps de la requête

    try {
        // Recherche le rendez-vous par ID
        const rendezVous = await RendezVous.findById(id);
        if (!rendezVous) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }

        // Recherche le diagnostic associé au rendez-vous
        const diagnostic = await Diagnostic.findOne({ rendez_vous: rendezVous._id });
        if (!diagnostic) {
            return res.status(404).json({ message: "Diagnostic associé non trouvé" });
        }


        //  Vérifier la disponibilité du mécanicien
        const disponible = await estMecanicienDisponible(diagnostic.mecanicien, diagnostic.date_diag, diagnostic.date_diag);
        if (!disponible) {
            return res.status(400).json({ message: "Le mécanicien n'est pas disponible à cette date." });
        }

        // Valider ou annuler le rendez-vous en fonction de l'action demandée
        if (action === "valider") {
            rendezVous.statut = "Validé";  // Change le statut du rendez-vous en "Confirmé"
            diagnostic.etat = "Confirmé";    // Change le statut du diagnostic en "Confirmé"

            // Insérer le planning du diagnostic
             // Insérer le planning du diagnostic en utilisant les informations du diagnostic
             await insertPlanningDiagnostic(diagnostic.mecanicien, diagnostic._id, diagnostic.date_diag, diagnostic.date_diag, res); // Ici, la date de début et de fin est la même pour le diagnostic
        } else if (action === "annuler") {
            rendezVous.statut = "Annulé";    // Change le statut du rendez-vous en "Annulé"
            diagnostic.etat = "Annulé";      // Change le statut du diagnostic en "Annulé"
        } else {
            return res.status(400).json({ message: "Action invalide" });
        }

        // Sauvegarder les changements dans la base de données
        await rendezVous.save();
        await diagnostic.save();  // Sauvegarder les modifications du diagnostic

        // Retourner une réponse avec les données du rendez-vous mis à jour
        res.status(200).json({
            message: `Rendez-vous ${action} avec succès`,
            rendezVous
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};



const getRendezVousValidesAvecDiagnostic = async (req, res) => {
    const { clientId } = req.params;  // Récupère l'ID du client depuis les paramètres de l'URL

    try {
        // Recherche des rendez-vous validés pour ce client
        const rendezVousValides = await RendezVous.find({ 
            client: clientId,
            statut: "Confirmé" // Filtre les rendez-vous validés
        }).populate("problemes") // Inclut les problèmes (Catégories)
          .populate("voiture") // Inclut la voiture associée au rendez-vous
          .populate({
            path: "diagnostic", // Inclut les diagnostics associés
            select: "etat observation date_diag" // Sélectionne seulement les champs pertinents du diagnostic
          });

        // Vérification si des rendez-vous validés ont été trouvés
        if (rendezVousValides.length === 0) {
            return res.status(404).json({ message: "Aucun rendez-vous validé trouvé pour ce client." });
        }

        // Retourner la réponse avec les rendez-vous validés et leurs diagnostics associés
        res.status(200).json({
            message: "Rendez-vous validés récupérés avec succès",
            rendezVousValides
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};







module.exports = { validerOuAnnulerRendezVous , getRendezVousValidesAvecDiagnostic};
