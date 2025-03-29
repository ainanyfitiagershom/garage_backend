const express = require("express");
const { verifyToken, verifyRole } = require("../../middlewares/authMiddleware");
const Moteur = require("../../models/CRUD/Moteur");

const router = express.Router();

router.post("/moteurs", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { name } = req.body;
    const moteur = new Moteur({ name });
    await moteur.save();
    res.status(201).json(moteur);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création du moteur", error: error.message });
  }
});

router.get("/moteurs", async (req, res) => {
  try {
    const moteurs = await Moteur.find();
    res.status(200).json(moteurs);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des moteurs", error: error.message });
  }
});

router.put("/moteurs/:id", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const moteur = await Moteur.findByIdAndUpdate(id, { name }, { new: true });
    if (!moteur) return res.status(404).json({ erreur: "Moteur non trouvé" });
    res.status(200).json(moteur);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour du moteur", error: error.message });
  }
});

router.delete("/moteurs/:id", verifyToken, verifyRole("Manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const moteur = await Moteur.findByIdAndDelete(id);
    if (!moteur) return res.status(404).json({ erreur: "Moteur non trouvé" });
    res.status(200).json({ message: "Moteur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression du moteur", error: error.message });
  }
});

module.exports = router;