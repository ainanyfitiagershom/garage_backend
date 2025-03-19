const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "✅ Profil accessible", user: req.user });
});

router.get("/admin", verifyToken, verifyRole("Manager", "Mécanicien"), (req, res) => {
  res.json({ message: "✅ Accès autorisé pour les Managers et Mécaniciens" });
});


// Ajouter une voiture
router.post('/', async (req, res) => {
  try {
      const client = await Client.findById(req.body.client);
      if (!client) return res.status(404).json({ message: "Client non trouvé" });

      const voiture = new Voiture(req.body);
      await voiture.save();
      res.status(201).json(voiture);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

// Lire toutes les voitures
router.get('/', async (req, res) => {
  try {
      const voitures = await Voiture.find().populate('client', 'nom email');
      res.json(voitures);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Lire une voiture par ID
router.get('/:id', async (req, res) => {
  try {
      const voiture = await Voiture.findById(req.params.id).populate('client', 'nom email');
      if (!voiture) return res.status(404).json({ message: "Voiture non trouvée" });
      res.json(voiture);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une voiture
router.put('/:id', async (req, res) => {
  try {
      if (req.body.client) {
          const client = await Client.findById(req.body.client);
          if (!client) return res.status(404).json({ message: "Client non trouvé" });
      }

      const voiture = await Voiture.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(voiture);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

// Supprimer une voiture
router.delete('/:id', async (req, res) => {
  try {
      await Voiture.findByIdAndDelete(req.params.id);
      res.json({ message: "Voiture supprimée" });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});



module.exports = router;



