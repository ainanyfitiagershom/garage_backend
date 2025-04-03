const ReparationVoiture = require('../models/Reparation/ReparationVoiture'); // Le modèle de réparation voiture
const Diagnostic = require('../models/Reservation/Diagnostic'); // Le modèle Diagnostic pour récupérer les informations
const Piece = require("../models/Reparation/Piece");
const TypeReparation = require("../models/Reparation/TypeReparation");
const Niveau = require("../models/Paramettres/Niveau");
const PlanningMecanicien = require("../models/Reservation/PlanningMecanicien");
const Client = require("../models/Utilisateur/Client");


const { estMecanicienDisponible, insertPlanningReparation } = require("../controllers/planningController");




const deposer_voiture = async (req, res) => {
    const { idrdv } = req.params;  // On récupère l'ID du diagnostic depuis les params de l'URL

    try {
        // Récupérer le diagnostic par son ID
        const diagnostic = await Diagnostic.findOne({ rendez_vous: idrdv });
        
        if (!diagnostic) {
            return res.status(404).json({ message: "Diagnostic non trouvé" });
        }

        // Modifier le statut du diagnostic en "Valide"
        diagnostic.etat = "Validé";  // Mettre à jour le statut du diagnostic
        await diagnostic.save(); // Sauvegarder les changements du diagnostic

        // Créer une nouvelle réparation avec la date actuelle
        const nouvelleReparation = new ReparationVoiture({
            client: diagnostic.client,       // Utilisation du client du diagnostic
            voiture: diagnostic.voiture,     // Utilisation de la voiture du diagnostic
            diagnostic: diagnostic._id,      // Ajout de la référence au diagnostic
            date_depot: new Date(),          // Date actuelle (maintenant)
            etat: "En attente",              // L'état initial est "En attente"
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



async function creationReparationVoiture(req, res) {
    try {
        const { idDiagnostic } = req.params;
        const { idTypeReparation, niveauDifficulte } = req.body;  
        // Récupérer le diagnostic associé à l'ID donné
        const diagnostic = await Diagnostic.findById(idDiagnostic).populate('client voiture mecanicien');
        if (!diagnostic) {
            throw new Error("Diagnostic introuvable.");
        }

        // Modifier l'état du diagnostic en "Terminé"
        diagnostic.etat = "Terminé";
        await diagnostic.save(); // Sauvegarder la modification du diagnostic

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
         if (isNaN(typeReparation.prix_base) || isNaN(niveau.pourcentage)) {
            return res.status(400).json({ message: "Les données de prix ou de pourcentage sont incorrectes." });
        }
        const prixAjuste = typeReparation.prix_base * (niveau.pourcentage / 100);

        // Créer un nouveau détail de réparation pour ce diagnostic
        const detailReparation = {
            id_type_reparation: idTypeReparation,
            mecaniciens: [diagnostic.mecanicien], // Associer le mécanicien qui a fait le diagnostic
            difficulte: niveauDifficulte,
            etat: "Terminé",  // L'état est déjà "Terminé"
            prix: prixAjuste,  // Prix ajusté selon le niveau
            duree_estimee: typeReparation.temps_estime,  // Durée estimée
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
}






const getReparationByDiagnostic = async (idDiagnostic, res) => {
    try {

        console.log("iddiag " + idDiagnostic)
        // Vérifier si une réparation existe pour ce diagnostic
        const reparation = await ReparationVoiture.findOne({ diagnostic: idDiagnostic })
        .populate({
            path: 'details_reparation',
            populate: [
                { path: 'id_type_reparation', model: 'TypeReparation' }, // Type de réparation
                { path: 'difficulte', model: 'Niveau' }, // Niveau de difficulté
                { path: 'mecaniciens', model: 'User' } // Mécaniciens
            ]
        })

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




const ajouterPieceATypeReparation = async (idReparationVoiture, idTypeReparation, idPiece, nombre ) => {
    try {

        // Vérifier si la réparation existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return { success: false, message: "Réparation non trouvée.", error };
        }

        // Récupérer les informations de la pièce
        const piece = await Piece.findById(idPiece);
        if (!piece) {
            return { success: false, message: "Pièce non trouvée", error };
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


        return { success: true, message: "Pièce ajoutée/modifiée avec succès au type de réparation.", reparation };

    } catch (error) {
        console.log(error);
    }
};



const ajouterTypeReparationAReparation = async (idReparationVoiture, idTypeReparation, idNiveau) => {
    try {

        // Vérifier si la réparation voiture existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return { success: false, message: "Réparation non trouvée.", error };
        }

        // Vérifier si le type de réparation existe
        const typeReparation = await TypeReparation.findById(idTypeReparation);
        if (!typeReparation) {
            return { success: false, message: "Type de réparation non trouvé.", error };
        }

        // Vérifier si le niveau de difficulté existe
        const niveau = await Niveau.findById(idNiveau);
        if (!niveau) {
            return { success: false, message: "Niveau de difficulté non trouvé.", error };
        }

        // Vérifier si le type de réparation est déjà ajouté
        const typeReparationExistante = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (typeReparationExistante) {
            return { success: false, message: "Ce type de réparation est déjà ajouté à cette réparation voiture.", error };
            
        }

        // Calcul du prix ajusté en fonction du niveau de difficulté
        const prixAjuste = typeReparation.prix_base * (niveau.pourcentage / 100);

        // Ajouter le type de réparation avec le prix ajusté
        reparation.details_reparation.push({
            id_type_reparation: idTypeReparation,
            mecaniciens: [], // Aucun mécanicien attribué au départ
            difficulte: idNiveau,
            etat: "En attente", // État initial
            prix: prixAjuste, // Prix calculé en fonction du niveau
            duree_estimee: typeReparation.temps_estime, // Durée estimée issue du type de réparation
            date_heure_debut: null,
            date_heure_fin: null
        });

        // Sauvegarder la réparation mise à jour
        await reparation.save();


        return { success: true, message: "Type de réparation ajouté avec succès.", reparation };
    } catch (error) {
       console.log(error);
    }
};



const insererDetailReparationEtPieces = async (idReparationVoiture, idTypeReparation, idNiveau, pieces, res) => {
    try {
        // Étape 1 : Ajouter le type de réparation avec son niveau de difficulté
        await ajouterTypeReparationAReparation(idReparationVoiture, idTypeReparation, idNiveau);

        // Étape 2 : Ajouter les pièces associées à ce type de réparation
        for (const piece of pieces) {
            const  idPiece = piece.id;
            const  nombre  = piece.nombre;
            await ajouterPieceATypeReparation(idReparationVoiture, idTypeReparation, idPiece, nombre);
        }

        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return { success: false, message: "Réparation non trouvée.", error };
        }

        res.status(200).json({ message: "Détail de réparation et pièces insérés avec succès.",reparation});

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

            // Vérifier si le mécanicien est déjà assigné à ce détail de réparation
            const isAlreadyAssigned = detailReparation.mecaniciens.some(m => m.toString() === mecanicienId);
            if (isAlreadyAssigned) {
                return { success: false, message: "Ce mécanicien est déjà assigné à cette réparation." };
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

        return { success: true, message: "Mécanicien assigné avec succès." };
    } catch (error) {
        throw new Error("Erreur lors de l'assignation : " + error.message);
    }
};


const getDetailReparation = async (idReparationVoiture, idDetailReparation, res) => {
    try {
        // Trouver la réparation et peupler les relations nécessaires
        const reparation = await ReparationVoiture.findById(idReparationVoiture)
            .populate({
                path: 'details_reparation',
                populate: [
                    { path: 'id_type_reparation', model: 'TypeReparation' }, // Type de réparation
                    { path: 'difficulte', model: 'Niveau' }, // Niveau de difficulté
                    { path: 'mecaniciens', model: 'User' } // Mécaniciens
                ]
            })
            .populate({
                path: 'pieces_utilisees.piece',
                model: 'Piece' // Récupérer les infos des pièces utilisées
            });

        // Vérification de l'existence de la réparation
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée" });
        }

        // Convertir l'ID en ObjectId si nécessaire
        const mongoose = require('mongoose');
        const idDetailReparationObjectId = new mongoose.Types.ObjectId(idDetailReparation);

        // Récupérer le détail spécifique en filtrant après la récupération
        const detailReparation = reparation.details_reparation.find(
            detail => detail._id.toString() === idDetailReparationObjectId.toString()
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé" });
        }

        // Extraction des données nécessaires
        const { id_type_reparation, duree_estimee, mecaniciens, difficulte, etat, prix, date_heure_debut, date_heure_fin } = detailReparation;

        if (!id_type_reparation) {
            return res.status(404).json({ message: "Type de réparation non trouvé" });
        }

        // Récupérer l'ID et le nom du type de réparation
        const idTypeReparation = id_type_reparation._id.toString();
        const nomTypeReparation = id_type_reparation.nom;

        // Filtrer les pièces utilisées correspondant à ce type de réparation
        const piecesUtilisees = reparation.pieces_utilisees.filter(piece => 
            piece.id_type_reparation?.toString() === idTypeReparation
        );

        // Retourner les informations du détail de réparation
        return res.status(200).json({
            idReparationVoiture: reparation._id,
            idDetailReparation: detailReparation._id,
            nomTypeReparation,
            idTypeReparation,
            mecaniciens,
            difficulte,
            etat,
            prix,
            dureeEstimee: duree_estimee,
            dateHeureDebut: date_heure_debut,
            dateHeureFin: date_heure_fin,
            piecesUtilisees
        });

    } catch (error) {
        console.error("Erreur dans getDetailReparation:", error);
        return res.status(500).json({ message: "Erreur du serveur", error: error.message });
    }
};

const obtenirReparationParId = async (idReparationVoiture, res) => {
    try {
        // Chercher la réparation par son ID

        console.lo
        const reparation = await ReparationVoiture.findById(idReparationVoiture)
        .populate({
            path: 'details_reparation',
            populate: [
                { path: 'id_type_reparation', model: 'TypeReparation' }, // Type de réparation
                { path: 'difficulte', model: 'Niveau' }, // Niveau de difficulté
                { path: 'mecaniciens', model: 'User' } // Mécaniciens
            ]
        })
        .populate({
            path: 'pieces_utilisees.piece',
            model: 'Piece' // Récupérer les infos des pièces utilisées
        });

        // Vérifier si la réparation existe
        if (!reparation) {
            return { success: false, message: "Réparation non trouvée." };
        }

        return res.status(200).json({
            message: "Détail de réparation trouvè.",
            reparation: reparation
        });

    } catch (error) {
        console.error("❌ Erreur :", error.message);
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



const validerDetailReparationParType = async (idReparationVoiture, idTypeReparation) => {
    try {
        // Trouver la réparation
        const reparation = await ReparationVoiture.findById(idReparationVoiture).populate({
            path: 'details_reparation',
            populate: [
                { path: 'id_type_reparation', model: 'TypeReparation' },
                { path: 'mecaniciens', model: 'User' }
            ]
        });

        if (!reparation) {
            return { success: false, message: "Réparation non trouvée" };
        }

        // Trouver le détail de réparation correspondant
        const detailReparation = reparation.details_reparation.find(d => 
            d.id_type_reparation && d.id_type_reparation._id.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return { success: false, message: "Détail de réparation pour ce type non trouvé" };
        }

        // Vérifier si le détail est déjà confirmé
        if (detailReparation.etat === 'Confirmé') {
            return { success: false, message: "Le détail de réparation est déjà confirmé" };
        }

        // Mettre à jour l'état à "Confirmé"
        detailReparation.etat = 'Confirmé';
        await reparation.save();

        // Filtrer les pièces utilisées
        const piecesUtilisees = reparation.pieces_utilisees
            ? reparation.pieces_utilisees.filter(piece => 
                piece.id_type_reparation && piece.id_type_reparation.toString() === idTypeReparation
            )
            : [];

        return { 
            success: true, 
            message: "Détail de réparation validé avec succès.",
            data: {
                idReparationVoiture: reparation._id,
                idDiagnostic: reparation.diagnostic,
                idTypeReparation: idTypeReparation,
                etatDetailReparation: detailReparation.etat,
                mecaniciens: detailReparation.mecaniciens,
                piecesUtilisees: piecesUtilisees
            }
        };
    } catch (error) {
        return { success: false, message: "Erreur du serveur: " + error.message };
    }
};




const ValiderReparationsManager = async (idReparationVoiture) => {
    try {
        // Récupérer la réparation avec ses détails et mécaniciens
        const reparation = await ReparationVoiture.findById(idReparationVoiture)
            .populate("details_reparation"); // Vérifier si besoin de populate

        if (!reparation) {
            return { success: false, message: "Réparation non trouvée." };
        }

        // Vérifier si chaque détail a au moins un mécanicien
        const detailsNonAssignes = reparation.details_reparation.filter(detail => detail.mecaniciens.length === 0);

        if (detailsNonAssignes.length > 0) {
            return { success: false, message: "Tous les détails n'ont pas encore de mécaniciens assignés." };
        }

        // Mettre à jour le statut de la réparation
        reparation.etat = "Confirmé";
        await reparation.save();

        return { success: true, message: "Réparation confirmée avec succès." };
    } catch (error) {
        return { success: false, message: "Erreur lors de la validation : " + error.message };
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

const validerOuAnnulerDetailReparation = async (idClient,idReparationVoiture, idTypeReparation, action, res) => {
    try {
        // Rechercher la réparation voiture par son ID
        const reparation = await ReparationVoiture.findById(idReparationVoiture);

        // Rechercher la réparation voiture par son ID
        const client = await Client.findById(idClient);

        if (!client) {
            return res.status(404).json({ message: "Client non trouvée." });
        }

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
    choisirPiecePriseOuNon,
    obtenirReparationParId
};
