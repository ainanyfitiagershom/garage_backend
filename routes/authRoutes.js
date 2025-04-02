const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Utilisateur/User");
const Role = require("../models/Utilisateur/Role");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * Route : /api/auth/register
 * Description : Inscription d'un nouvel utilisateur avec un rôle
 */
router.post("/register",verifyToken , async (req, res) => {
  try {
    const { username, email, password, tel, roleName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = await Role.findOne({ name: roleName });
    if (!role) return res.status(400).json({ erreur: "Rôle invalide" });

    const user = new User({ username, email, tel, password: hashedPassword, role: role._id });
    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("role"); // Remplit le rôle

    if (!user) return res.status(400).json({ erreur: "Utilisateur non trouvé" });

    const validPassword = await bcrypt.compare(password, user.mdp);
    if (!validPassword) return res.status(400).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user._id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
        
    return res.json({ message: "Connexion réussie", token, role: user.role.name, username: user.nom , _id: user._id });

  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
