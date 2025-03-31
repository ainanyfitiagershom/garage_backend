const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const Energie = require("../models/Paramettres/Energie");

const router = express.Router();

router.post("/energies", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { name } = req.body;
    const energie = new Energie({ name });
    await energie.save();
    res.status(201).json(energie);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création de l'énergie", error: error.message });
  }
});

router.get("/energies", async (req, res) => {
  try {
    const energies = await Energie.find();
    res.status(200).json(energies);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des énergies", error: error.message });
  }
});

router.put("/energies/:id", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const energie = await Energie.findByIdAndUpdate(id, { name }, { new: true });
    if (!energie) return res.status(404).json({ erreur: "Énergie non trouvée" });
    res.status(200).json(energie);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour de l'énergie", error: error.message });
  }
});

router.delete("/energies/:id", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const energie = await Energie.findByIdAndDelete(id);
    if (!energie) return res.status(404).json({ erreur: "Énergie non trouvée" });
    res.status(200).json({ message: "Énergie supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression de l'énergie", error: error.message });
  }
});

module.exports = router;