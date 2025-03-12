const express = require("express");
const router = express.Router();
const Role = require("../models/Role"); 

router.get("/roles", async (req, res) => {
  try {
    const roles = await Role.find(); 
    res.status(200).json(roles);
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles :", error);
    res.status(500).json({ erreur: "Erreur lors de la récupération des rôles", error: error.message });
  }
});

module.exports = router;