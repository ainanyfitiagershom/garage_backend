const express = require("express");
const bcrypt = require("bcryptjs");
const User= require("../models/Utilisateur/User");
const sendMail= require("../utils/mail");
const mongoose = require("mongoose");
const PwdOublier = require("../models/Utilisateur/PwdOublier");

const router = express.Router();

router.post("/demande", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { email } = req.body;
    
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const pwdOublier = new PwdOublier({ User: existingUser._id, securityCode });
        if (!pwdOublier) {
            try{
                await pwdOublier.save();
                await sendMail(email, "Code de Validation de Mot de passe Oublier", `Votre code de validation est : ${securityCode}`);
                await session.commitTransaction();
                res.status(201).json({ message: "Demande envoyée !" });
              }
            catch(err){
              await session.abortTransaction();
              return res.status(400).json({ error: err.message });
            }
        }
        else{
            return res.status(400).json({ erreur: "Email a déjà fait une demande il y a 5mn" });
        }
    }else{
        res.status(400).json({ erreur: "Email invalide" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/validateCodePwd", async (req, res) => {
    try {
      const { email, securityCode, newPassword } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(400).json({ erreur: "Email invalide" });
      }
  
      const pwdOublier = await PwdOublier.findOne({ User: existingUser._id, securityCode });
      if (!pwdOublier) {
        return res.status(400).json({ erreur: "Code de validation invalide" });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      existingUser.password = hashedPassword;
  
      await existingUser.save(); 
      await PwdOublier.deleteOne({ _id: pwdOublier._id }); 
  
      res.status(201).json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
      console.error("Erreur lors de la validation :", error);
      res.status(500).json({ erreur: "Erreur lors de la validation", error: error.message });
    }
  });

module.exports = router;
