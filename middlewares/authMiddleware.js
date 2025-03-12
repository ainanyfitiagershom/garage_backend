const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ message: "⚠️ Accès refusé : Aucun token fourni" });
    }

    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded; 

    next(); 
  } catch (error) {
    return res.status(403).json({ message: "⛔ Token invalide ou expiré" });
  }
};

/**
 * Middleware pour vérifier le rôle d'un utilisateur
 * @param {...string} roles - Liste des rôles autorisés
 */
const verifyRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate("role");

      if (!user) {
        return res.status(404).json({ message: "❌ Utilisateur non trouvé" });
      }

      if (!roles.includes(user.role.name)) {
        return res.status(403).json({ message: "🚫 Accès interdit : Rôle non autorisé" });
      }

      next(); 
    } catch (error) {
      return res.status(500).json({ message: "⚠️ Erreur serveur", error });
    }
  };
};

module.exports = { verifyToken, verifyRole };
