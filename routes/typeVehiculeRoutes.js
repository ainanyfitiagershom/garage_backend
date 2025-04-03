const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const TypeVehicule = require("../models/Paramettres/TypeVehicule");

const router = express.Router();

router.post("/typevehicules", verifyToken , async (req, res) => {
  try {
    const { name } = req.body;
    const typeVehicule = new TypeVehicule({ name });
    await typeVehicule.save();
    res.status(201).json(typeVehicule);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la création du type de véhicule", error: error.message });
  }
});

router.get("/typevehicules", verifyToken, async (req, res) => {
  try {
    const typeVehicules = await TypeVehicule.find();
    res.status(200).json(typeVehicules);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la récupération des types de véhicules", error: error.message });
  }
});

router.put("/typevehicules/:id", verifyToken , async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const typeVehicule = await TypeVehicule.findByIdAndUpdate(id, { name }, { new: true });
    if (!typeVehicule) return res.status(404).json({ erreur: "Type de véhicule non trouvé" });
    res.status(200).json(typeVehicule);
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la mise à jour du type de véhicule", error: error.message });
  }
});

router.delete("/typevehicules/:id", verifyToken , async (req, res) => {
  try {
    const { id } = req.params;
    const typeVehicule = await TypeVehicule.findByIdAndDelete(id);
    if (!typeVehicule) return res.status(404).json({ erreur: "Type de véhicule non trouvé" });
    res.status(200).json({ message: "Type de véhicule supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la suppression du type de véhicule", error: error.message });
  }
});

module.exports = router;