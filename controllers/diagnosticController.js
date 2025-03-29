const Diagnostic = require('../models/Diagnostic');

// Fonction pour obtenir tous les diagnostics d'un mécanicien
const getDiagnosticsParMecanicien = async (req, res) => {
    const mecanicienId = req.user._id; // L'ID du mécanicien sera dans le token (après le middleware verifyToken)

    try {
        // Recherche tous les diagnostics associés au mécanicien
        const diagnostics = await Diagnostic.find({ mecanicien: mecanicienId })
            .populate('client', 'nom email') // Optionnel : Peupler les informations du client
            .populate('voiture', 'marque modele'); // Optionnel : Peupler les informations de la voiture

        if (!diagnostics.length) {
            return res.status(404).json({ message: 'Aucun diagnostic trouvé pour ce mécanicien.' });
        }

        // Retourner les diagnostics trouvés
        res.status(200).json(diagnostics);
    } catch (error) {
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


const listerDiagnosticsClient = async (clientId, res) => {
    try {
        // Rechercher tous les diagnostics associés à ce client
        const diagnostics = await Diagnostic.find({ client: clientId })
            .populate('client')  // Peupler l'information du client si nécessaire
            .populate('voiture') // Peupler l'information de la voiture si nécessaire
            .populate('mecanicien')  // Peupler l'information du mécanicien si nécessaire
            .exec();

        // Si aucun diagnostic n'est trouvé
        if (!diagnostics || diagnostics.length === 0) {
            return res.status(404).json({ message: "Aucun diagnostic trouvé pour ce client." });
        }

        // Retourner la liste des diagnostics
        res.status(200).json(diagnostics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des diagnostics." });
    }
};

module.exports = {
    getDiagnostiquesTermines,
    getDiagnosticsParMecanicien,
    listerDiagnosticsClient
};

