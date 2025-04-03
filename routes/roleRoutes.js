const express = require("express");
const router = express.Router();
const Role = require("../models/Utilisateur/Role"); 
const User = require("../models/Utilisateur/User");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

router.get("/roles", async (req, res) => {
  try {
    const roles = await Role.find(); 
    res.status(200).json(roles);
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles :", error);
    res.status(500).json({ erreur: "Erreur lors de la récupération des rôles", error: error.message });
  }
});


router.get("/getMecaniciens",verifyToken, async (req, res) => {
  try {
    // Récupérer le rôle "mécanicien"
    const roleMecanicien = await Role.findOne({ name: "Mécanicien" });

    if (!roleMecanicien) {
      console.log("Le rôle 'mécanicien' n'existe pas.");
      return [];
    }

    // Récupérer les utilisateurs ayant ce rôle
    const mecaniciens = await User.find({ role: roleMecanicien._id })
      .populate("role", "name") // Optionnel : pour afficher le nom du rôle
      .select("nom email contact adresse salaire_mensuel specialites");

    //console.log("Liste des mécaniciens :", mecaniciens);
    return res.status(200).json(mecaniciens);
  } catch (error) {
    console.error("Erreur lors de la récupération des mécaniciens :", error);
  }
});


module.exports = router;