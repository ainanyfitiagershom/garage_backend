const ReparationVoiture = require('../models/ReparationVoiture'); // Le modèle de réparation voiture
const Diagnostic = require('../models/Diagnostic'); // Le modèle Diagnostic pour récupérer les informations
const TypeReparation = require("../models/TypeReparation");
const Piece = require("../models/Piece");
const TypeReparation = require("../models/TypeReparation");
const Niveau = require("../models/Niveau");

const { estMecanicienDisponible } = require("../controllers/planningController");


const deposer_voiture = async (req, res) => {
    const { idDiagnostic } = req.params;  // On récupère l'ID du diagnostic depuis les params de l'URL
    const { dateDepot } = req.body;  // On récupère la date de dépôt depuis le body de la requête

    try {
        // Récupérer le diagnostic par son ID
        const diagnostic = await Diagnostic.findById(idDiagnostic);
        
        if (!diagnostic) {
            return res.status(404).json({ message: "Diagnostic non trouvé" });
        }

        // Créer une nouvelle réparation en utilisant les informations du diagnostic
        const nouvelleReparation = new ReparationVoiture({
            client: diagnostic.client,       // Utilisation du client du diagnostic
            voiture: diagnostic.voiture,     // Utilisation de la voiture du diagnostic
            diagnostic: diagnostic._id,      // Ajout de la référence au diagnostic
            date_depot: dateDepot,           // Date de dépôt fournie dans le corps de la requête
            etat: "En attente",                // L'état initial est "En cours"
        });

        // Sauvegarder la nouvelle réparation dans la base de données
        await nouvelleReparation.save();

        // Retourner la réponse avec la nouvelle réparation créée
        res.status(201).json({
            message: "Réparation voiture déposée avec succès",
            reparation: nouvelleReparation,
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};




async function creationReparationVoiture(idDiagnostic , idTypeReparation, niveauDifficulte, res) {
    try {
        // Récupérer le diagnostic associé à l'ID donné
        const diagnostic = await Diagnostic.findById(idDiagnostic).populate('client voiture');
        if (!diagnostic) {
            throw new Error("Diagnostic introuvable.");
        }

        // Vérifier si une réparation existe déjà pour ce diagnostic
        let reparation = await ReparationVoiture.findOne({ diagnostic: idDiagnostic });

        if (!reparation) {
            // Si aucune réparation n'existe, créer une nouvelle réparation
            const dateDepot = new Date();
            reparation = new ReparationVoiture({
                client: diagnostic.client._id,
                voiture: diagnostic.voiture._id,
                diagnostic: diagnostic._id, // Associer le diagnostic
                date_depot: dateDepot,
                etat: "En attente", // L'état initial de la réparation
                details_reparation: [], // Détails des réparations à ajouter plus tard
                pieces_utilisees: [],   // Pièces utilisées à ajouter plus tard
            });

            // Sauvegarder la nouvelle réparation dans la base de données
            await reparation.save();
        }


        // Récupérer le type de réparation
        const typeReparation = await TypeReparation.findById(idTypeReparation);
        if (!typeReparation) {
            return res.status(404).json({ message: "Type de réparation introuvable." });
        }

        // Récupérer le niveau de difficulté
        const niveau = await Niveau.findById(niveauDifficulte);
        if (!niveau) {
            return res.status(404).json({ message: "Niveau de difficulté introuvable." });
        }

        // Calcul du prix ajusté en fonction du niveau de difficulté
        const prixAjuste = typeReparation.prix * (niveau.pourcentage / 100);

        // Créer un nouveau détail de réparation pour ce diagnostic
        const detailReparation = {
            id_type_reparation: typeReparation._id,
            mecaniciens: [diagnostic.mecanicien], // Associer le mécanicien qui a fait le diagnostic
            difficulte: niveau._id,
            etat: "Terminé",  // L'état est déjà "Terminé"
            prix: prixAjuste,  // Prix ajusté selon le niveau
            duree_estimee: typeReparation.duree_estimee,  // Durée estimée
            date_heure_debut: diagnostic.date, // La date du diagnostic comme début
            date_heure_fin: diagnostic.date, // La date du diagnostic comme fin
        };

        // Ajouter le détail de réparation à la réparation existante
        reparation.details_reparation.push(detailReparation);

        // Sauvegarder la modification dans la base de données
        await reparation.save();

        // Répondre avec la réparation et le détail ajouté
        return res.status(200).json({
            message: "Réparation créée avec le détail du diagnostic.",
            reparation,
            detailReparation
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la création de la réparation et du détail." });
    }
};






const getReparationByDiagnostic = async (req, res) => {
    const { idDiagnostic } = req.params; // Récupérer l'ID du diagnostic depuis l'URL

    try {
        // Vérifier si une réparation existe pour ce diagnostic
        const reparation = await ReparationVoiture.findOne({ diagnostic: idDiagnostic })
            .populate("client voiture") // Récupérer les infos du client et de la voiture
            .populate("details_reparation.id_type_reparation") // Infos des types de réparation
            .populate("details_reparation.difficulte") // Infos du niveau de difficulté
            .populate("pieces_utilisees.piece"); // Infos des pièces utilisées

        if (!reparation) {
            return res.status(404).json({ message: "Aucune réparation trouvée pour ce diagnostic." });
        }

        // Retourner la réparation trouvée
        return res.status(200).json({
            message: "Réparation trouvée avec succès.",
            reparation,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};




const ajouterPieceATypeReparation = async (idReparationVoiture, idTypeReparation, idPiece, nombre , res) => {
    try {

        // Vérifier si la réparation existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Récupérer les informations de la pièce
        const piece = await Piece.findById(idPiece);
        if (!piece) {
            return res.status(404).json({ message: "Pièce non trouvée." });
        }

        // Si le prix de la pièce est null, gérer cette situation (par exemple, mettre à 0 ou une autre valeur)
        const prixPiece = piece.prix_unitaire || 0; // Si prix_unitaire est null, on met 0 par défaut
        const nomPiece = piece.nom; // Nom de la pièce

        // Vérifier si la pièce existe déjà dans les pièces utilisées pour ce type de réparation
        const pieceExistante = reparation.pieces_utilisees.find(
            (piece) => piece.id_type_reparation.toString() === idTypeReparation && piece.piece.toString() === idPiece
        );

        if (pieceExistante) {
            // Si la pièce existe déjà, on incrémente simplement le nombre
            pieceExistante.nombre += nombre;
        } else {
            // Si la pièce n'existe pas, on l'ajoute avec le nombre spécifié
            reparation.pieces_utilisees.push({
                id_type_reparation: idTypeReparation,
                piece: idPiece,
                nom: nomPiece, // Ajouter le nom de la pièce
                nombre: nombre,
                etat: "Non prise", // État initial
                prix: prixPiece // Utilisation du prix récupéré
            });
        }

        // Sauvegarder les modifications dans la réparation
        await reparation.save();

        res.status(200).json({
            message: "Pièce ajoutée/modifiée avec succès au type de réparation.",
            reparation,
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



const ajouterTypeReparationAReparation = async (idReparationVoiture, idTypeReparation, idNiveau, res) => {
    try {

        // Vérifier si la réparation voiture existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation voiture non trouvée." });
        }

        // Vérifier si le type de réparation existe
        const typeReparation = await TypeReparation.findById(idTypeReparation);
        if (!typeReparation) {
            return res.status(404).json({ message: "Type de réparation non trouvé." });
        }

        // Vérifier si le niveau de difficulté existe
        const niveau = await Niveau.findById(idNiveau);
        if (!niveau) {
            return res.status(404).json({ message: "Niveau de difficulté non trouvé." });
        }

        // Vérifier si le type de réparation est déjà ajouté
        const typeReparationExistante = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (typeReparationExistante) {
            return res.status(400).json({ message: "Ce type de réparation est déjà ajouté à cette réparation voiture." });
        }

        // Calcul du prix ajusté en fonction du niveau de difficulté
        const prixAjuste = typeReparation.prix * (niveau.pourcentage / 100);

        // Ajouter le type de réparation avec le prix ajusté
        reparation.details_reparation.push({
            id_type_reparation: idTypeReparation,
            mecaniciens: [], // Aucun mécanicien attribué au départ
            difficulte: idNiveau,
            etat: "En attente", // État initial
            prix: prixAjuste, // Prix calculé en fonction du niveau
            duree_estimee: typeReparation.duree_estimee, // Durée estimée issue du type de réparation
            date_heure_debut: null,
            date_heure_fin: null
        });

        // Sauvegarder la réparation mise à jour
        await reparation.save();

        res.status(200).json({
            message: "Type de réparation ajouté avec succès.",
            prixAjuste,
            reparation
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



const insererDetailReparationEtPieces = async (idReparationVoiture, idTypeReparation, idNiveau, pieces, res) => {
    try {
        // Étape 1 : Ajouter le type de réparation avec son niveau de difficulté
        await ajouterTypeReparationAReparation(idReparationVoiture, idTypeReparation, idNiveau, res);

        // Étape 2 : Ajouter les pièces associées à ce type de réparation
        for (const piece of pieces) {
            const { idPiece, nombre } = piece;
            await ajouterPieceATypeReparation(idReparationVoiture, idTypeReparation, idPiece, nombre, res);
        }

        res.status(200).json({ message: "Détail de réparation et pièces insérés avec succès." });

    } catch (error) {
        console.error("Erreur lors de l'insertion du détail de réparation :", error.message);
        res.status(500).json({ error: "Une erreur est survenue lors de l'insertion du détail de réparation." });
    }
};




const modifierDetailReparation = async (idReparationVoiture, idTypeReparation, idNiveau, pieces, res) => {
    try {
        // Récupérer la réparation voiture
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return res.status(404).json({ error: "Réparation voiture introuvable." });
        }

        // Trouver le détail de réparation correspondant
        const detailReparation = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ error: "Détail de réparation introuvable." });
        }

        // Vérifier si le détail est déjà validé par le manager
        if (detailReparation.etat === "Confirmé") {
            return res.status(403).json({ error: "Modification impossible, ce détail est déjà confirmé." });
        }

        // Mise à jour du niveau de difficulté
        detailReparation.difficulte = idNiveau;

        // Mise à jour des pièces associées
        reparation.pieces_utilisees = reparation.pieces_utilisees.filter(
            (piece) => piece.id_type_reparation.toString() !== idTypeReparation
        );

        pieces.forEach((piece) => {
            // Vérifier si la pièce existe déjà pour ce type de réparation
            const pieceExistante = reparation.pieces_utilisees.find(
                (p) => p.id_type_reparation.toString() === idTypeReparation && p.piece.toString() === piece.idPiece
            );
        
            if (pieceExistante) {
                // Si la pièce existe, on met à jour la quantité
                pieceExistante.nombre = piece.nombre;
            } else {
                // Sinon, on ajoute la nouvelle pièce
                reparation.pieces_utilisees.push({
                    id_type_reparation: idTypeReparation,
                    piece: piece.idPiece,
                    nombre: piece.nombre,
                    etat: "Non prise"
                });
            }
        });

        // Sauvegarde des modifications
        await reparation.save();

        res.status(200).json({ message: "Détail de réparation mis à jour avec succès." });

    } catch (error) {
        console.error("Erreur lors de la modification du détail de réparation :", error.message);
        res.status(500).json({ error: "Une erreur est survenue lors de la modification du détail de réparation." });
    }
}



const supprimerDetailReparation = async (idReparationVoiture, idDetailReparation, res) => {
    try {
        // Trouver la réparation
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        // Trouver le détail de la réparation à supprimer
        const detailReparation = reparation.details_reparation.id(idDetailReparation);
        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé" });
        }

        // Supprimer le détail de la réparation
        reparation.details_reparation.pull(idDetailReparation);

        // Supprimer les pièces associées à ce détail de réparation
        // Utilisation de pull pour retirer toutes les pièces qui ont le même id_type_reparation
        reparation.pieces_utilisees.pull({
            id_type_reparation: detailReparation.id_type_reparation
        });

        // Sauvegarder les modifications dans la réparation
        await reparation.save();

        // Retourner une réponse de succès
        res.status(200).json({
            message: "Détail de réparation et pièces associées supprimés avec succès",
            reparation
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};

const assignerMecanicienAReparation = async (mecanicienId, idReparationVoiture, idTypeReparation, dateHeureDebut, dateHeureFin) => {
    try {

         // Vérifier si le mécanicien est disponible
         const disponible = await estMecanicienDisponible(mecanicienId, dateHeureDebut, dateHeureFin);
         if (!disponible) {
             return { success: false, message: "Le mécanicien est absent pendant cette période." };
         }

        // Vérifier si la réparation existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            throw new Error("Réparation introuvable.");
        }

        // Vérifier si le détail de réparation existe
        const detailReparation = reparation.details_reparation.find(d => d.id_type_reparation.toString() === idTypeReparation);
        if (!detailReparation) {
            throw new Error("Détail de réparation introuvable.");
        }

        // Vérifier la disponibilité du mécanicien
        const planningExistant = await PlanningMecanicien.findOne({
            mecanicien: mecanicienId,
            statut: { $in: ["Réservé", "En cours"] }, 
            $or: [
                { date_heure_debut: { $lt: dateHeureFin }, date_heure_fin: { $gt: dateHeureDebut } }
            ]
        });

        if (planningExistant) {
            throw new Error("Le mécanicien n'est pas disponible sur ces horaires.");
        }

        // Ajouter le mécanicien à la liste des mécaniciens du détail de réparation
        detailReparation.mecaniciens.push(mecanicienId);

        // Mettre à jour la date de début et fin du détail de réparation
        if (!detailReparation.date_heure_debut || dateHeureDebut < detailReparation.date_heure_debut) {
            detailReparation.date_heure_debut = dateHeureDebut;
        }
        if (!detailReparation.date_heure_fin || dateHeureFin > detailReparation.date_heure_fin) {
            detailReparation.date_heure_fin = dateHeureFin;
        }

        // Sauvegarder la mise à jour de la réparation
        await reparation.save();

        // Insérer dans le planning du mécanicien
        await insertPlanningReparation(mecanicienId, idReparationVoiture, idTypeReparation, dateHeureDebut, dateHeureFin);

        return { message: "Mécanicien assigné avec succès." };
    } catch (error) {
        throw new Error("Erreur lors de l'assignation : " + error.message);
    }
};


const getDetailReparation = async (idReparationVoiture, idDetailReparation, res) => {
    try {
        // Trouver la réparation
        const reparation = await ReparationVoiture.findById(idReparationVoiture).populate({
            path: 'details_reparation',
            match: { _id: idDetailReparation },
            populate: [
                { path: 'id_type_reparation', model: 'TypeReparation' }, // Ajout du nom du type de réparation
                { path: 'difficulte', model: 'Niveau' },
                { path: 'mecaniciens', model: 'User' } // Populer les mécaniciens
            ]
        });

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        // Si on trouve le détail de la réparation
        const detailReparation = reparation.details_reparation[0];
        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé" });
        }

        // Récupérer le nom du type de réparation
        const typeReparation = detailReparation.id_type_reparation;
        const nomTypeReparation = typeReparation.nom;

        // Récupérer la durée estimée pour le type de réparation
        const dureeEstimee = detailReparation.duree_estimee;

        // Retourner les informations du détail de la réparation
        res.status(200).json({
            idReparationVoiture: reparation._id,
            idDetailReparation: detailReparation._id,
            nomTypeReparation: nomTypeReparation,  // Nom du type de réparation
            idTypeReparation: typeReparation._id,
            mecaniciens: detailReparation.mecaniciens,
            difficulte: detailReparation.difficulte,
            etat: detailReparation.etat,
            prix: detailReparation.prix,
            dureeEstimee: dureeEstimee,  // Durée estimée de la réparation
            dateHeureDebut: detailReparation.date_heure_debut,
            dateHeureFin: detailReparation.date_heure_fin,
            piecesUtilisees: reparation.pieces_utilisees.filter(piece =>
                piece.id_type_reparation.toString() === detailReparation.id_type_reparation.toString()
            )
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};



const obtenirReparationsEtPieces = async (idReparationVoiture) => {
    try {
        // Récupérer la réparation avec les détails et les pièces utilisées
        const reparation = await ReparationVoiture.findById(idReparationVoiture)
            .populate("details_reparation.id_type_reparation", "nom difficulte prix") 
            .populate("details_reparation.difficulte", "pourcentage") 
            .populate("pieces_utilisees.piece", "nom prix_unitaire")
            .lean(); 

        if (!reparation) {
            throw new Error("Réparation non trouvée.");
        }

        // Construire la réponse optimisée
        const result = {
            id_reparation_voiture: reparation._id,
            details_reparation: reparation.details_reparation.map(detail => ({
                id_type_reparation: detail.id_type_reparation?._id,
                nom_type_reparation: detail.id_type_reparation?.nom || "Inconnu",
                etat: detail.etat,
                prix: detail.id_type_reparation?.prix
                    ? detail.id_type_reparation.prix * (detail.difficulte?.pourcentage / 100)
                    : 0,
                difficulte: detail.difficulte?.pourcentage || "Inconnu",
                duree_estimee: detail.duree_estimee || 0,
                pieces_utilisees: reparation.pieces_utilisees
                    .filter(piece => piece.id_type_reparation.toString() === detail.id_type_reparation?._id.toString())
                    .map(piece => ({
                        id_piece: piece.piece?._id,
                        nom_piece: piece.piece?.nom || "Inconnu",
                        nombre: piece.nombre,
                        prix: piece.piece?.prix_unitaire || 0,
                        etat: piece.etat
                    }))
            }))
        };

        return result;
    } catch (error) {
        console.error("Erreur lors de l'obtention des réparations :", error.message);
        throw error;
    }
};



const validerDetailReparationParType = async (idReparationVoiture, idTypeReparation, res) => {
    try {
        // Trouver la réparation par son ID et les détails de réparation par idTypeReparation
        const reparation = await ReparationVoiture.findById(idReparationVoiture).populate({
            path: 'details_reparation',
            match: { id_type_reparation: idTypeReparation },
            populate: [
                { path: 'id_type_reparation', model: 'TypeReparation' },
                { path: 'mecaniciens', model: 'User' }
            ]
        });

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        // Trouver le détail de réparation correspondant à idTypeReparation
        const detailReparation = reparation.details_reparation.find(d => 
            d.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation pour ce type de réparation non trouvé" });
        }

        // Vérifier si le détail est déjà confirmé
        if (detailReparation.etat === 'Confirmé') {
            return res.status(400).json({ message: "Le détail de réparation est déjà confirmé" });
        }

        // Mettre à jour le statut du détail de réparation à "Confirmé"
        detailReparation.etat = 'Confirmé';

        // Mettre à jour les pièces utilisées pour ce détail de réparation à "Valide"
        reparation.pieces_utilisees.forEach(piece => {
            if (piece.id_type_reparation.toString() === idTypeReparation) {
                piece.etat = 'Valide';
            }
        });

        // Enregistrer les modifications de la réparation
        await reparation.save();

        // Retourner la réponse avec les informations mises à jour
        res.status(200).json({
            message: "Détail de réparation validé avec succès.",
            idReparationVoiture: reparation._id,
            idTypeReparation: idTypeReparation,
            etatDetailReparation: detailReparation.etat,
            mecaniciens: detailReparation.mecaniciens,
            piecesUtilisees: reparation.pieces_utilisees.filter(piece =>
                piece.id_type_reparation.toString() === idTypeReparation
            )
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};

const ValiderReparationsManager = async (idReparationVoiture) => {
    try {
        // Récupérer la réparation avec tous ses détails
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            throw new Error("Réparation non trouvée.");
        }

        // Vérifier si tous les détails de la réparation ont des mécaniciens assignés
        const detailsReparationNonAssignes = reparation.details_reparation.filter(detail => detail.mecaniciens.length === 0);

        if (detailsReparationNonAssignes.length > 0) {
            throw new Error("Tous les détails de la réparation n'ont pas encore de mécaniciens assignés.");
        }

        // Mettre à jour le statut de la réparation à "Confirmée"
        reparation.etat = "Confirmé";

        // Sauvegarder la réparation avec son nouveau statut
        await reparation.save();

        return { message: "Réparation confirmée avec succès." };
    } catch (error) {
        throw new Error("Erreur lors de la validation de la réparation : " + error.message);
    }
};



const choisirPiecePriseOuNon = async (idReparationVoiture, idTypeReparation, idPiece, prise, nombre, res) => {
    try {
        // Rechercher la réparation voiture par son ID
        const reparation = await ReparationVoiture.findById(idReparationVoiture);

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Vérifier si la réparation est validée ou clôturée
        if (reparation.etat === 'Validé' ||reparation.etat === 'Terminé' || reparation.etat === 'Annulé') {
            return res.status(400).json({ message: "La réparation est déjà validée ou annulée. Vous ne pouvez pas modifier les pièces." });
        }

        // Trouver le détail de la réparation associé au type de réparation
        const detailReparation = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé pour ce type de réparation." });
        }

        // Trouver la pièce spécifique associée à ce type de réparation
        const piece = reparation.pieces_utilisees.find(
            (piece) => piece.id_type_reparation.toString() === idTypeReparation && piece.piece.toString() === idPiece
        );

        if (!piece) {
            return res.status(404).json({ message: "Pièce non trouvée pour ce type de réparation." });
        }

        // Vérifier la quantité en stock de la pièce
        const pieceInStock = await Piece.findById(idPiece);
        
        if (!pieceInStock) {
            return res.status(404).json({ message: "La pièce spécifiée n'existe pas dans le stock." });
        }

        // Vérifier si la quantité demandée est disponible en stock
        if (nombre > pieceInStock.quantite) {
            return res.status(400).json({ message: `Il n'y a pas assez de stock pour cette pièce. Quantité disponible : ${pieceInStock.quantite}` });
        }

        // Si "prise" est true, on marque la pièce comme prise. Sinon, on la marque comme non prise.
        piece.etat = prise ? 'Prise' : 'Non prise';
        piece.nombre = nombre;  // Met à jour le nombre de pièces prises

        // Mise à jour du stock après avoir pris la pièce
        pieceInStock.quantite -= nombre;

        // Sauvegarder les modifications dans la réparation et le stock de la pièce
        await reparation.save();
        await pieceInStock.save();

        return res.status(200).json({
            message: `La pièce a été ${prise ? 'prise' : 'non prise'} avec succès.`,
            piece: piece
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur lors de la modification de l'état de la pièce." });
    }
};

const validerOuAnnulerDetailReparation = async (idReparationVoiture, idTypeReparation, action, res) => {
    try {
        // Rechercher la réparation voiture par son ID
        const reparation = await ReparationVoiture.findById(idReparationVoiture);

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Trouver le détail de la réparation associé au type de réparation
        const detailReparation = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé pour ce type de réparation." });
        }

        if (detailReparation.etat === 'Validé') {
            return res.status(400).json({ message: "Ce détail de réparation a déjà été validé par le manager." });
        }


        // Vérifier si le détail a déjà été validé par le manager
        if (detailReparation.etat !== 'Confirmé') {
            return res.status(400).json({ message: "Ce détail de réparation n'est pas encore Confirmé par le manager." });
        }

        // Vérification de l'action (valider ou annuler)
        if (action === 'valider') {
            // Valider la réparation et les pièces associées
            detailReparation.etat = 'Validé'; // Mettre l'état du détail à 'Validé'
            await reparation.save();  // Sauvegarder les modifications

            return res.status(200).json({ message: "Détail de réparation validé avec succès et pièces prises." });
        } else if (action === 'annuler') {
            // Annuler la réparation et les pièces associées
            detailReparation.etat = 'Annulé';  // Mettre l'état du détail à 'Annulé'

            // Annuler les pièces associées à ce type de réparation
            reparation.pieces_utilisees.forEach((piece) => {
                if (piece.id_type_reparation.toString() === idTypeReparation) {
                    piece.etat = 'Annulé';  // Changer l'état de la pièce à 'Annulé'
                }
            });

            // Annuler le planning des mécaniciens liés à ce type de réparation
             await PlanningMecanicien.updateMany(
                {
                    id_reparation_voiture: idReparationVoiture,
                    id_tache: idTypeReparation
                },
                {
                    statut: 'Annulé'
                }
            );

            await reparation.save();  // Sauvegarder les modifications

            return res.status(200).json({ message: "Détail de réparation annulé avec succès et pièces annulées." });
        } else {
            return res.status(400).json({ message: "Action invalide. Utilisez 'valider' ou 'annuler'." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur lors de la validation/annulation du détail de réparation." });
    }
};




module.exports = { deposer_voiture, 
    creationReparationVoiture , 
    getReparationByDiagnostic ,
    assignerMecanicienAReparation , 
    ValiderReparationsManager,
    ajouterPieceATypeReparation ,
    ajouterTypeReparationAReparation ,
    obtenirReparationsEtPieces ,
    insererDetailReparationEtPieces, 
    modifierDetailReparation,
    getDetailReparation,
    validerDetailReparationParType,
    supprimerDetailReparation,
    validerOuAnnulerDetailReparation,
    choisirPiecePriseOuNon
};
