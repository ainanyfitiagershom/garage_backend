const Inscription = require("../models/Utilisateur/Inscription");
const PwdOublier = require("../models/Utilisateur/PwdOublier");

const deleteOldInscriptions = async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); 

  try {
    await Inscription.deleteMany({ dates: { $lt: fiveMinutesAgo } });
    await PwdOublier.deleteMany({ dates: { $lt: fiveMinutesAgo } });
  } catch (error) {
    console.error("Erreur lors de la suppression des inscriptions :", error);
  }
};

module.exports = deleteOldInscriptions;