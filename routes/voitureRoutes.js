const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();
const Voiture = require("../models/Reparation/Voiture");
const Client = require("../models/Utilisateur/Client");
const Model = require("../models/Paramettres/Model");
const Energie = require("../models/Paramettres/Energie");
const Transmission = require("../models/Paramettres/Transmission");

router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: " Profil accessible", user: req.user });
});

router.get("/admin", verifyToken, verifyRole("Manager", "Mécanicien"), (req, res) => {
  res.json({ message: " Accès autorisé pour les Managers et Mécaniciens" });
});




router.post("/:clientId", verifyToken , async (req, res) => {
  try {
      const clientId = req.params.clientId; // Extraire l'ID du client depuis l'URL
      const { matricule, annees, model, energie, transmission, kilometrage, photo } = req.body;

      // Vérifier si le client existe
      const clientExiste = await Client.findById(clientId); // Utiliser clientId pour rechercher le client
      if (!clientExiste) {
          return res.status(404).json({ message: "Client introuvable." });
      }

      // Vérifier si le modèle, énergie, moteur et transmission existent
      const modelExiste = await Model.findById(model);
      const energieExiste = await Energie.findById(energie);
      const transmissionExiste = await Transmission.findById(transmission);

      if (!modelExiste || !energieExiste || !transmissionExiste) {
          return res.status(404).json({ message: "Informations sur la voiture invalides." });
      }

      // Vérifier si la voiture existe déjà
      const voitureExiste = await Voiture.findOne({ matricule });
      if (voitureExiste) {
          return res.status(400).json({ message: "Une voiture avec ce matricule existe déjà." });
      }

      // Créer une nouvelle voiture
      const voiture = new Voiture({
          client: clientId, // Référencer l'ID du client
          matricule,
          annees,
          model,
          energie,
          transmission,
          kilometrage,
          photo
      });

      await voiture.save();
      res.status(201).json({ message: "Voiture ajoutée avec succès.", voiture });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


// Obtenir toutes les voitures
router.get("/", verifyToken , async (req, res) => {
    try {
        const voitures = await Voiture.find().populate("client model energie transmission");
        res.json(voitures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir une voiture par ID
router.get("/:id", verifyToken , async (req, res) => {
    try {
        const voiture = await Voiture.findById(req.params.id).populate("client model energie moteur transmission");
        if (!voiture) {
            return res.status(404).json({ message: "Voiture introuvable." });
        }
        res.json(voiture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Modifier une voiture
router.put("/:id", verifyToken , async (req, res) => {
    try {
        const { matricule, annees, model, energie, transmission, kilometrage, photo } = req.body;
        const voiture = await Voiture.findById(req.params.id);

        if (!voiture) {
            return res.status(404).json({ message: "Voiture introuvable." });
        }

        // Mise à jour des informations de la voiture
        if (matricule) voiture.matricule = matricule;
        if (annees) voiture.annees = annees;
        if (model) voiture.model = model;
        if (energie) voiture.energie = energie;
        if (transmission) voiture.transmission = transmission;
        if (kilometrage) voiture.kilometrage = kilometrage;
        if (photo) voiture.photo = photo;

        await voiture.save();
        res.json({ message: "Voiture mise à jour.", voiture });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer une voiture
router.delete("/:id", verifyToken , async (req, res) => {
    try {
        const voiture = await Voiture.findByIdAndDelete(req.params.id);
        if (!voiture) {
            return res.status(404).json({ message: "Voiture introuvable." });
        }
        res.json({ message: "Voiture supprimée." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Récupérer toutes les voitures d'un client
router.get("/client/:clientId", verifyToken , async (req, res) => {
  try {
      const clientId = req.params.clientId;

      // Vérifier si le client existe
      const clientExiste = await Client.findById(clientId);
      if (!clientExiste) {
          return res.status(404).json({ message: "Client introuvable." });
      }

      // Récupérer toutes les voitures du client
      const voitures = await Voiture.find({ client: clientId }).populate('model energie transmission');

      if (voitures.length === 0) {
          return res.status(404).json({ message: "Aucune voiture trouvée pour ce client." });
      }

      res.status(200).json({ message: "Voitures trouvées.", voitures });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;




