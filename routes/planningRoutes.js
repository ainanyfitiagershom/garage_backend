const express = require("express");
const router = express.Router();
const PlanningMecanicien = require("../models/PlanningMecanicien");
const User = require("../models/User");

router.post("/", async (req, res) => {
    try {
        const { mecanicien, type_tache, id_tache, date, heure_debut, heure_fin } = req.body;

        // Vérifier si le mécanicien existe
        const mecanicienExiste = await User.findById(mecanicien);
        if (!mecanicienExiste || mecanicienExiste.role !== "Mécanicien") {
            return res.status(404).json({ message: "Mécanicien introuvable" });
        }

        // Vérifier si le mécanicien est déjà occupé à cette heure
        const conflit = await PlanningMecanicien.findOne({
            mecanicien,
            date,
            $or: [
                { heure_debut: { $lt: heure_fin }, heure_fin: { $gt: heure_debut } }
            ]
        });

        if (conflit) {
            return res.status(400).json({ message: "Le mécanicien est déjà occupé sur cette plage horaire." });
        }

        // Créer un nouveau planning
        const planning = new PlanningMecanicien({ mecanicien, type_tache, id_tache, date, heure_debut, heure_fin });
        await planning.save();

        res.status(201).json({ message: "Créneau réservé avec succès", planning });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.put("/:id", async (req, res) => {
    try {
        const { heure_debut, heure_fin, statut } = req.body;
        const planning = await PlanningMecanicien.findById(req.params.id);

        if (!planning) {
            return res.status(404).json({ message: "Créneau introuvable" });
        }

        if (heure_debut) planning.heure_debut = heure_debut;
        if (heure_fin) planning.heure_fin = heure_fin;
        if (statut) planning.statut = statut;

        await planning.save();
        res.json({ message: "Planning mis à jour", planning });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.get("/:mecanicienId", async (req, res) => {
    try {
        const planning = await PlanningMecanicien.find({ mecanicien: req.params.mecanicienId }).sort({ date: 1 });
        res.json(planning);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        await PlanningMecanicien.findByIdAndDelete(req.params.id);
        res.json({ message: "Créneau supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
