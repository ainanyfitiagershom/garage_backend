const PlanningMecanicien = require("../models/Reservation/PlanningMecanicien");
const Diagnostic = require("../models/Reservation/Diagnostic");
const ReparationVoiture = require("../models/Reparation/ReparationVoiture");
const AbsenceMecanicien = require("../models/Reservation/AbsenceMecanicien");
const User = require("../models/Utilisateur/User");
const TypeReparation = require("../models/Reparation/TypeReparation");



const getPlanningsReserves = async (req, res) => {
    try {
        // Récupérer les plannings avec statut "Réservé" ou "En cours"
        const plannings = await PlanningMecanicien.find({ statut: { $in: ["Réservé", "En cours"] } })
            .populate("mecanicien", "nom prenom") // Populate le mécanicien
            .sort({ date_heure_debut: 1 }); // Trier par date de début

        // Récupérer tous les diagnostics et réparations en parallèle
        const tasks = plannings.map(async (planning) => {
            let details = null;

            if (planning.type_tache === "Diagnostic") {
                details = await Diagnostic.findById(planning.id_tache)
                    .populate("client")
                    .populate({
                        path: "voiture",
                        populate: [
                          { path: "model" },
                          { path: "energie" },
                          { path: "transmission" }
                        ]
                      }) // Informations sur la voiture;
            } else if (planning.type_tache === "Réparation") {
                details = await ReparationVoiture.findById(planning.id_reparation_voiture)
                    .populate("client").populate({
                        path: "voiture",
                        populate: [
                          { path: "model" },
                          { path: "energie" },
                          { path: "transmission" }
                        ]
                      }) // Informations sur la voiture;
            }

            return {
                _id: planning._id,
                mecanicien: planning.mecanicien,
                type_tache: planning.type_tache,
                date_heure_debut: planning.date_heure_debut,
                date_heure_fin: planning.date_heure_fin,
                statut: planning.statut,
                details: details, // Ajoute les détails du diagnostic ou de la réparation
            };
        });

        // Exécuter toutes les requêtes en parallèle et récupérer les résultats
        const result = await Promise.all(tasks);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



const insertPlanningDiagnostic = async ( mecanicienId, idDiagnostic, dateHeureDebut, dateHeureFin) => {
    try {
        // Vérifier que le diagnostic existe
        const diagnostic = await Diagnostic.findById(idDiagnostic).populate("client voiture");
        if (!diagnostic) {
            return { success: false, message: "Diagnostic non trouvé.", error };
        }

        // Vérifier que le mécanicien existe
        const mecanicien = await User.findById(mecanicienId);
        if (!mecanicien) {
            return { success: false, message: "Mécanicien non trouvé.", error };
        }

        // Vérifier la disponibilité du mécanicien
        const planningConflict = await PlanningMecanicien.findOne({
            mecanicien: mecanicienId,
            statut: "Réservé", // Chercher des plannings réservés
            $or: [
                {
                    date_heure_debut: { $lt: new Date(dateHeureFin) },  // Si l'heure de début du planning est avant l'heure de fin
                    date_heure_fin: { $gt: new Date(dateHeureDebut) }    // Et si l'heure de fin du planning est après l'heure de début
                }
            ]
        });

        if (planningConflict) {
            return { success: false, message: "Le mécanicien est déjà occupé pendant ce créneau.", error };
        }

        // Créer le planning pour le diagnostic
        const newPlanning = new PlanningMecanicien({
            mecanicien: mecanicienId,
            type_tache: "Diagnostic",
            id_tache: diagnostic._id,  // Référence au diagnostic
            date_heure_debut: new Date(dateHeureDebut),
            date_heure_fin: new Date(dateHeureFin),
            statut: "Réservé"
        });

        // Sauvegarder le planning dans la base de données
        await newPlanning.save();
        return { success: true, message: "Planning du diagnostic ajouté avec succès.", newPlanning };
    } catch (error) {
        console.error(error);
    }
};


const insertPlanningReparation = async (mecanicienId, idReparationVoiture, idTypeReparation, dateHeureDebut, dateHeureFin, res) => {
    try {
        // Recherche la réparation associée à l'idReparationVoiture
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return { success: false, message: "Reparation non trouvé.", error };
        }

        // Vérification si le mécanicien est déjà occupé à la même heure
        const existPlanning = await PlanningMecanicien.findOne({
            mecanicien: mecanicienId,
            statut: { $in: ["Réservé", "En cours"] }, // Vérifier si le mécanicien est déjà réservé pendant ces horaires
            $or: [
                { date_heure_debut: { $lt: dateHeureFin }, date_heure_fin: { $gt: dateHeureDebut } },
                { date_heure_debut: { $lt: dateHeureDebut }, date_heure_fin: { $gt: dateHeureDebut } }
            ]
        });

        if (existPlanning) {
            return { success: false, message: "Le mécanicien est déjà réservé pour cette période", error };
        }

        // Créer le planning pour la réparation
        const newPlanning = new PlanningMecanicien({
            mecanicien: mecanicienId,
            type_tache: "Réparation", // Type de tâche est "Réparation"
            id_tache: idTypeReparation, // Utiliser l'idTypeReparation passé en argument
            id_reparation_voiture: idReparationVoiture, // L'ID de la réparation voiture
            date_heure_debut: dateHeureDebut,
            date_heure_fin: dateHeureFin,
            statut: "Réservé" // Statut initial est "Réservé"
        });

        // Sauvegarder le planning dans la base de données
        await newPlanning.save();

        return { success: true, message:"Planning de réparation ajouté avec succès", newPlanning };

        
    } catch (error) {
        console.error(error);
        return { success: false, message:error };
    }
};




const demanderAbsence = async (req, res) => {
    try {
        const { mecanicienId } = req.params; 
        const {  dateHeureDebut, dateHeureFin, raison } = req.body;

        // Vérifier que la date de début est avant la date de fin
        if (new Date(dateHeureDebut) >= new Date(dateHeureFin)) {
            return res.status(400).json({ message: "La date de début doit être avant la date de fin." });
        }

        // Vérifier si le mécanicien a déjà une absence à ces dates
        const absenceExistante = await AbsenceMecanicien.findOne({
            mecanicien: mecanicienId,
            statut: "Approuvé",
            $or: [
                { date_heure_debut: { $lt: dateHeureFin }, date_heure_fin: { $gt: dateHeureDebut } }
            ]
        });

        if (absenceExistante) {
            return res.status(400).json({ message: "Vous avez déjà une absence approuvée à ces dates." });
        }

        // Créer la demande d'absence
        const nouvelleAbsence = new AbsenceMecanicien({
            mecanicien: mecanicienId,
            date_heure_debut: dateHeureDebut,
            date_heure_fin: dateHeureFin,
            raison,
            statut: "En attente"
        });

        // Sauvegarde dans la base de données
        await nouvelleAbsence.save();

        res.status(201).json({ message: "Demande d'absence soumise avec succès.", absence: nouvelleAbsence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};





const estMecanicienDisponible = async (mecanicienId, dateHeureDebut, dateHeureFin) => {
    // Vérifier si le mécanicien est absent durant cette période
    const absence = await AbsenceMecanicien.findOne({
        mecanicien: mecanicienId,
        statut: "Approuvé",
        $or: [
            { date_heure_debut: { $lt: dateHeureFin }, date_heure_fin: { $gt: dateHeureDebut } } // Vérifie chevauchement
        ]
    });

    return !absence; // Si absence trouvée → indisponible (false), sinon disponible (true)
};



const listerAbsences = async (req, res) => {
    try {
        const { statut } = req.query; // Filtre optionnel sur le statut

        let filtre = {};
        if (statut) {
            if (!["En attente", "Approuvé", "Rejeté"].includes(statut)) {
                return res.status(400).json({ message: "Statut invalide." });
            }
            filtre.statut = statut;
        }

        // Récupérer toutes les absences avec les infos du mécanicien
        const absences = await AbsenceMecanicien.find(filtre)
            .populate("mecanicien", "nom prenom email") // Charger les infos du mécanicien
            .sort({ date_heure_debut: -1 }); // Trier par date de début (du plus récent au plus ancien)

        res.status(200).json(absences);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


const gererAbsence = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'absence
        const { action } = req.body; // "approuver" ou "rejeter"

        // Vérifier si l'absence existe
        const absence = await AbsenceMecanicien.findById(id);
        if (!absence) {
            return res.status(404).json({ message: "Absence non trouvée." });
        }

        if (absence.statut !== "En attente") {
            return res.status(400).json({ message: "Cette demande a déjà été traitée." });
        }

        // Vérifier si le mécanicien a un planning en "Réservé" ou "En cours" pendant l'absence
        const conflitPlanning = await PlanningMecanicien.findOne({
            mecanicien: absence.mecanicien,
            statut: { $in: ["Réservé", "En cours"] },
            $or: [
                { date_heure_debut: { $lt: absence.date_heure_fin, $gte: absence.date_heure_debut } }, // Début pendant l'absence
                { date_heure_fin: { $gt: absence.date_heure_debut, $lte: absence.date_heure_fin } }, // Fin pendant l'absence
                { date_heure_debut: { $lte: absence.date_heure_debut }, date_heure_fin: { $gte: absence.date_heure_fin } }, // Englobe l'absence
            ],
        });

        if (action === "approuver") {
            if (conflitPlanning) {
                return res.status(400).json({
                    message: "Impossible d'approuver cette absence, le mécanicien a déjà un planning.",
                });
            }
            absence.statut = "Approuvé";
        } else if (action === "rejeter") {
            absence.statut = "Rejeté";
        } else {
            return res.status(400).json({ message: "Action invalide, utilisez 'approuver' ou 'rejeter'." });
        }

        // Sauvegarder les modifications
        await absence.save();

        res.status(200).json({
            message: `Absence ${action} avec succès.`,
            absence,
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


// Fonction pour récupérer les plannings réservés pour un mécanicien
const obtenirPlanningsReserveesMecanicien = async (mecanicienId, res) => {
    try {
        // Récupérer les plannings avec statut "Réservé" ou "En cours"
        const plannings = await PlanningMecanicien.find({ statut: { $in: ["Réservé", "En cours"] } , type_tache :"Réparation" , mecanicien :mecanicienId})
            .populate("mecanicien", "nom prenom") // Populate le mécanicien
            .sort({ date_heure_debut: 1 }); // Trier par date de début

        // Récupérer tous les diagnostics et réparations en parallèle
        const tasks = plannings.map(async (planning) => {
            let details = null;
            if (planning.type_tache === "Réparation") {
                // Récupérer les informations de `TypeReparation` en fonction de `id_tache`
                if (planning.id_tache) {
                    const reparation = await ReparationVoiture.findById(planning.id_reparation_voiture);
                    details = reparation.details_reparation.find(
                    detail => detail.id_type_reparation.toString() === planning.id_tache.toString()
                    );
                }
            }
            const type_reparation = await TypeReparation.findById(details.id_type_reparation);
            const reparation = await ReparationVoiture.findById(planning.id_reparation_voiture)
                    .populate("client").populate({
                        path: "voiture",
                        populate: [
                          { path: "model" },
                          { path: "energie" },
                          { path: "transmission" }
                        ]
                      })
            return {
                _id: planning._id,
                id_reparation_voiture: planning.id_reparation_voiture,
                mecanicien: planning.mecanicien,
                type_tache: planning.type_tache,
                nom : type_reparation.nom,
                date_heure_debut: planning.date_heure_debut,
                date_heure_fin: planning.date_heure_fin,
                statut: planning.statut,
                voiture : reparation.voiture,
                details: details, // Ajoute les détails du diagnostic ou de la réparation
            };
            
        });

        // Exécuter toutes les requêtes en parallèle et récupérer les résultats
        const result = await Promise.all(tasks);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}


// Fonction pour commencer une réparation en vérifiant si elle est déjà en cours
const commencerReparation = async (mecanicienId, idReparationVoiture, idTypeReparation, res) => {
    try {
        // Vérifier si la réparation existe
        const reparation = await ReparationVoiture.findById(idReparationVoiture);
        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Vérifier si le détail de réparation existe
        const detailReparation = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé pour ce type." });
        }

              // Vérifier si le planning est réservé pour le mécanicien
              const planning = await PlanningMecanicien.findOne({
                mecanicien: mecanicienId,
                id_reparation_voiture: idReparationVoiture,
                id_tache: idTypeReparation,
                statut: "Réservé"
            });
    
            if (!planning) {
                return res.status(404).json({ message: "Aucun planning réservé trouvé pour cette réparation." });
            }
    
            // Mettre à jour le planning et le détail de réparation en "En cours"
            planning.statut = "En cours";
            await planning.save()

        // Vérifier si le détail de réparation est déjà en cours
        if (detailReparation.etat === "En cours") {
            return res.status(400).json({ message: "Le détail de réparation est déjà en cours." });
        }

  
        detailReparation.etat = "En cours";

        // Sauvegarder les modifications
        await reparation.save();

        return res.status(200).json({ message: "Réparation commencée avec succès." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur lors du démarrage de la réparation." });
    }
};



// Fonction pour terminer une réparation, vérifiant que tous les mécaniciens ont terminé leur tâche
const terminerReparation = async (mecanicienId, idReparationVoiture, idTypeReparation, res) => {
    try {
        // Vérifier si le planning est en cours pour le mécanicien
        const planning = await PlanningMecanicien.findOne({
            mecanicien: mecanicienId,
            id_reparation_voiture: idReparationVoiture,
            type_tache: "Réparation",
            statut: "En cours"
        });

        if (!planning) {
            return res.status(404).json({ message: "Aucun planning en cours trouvé pour cette réparation." });
        }

        // Trouver la réparation voiture
        const reparation = await ReparationVoiture.findById(idReparationVoiture);

        if (!reparation) {
            return res.status(404).json({ message: "Réparation non trouvée." });
        }

        // Trouver le détail de réparation correspondant
        const detailReparation = reparation.details_reparation.find(
            (detail) => detail.id_type_reparation.toString() === idTypeReparation
        );

        if (!detailReparation) {
            return res.status(404).json({ message: "Détail de réparation non trouvé pour ce type." });
        }

        // Vérifier si le détail de réparation est déjà terminé
        if (detailReparation.etat === "Terminé") {
            return res.status(400).json({ message: "Le détail de réparation est déjà terminé." });
        }

         // Mettre à jour le planning du mécanicien actuel à "Terminé"
         planning.statut = "Terminé";
         await planning.save();
 
        // Vérifier si tous les mécaniciens assignés au détail ont terminé
        const mecaniciensTermines = await PlanningMecanicien.find({
            id_reparation_voiture: idReparationVoiture,
            type_tache: "Réparation",
            id_tache: idTypeReparation,
            statut: "Terminé"
        });

        // Si le nombre de mécaniciens ayant terminé ne correspond pas à ceux assignés à ce détail de réparation
        if (mecaniciensTermines.length !== detailReparation.mecaniciens.length) {
            return res.status(400).json({
                message: "Tous les mécaniciens n'ont pas encore terminé leur tâche pour ce détail de réparation."
            });
        }

        // Si tous les mécaniciens ont terminé, on met à jour le statut du détail de réparation à "Terminé"
        detailReparation.etat = "Terminé";
        await reparation.save();

       
        return res.status(200).json({ message: "Réparation terminée avec succès." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur lors de la fin de la réparation." });
    }
};


module.exports = { getPlanningsReserves ,
    insertPlanningDiagnostic, 
    insertPlanningReparation ,
    estMecanicienDisponible ,
    demanderAbsence ,
    listerAbsences ,
    gererAbsence ,
    obtenirPlanningsReserveesMecanicien,
    commencerReparation ,
    terminerReparation
};
