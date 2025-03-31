const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const Transmission = require("../models/Paramettres/Transmission");

const router = express.Router();

router.post("/transmissions", verifyToken , async (req, res) => {
  try {
    const { name } = req.body;
    const transmission = new Transmission({ name });
    await transmission.save();
    res.status(201).json(transmission);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création de la transmission", error: error.message });
  }
});

router.get("/transmissions", verifyToken , async (req, res) => {
  try {
    const transmissions = await Transmission.find();
    res.status(200).json(transmissions);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des transmissions", error: error.message });
  }
});

router.put("/transmissions/:id", verifyToken , async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const transmission = await Transmission.findByIdAndUpdate(id, { name }, { new: true });
    if (!transmission) return res.status(404).json({ erreur: "Transmission non trouvée" });
    res.status(200).json(transmission);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour de la transmission", error: error.message });
  }
});

router.delete("/transmissions/:id", verifyToken , async (req, res) => {
  try {
    const { id } = req.params;
    const transmission = await Transmission.findByIdAndDelete(id);
    if (!transmission) return res.status(404).json({ erreur: "Transmission non trouvée" });
    res.status(200).json({ message: "Transmission supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression de la transmission", error: error.message });
  }
});

module.exports = router;