const express = require('express');
const router = express.Router();
const Client = require('../models/Utilisateur/Client');
const bcrypt = require('bcrypt');
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");


router.post('/Client', async (req, res) => {
    try {
      const { nom, email,mdp, contact, adresse } = req.body;
  
      // Créer un nouveau client
      const newClient = new Client({
        nom,
        email,
        mdp,
        contact,
        adresse
      });
  
      await newClient.save(); // Sauvegarder le client dans la base de données
  
    res.status(201).json({ message: 'Client créé avec succès', client: newClient });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

// Lire un client par ID
router.get('/:id',verifyToken, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Client non trouvé" });
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route pour lister tous les clients
router.get('/',verifyToken, async (req, res) => {
    try {
        const clients = await Client.find(); // Récupère tous les clients depuis la base de données
        res.status(200).json(clients); // Renvoie les clients au format JSON
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des clients", error: error.message });
    }
});

// Mettre à jour un client
router.put('/:id',verifyToken, async (req, res) => {
    try {
        if (req.body.mdp) {
            req.body.mdp = await bcrypt.hash(req.body.mdp, 10);
        }
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer un client
router.delete('/:id',verifyToken, async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: "Client supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
