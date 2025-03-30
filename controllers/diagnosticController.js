const Diagnostic = require('../models/Reservation/Diagnostic');

// Fonction pour obtenir tous les diagnostics d'un mécanicien
const getDiagnosticsParMecanicien = async (req, res) => {
    try {
        const { mecanicienId } = req.params; // Récupérer l'ID depuis l'URL
        // Recherche tous les diagnostics associés au mécanicien et dont l'état est "Validé"
        const diagnostics = await Diagnostic.find({ 
            mecanicien: mecanicienId, 
            etat: "Validé" // Filtrer uniquement les diagnostics validés
        })
            .populate('client', 'nom email contact') // Informations du client
            .populate('voiture', 'marque modele annee') // Informations sur la voiture
            .populate('rendez_vous', 'date_rendezvous statut') // Informations du rendez-vous associé
            .sort({ date_diag: -1 }); // Trier du plus récent au plus ancien

        if (diagnostics.length === 0) {
            return res.status(404).json({ message: 'Aucun diagnostic validé trouvé pour ce mécanicien.' });
        }

        // Retourner la liste des diagnostics validés
        res.status(200).json(diagnostics);

    } catch (error) {
        console.error("Erreur lors de la récupération des diagnostics :", error);
        res.status(500).json({ message: 'Erreur du serveur', error: error.message });
    }
};



const getDiagnostiquesTermines = async (req, res) => {
    try {
        // Récupérer les diagnostics terminés
        const diagnosticsTermines = await Diagnostic.find({ etat: "Terminé" })
            .populate('client voiture') // Récupérer les informations du client et de la voiture
            .sort({ date_fin: -1 }); // Optionnel: trier par date de fin (les plus récents en premier)

        if (diagnosticsTermines.length === 0) {
            return res.status(404).json({ message: "Aucun diagnostic terminé trouvé." });
        }

        // Retourner la liste des diagnostics terminés
        return res.status(200).json({
            message: "Diagnostics terminés récupérés avec succès.",
            diagnostics: diagnosticsTermines,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};


const listerDiagnosticsClient = async (req, res) => {
    const { clientId } = req.params; // Récupérer l'ID du client depuis l'URL

    try {
        // Rechercher tous les diagnostics validés du client
        const diagnostics = await Diagnostic.find({ 
            client: clientId, 
            etat: "Confirmé" // Filtrer uniquement les diagnostics validés
        })
        .populate('client', 'nom email contact')  // Infos du client
        .populate('voiture', 'marque modele annee') // Infos de la voiture
        .populate('mecanicien', 'nom email') // Infos du mécanicien
        .sort({ date_diag: -1 }) // Trier du plus récent au plus ancien
        .select('-__v'); // Exclure le champ __v (optionnel)

        // Vérifier si aucun diagnostic trouvé
        if (!diagnostics.length) {
            return res.status(404).json({ message: "Aucun diagnostic validé trouvé pour ce client." });
        }

        // Retourner la liste des diagnostics
        res.status(200).json(diagnostics);
        
    } catch (error) {
        console.error("Erreur lors de la récupération des diagnostics :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des diagnostics.", error: error.message });
    }
};
module.exports = {
    getDiagnostiquesTermines,
    getDiagnosticsParMecanicien,
    listerDiagnosticsClient
};

