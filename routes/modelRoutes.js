const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const Model = require("../models/Paramettres/Model");

const router = express.Router();

router.post("/models", verifyToken, async (req, res) => {
  try {
    const { name, marque, typeVehicule } = req.body;
    const model = new Model({ name, marque, typeVehicule });
    await model.save();
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création du modèle", error: error.message });
  }
});

router.get("/models", verifyToken, async (req, res) => {
  try {
    const models = await Model.find().populate("marque typeVehicule");
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des modèles", error: error.message });
  }
});

router.put("/models/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, marque, typeVehicule } = req.body;
    const model = await Model.findByIdAndUpdate(id, { name, marque, typeVehicule }, { new: true });
    if (!model) return res.status(404).json({ erreur: "Modèle non trouvé" });
    res.status(200).json(model);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour du modèle", error: error.message });
  }
});

router.delete("/models/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const model = await Model.findByIdAndDelete(id);
    if (!model) return res.status(404).json({ erreur: "Modèle non trouvé" });
    res.status(200).json({ message: "Modèle supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression du modèle", error: error.message });
  }
});

module.exports = router;