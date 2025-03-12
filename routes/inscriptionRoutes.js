const express = require("express");
const bcrypt = require("bcryptjs");
const Inscription = require("../models/Inscription");
const User= require("../models/User");
const Role = require("../models/Role")
const sendMail= require("../utils/mail");
const mongoose = require("mongoose");

const router = express.Router();

router.post("/formulaire", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { username, email, password, tel } = req.body;

    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ $or: [{ email }, { tel }] });
    if (existingUser) {
      return res.status(400).json({ erreur: "Email ou numéro de téléphone déjà utilisé" });
    }
    const inscription = new Inscription({ username, email, tel, password: hashedPassword, securityCode });
    try{
        await inscription.save();
        await sendMail(email, "Code de Validation de votre compte", `Votre code de validation est : ${securityCode}`);
        await session.commitTransaction();
        res.status(201).json({ message: "Inscription réussie !" });
      }
    catch(err){
      await session.abortTransaction();
      return res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/validateCode", async (req, res) => {
  const session = await mongoose.startSession(); 
  session.startTransaction();
  try {
    const { email, securityCode } = req.body;
    const inscription = await Inscription.findOne({ email, securityCode });
    
    if (!inscription) {
      return res.status(400).json({ erreur: "Code incorrect ou email invalide" });
    }
    const role = await Role.findOne({ name: "Client" });
    if (!role) {
      return res.status(400).json({ erreur: "Rôle 'Client' introuvable" });
    }

    const newUser = new User({
      email: inscription.email,
      username: inscription.username,
      password: inscription.password,
      tel: inscription.tel,
      role: role.id,
    });
    try{
      await newUser.save();
      await Inscription.deleteOne({ email });
      await session.commitTransaction();
      res.json({ message: "Inscription validée, compte créé avec succès !" });
    }
    catch(err){
      await session.abortTransaction();
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
    res.status(500).json({ erreur: "Erreur lors de la validation", error });
  }
});

module.exports = router;
