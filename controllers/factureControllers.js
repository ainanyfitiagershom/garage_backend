const Facture = require("../models/Facture");  // Assurez-vous d'importer le modèle de Facture
const ReparationVoiture = require("../models/Reparation/ReparationVoiture");  // Assurez-vous d'importer le modèle de ReparationVoiture

const validerReparationEtGenererFacture = async (idReparationVoiture, res) => {
    try {
        // Récupérer la réparation voiture avec les détails associés
        const reparation = await ReparationVoiture.findById(idReparationVoiture)
            .populate("details_reparation.id_type_reparation")
            .populate("pieces_utilisees.piece");

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Vérifier que tous les détails de la réparation sont confirmés par le client
        const detailsNonValidés = reparation.details_reparation.filter(
            (detail) => detail.etat !== "Validé" && detail.etat !== "Terminé"
        );

        if (detailsNonValidés.length > 0) {
            return res.status(400).json({ message: "Tous les détails de la réparation ne sont pas validés." });
        }

        // Calculer le montant total de la facture
        let montantTotal = 0;
        let detailsFacture = [];

        // Calculer le montant des détails de la réparation (prix de chaque type de réparation)
        reparation.details_reparation.forEach((detail) => {
            const prixDetail = detail.prix;
            montantTotal += prixDetail;

            detailsFacture.push({
                type: "Réparation",  // Type de détail est une réparation
                libelle: detail.id_type_reparation.nom,
                quantite: 1, // On considère que chaque service est pris une fois
                prix_unitaire: prixDetail,
                prix_total: prixDetail
            });
        });

        // Calculer le montant des pièces utilisées, mais seulement les pièces "prises"
        reparation.pieces_utilisees.forEach((piece) => {
            if (piece.etat === "Prise") {  // Vérifier que la pièce est prise
                const prixPiece = piece.prix;
                const quantitePiece = piece.nombre;
                const prixTotalPiece = prixPiece * quantitePiece;
                montantTotal += prixTotalPiece;

                detailsFacture.push({
                    type: "Pièce",  // Type de détail est une pièce
                    libelle: piece.nom,
                    quantite: quantitePiece,
                    prix_unitaire: prixPiece,
                    prix_total: prixTotalPiece
                });
            }
        });

        // Générer le numéro de facture
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Mois sur 2 chiffres
        const day = String(date.getDate()).padStart(2, "0"); // Jour sur 2 chiffres

        // Compter le nombre de factures existantes pour ce jour
        const count = await Facture.countDocuments({
            date_facture: {
                $gte: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
                $lt: new Date(`${year}-${month}-${day}T23:59:59.999Z`)
            }
        });

        // Générer un numéro séquentiel
        const sequence = String(count + 1).padStart(4, "0");

        // Format du numéro de facture : AAAAMMJJ-XXXX (Ex: 20240329-0001)
        const numeroFacture = `${year}${month}${day}-${sequence}`;

        // Créer la facture
        const facture = new Facture({
            numero_facture: numeroFacture,
            client: reparation.client,
            reparation: reparation._id,
            montant_total: montantTotal,
            details: detailsFacture
        });

        // Sauvegarder la facture
        await facture.save();

        // Mettre à jour l'état de la réparation en "Terminé" (si tous les détails sont validés)
        reparation.etat = "En cours";
        await reparation.save();

        // Répondre avec la facture générée
        return res.status(200).json({ message: "Réparation validée et facture générée.", facture });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la validation de la réparation et de la génération de la facture.", error });
    }
};

const voirFacture = async (idReparationVoiture, res) => {
    try {
        // Chercher la facture associée à la réparation voiture
        const facture = await Facture.findOne({ reparation: idReparationVoiture })
            .populate("client", "nom prenom email") // Récupérer les infos du client
            .populate("reparation", "date_depot etat"); // Infos de la réparation

        if (!facture) {
            return res.status(404).json({ message: "Aucune facture trouvée pour cette réparation." });
        }

        return res.status(200).json({
            message: "Facture trouvée.",
            facture
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la récupération de la facture." });
    }
};


const listerFactures = async (idClient, res) => {
    try {
        let factures;

        if (idClient) {
            // Récupérer les factures d'un client spécifique
            factures = await Facture.find({ client: idClient })
                .populate("client", "nom prenom email")
                .populate({
                    path: "reparation",
                    populate: { path: "voiture", select: "marque model immatriculation" }
                })
                .sort({ date_facture: -1 }); // Trier par date (plus récent en premier)
        } else {
            // Récupérer toutes les factures
            factures = await Facture.find()
                .populate("client", "nom prenom email")
                .populate({
                    path: "reparation",
                    populate: { path: "voiture", select: "marque modele immatriculation" }
                })
                .sort({ date_facture: -1 });
        }

        if (factures.length === 0) {
            return res.status(404).json({ message: "Aucune facture trouvée." });
        }

        return res.status(200).json({ factures });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la récupération des factures.", error });
    }
};

const listerFacturesPourManager = async ( dateDebut, dateFin, res) => {
    try {
        let filtre = {};


        if (dateDebut && dateFin) {
            filtre.date_facture = {
                $gte: new Date(dateDebut), // Date début
                $lte: new Date(dateFin) // Date fin
            };
        }

        // Récupérer toutes les factures avec les informations des clients et des voitures
        const factures = await Facture.find(filtre)
            .populate("client", "nom prenom email")
            .populate({
                path: "reparation",
                populate: { path: "voiture", select: "marque modele immatriculation" }
            })
            .sort({ date_facture: -1 }); // Trier par date décroissante (dernières factures en premier)

        if (factures.length === 0) {
            return res.status(404).json({ message: "Aucune facture trouvée." });
        }

        return res.status(200).json({ factures });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la récupération des factures.", error });
    }
};

const getFactureDetail = async (idFacture, res) => {
    try {
        // Récupérer la facture avec les informations détaillées
        const facture = await Facture.findById(idFacture)
            .populate("client", "nom prenom email")
            .populate({
                path: "reparation",
                populate: { path: "voiture", select: "marque modele immatriculation" }
            });

        if (!facture) {
            return res.status(404).json({ message: "Facture non trouvée." });
        }

        return res.status(200).json({ facture });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la récupération de la facture.", error });
    }
};


module.exports = {
    validerReparationEtGenererFacture,
    voirFacture ,
    listerFactures ,
    listerFacturesPourManager,
    getFactureDetail
};
