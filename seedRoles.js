const mongoose = require("mongoose");
const Role = require("./models/Role");
require("dotenv").config();
const connectDB = require("./config/db");

connectDB();

const seedRoles = async () => {
  try {
    await Role.insertMany([{ name: "Client" }, { name: "Mécanicien" }, { name: "Manager" } ] );
    console.log("✅ Rôles ajoutés !");
    process.exit();
  } catch (err) {
    console.error("❌ Erreur d'ajout des rôles", err);
    process.exit(1);
  }
};

seedRoles();
