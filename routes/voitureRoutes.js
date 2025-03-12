const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "✅ Profil accessible", user: req.user });
});

router.get("/admin", verifyToken, verifyRole("Manager", "Mécanicien"), (req, res) => {
  res.json({ message: "✅ Accès autorisé pour les Managers et Mécaniciens" });
});

module.exports = router;
