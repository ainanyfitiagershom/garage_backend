const express = require('express');
const router = express.Router();
const Client = require('../models/Utilisateur/Client');
const bcrypt = require('bcrypt');

// Créer un client
router.post('/', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.mdp, 10);
        const client = new Client({ ...req.body, mdp: hashedPassword });
        await client.save();
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Lire tous les clients
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lire un client par ID
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Client non trouvé" });
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour un client
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: "Client supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
