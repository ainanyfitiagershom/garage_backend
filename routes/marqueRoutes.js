const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const Marque = require("../models/Paramettres/Marque");

const router = express.Router();

router.post("/marques", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const marque = new Marque({ name });
    await marque.save();
    res.status(201).json(marque);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création de la marque", error: error.message });
  }
});

router.get("/marques", async (req, res) => {
  try {
    const marques = await Marque.find();
    res.status(200).json(marques);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des marques", error: error.message });
  }
});

router.put("/marques/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const marque = await Marque.findByIdAndUpdate(id, { name }, { new: true });
    if (!marque) return res.status(404).json({ erreur: "Marque non trouvée" });
    res.status(200).json(marque);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour de la marque", error: error.message });
  }
});

router.delete("/marques/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const marque = await Marque.findByIdAndDelete(id);
    if (!marque) return res.status(404).json({ erreur: "Marque non trouvée" });
    res.status(200).json({ message: "Marque supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression de la marque", error: error.message });
  }
});

module.exports = router;