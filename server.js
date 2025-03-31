const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const deleteOldInscriptions = require("./utils/cleanup");
const authRoutes = require("./routes/authRoutes");
const inscriptionRoutes = require("./routes/inscriptionRoutes");
const pwdOublierRoutes = require("./routes/pwdOublierRoutes");
const voitureRoutes = require("./routes/voitureRoutes");
const roleRoutes = require("./routes/roleRoutes");
const clientRoutes = require('./routes/clientRoutes');
const NiveauRoutes = require('./routes/niveauRoutes');
const CategorieRoutes = require('./routes/categorieRoutes');
const RendezVousRoutes = require("./routes/rendezVousRoutes");
const DiagnosticRoutes = require("./routes/diagnosticRoutes");
const ReparationVoitureRoutes = require("./routes/reparationVoitureRoutes");
const PlanningRoutes = require("./routes/planningRoutes");
const FactureRoutes = require("./routes/factureRoutes");
const PaiementRoutes = require("./routes/paiementRoutes");


const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/inscription", inscriptionRoutes);
app.use("/api/pwdOublier", pwdOublierRoutes);
app.use("/api/voiture", voitureRoutes);
app.use("/api/role", roleRoutes);
app.use('/api/client', clientRoutes);

app.use('/api/niveau', NiveauRoutes);
app.use('/api/categorie', CategorieRoutes);
app.use('/api/rdv', RendezVousRoutes);
app.use('/api/diag', DiagnosticRoutes);
app.use('/api/reparation', ReparationVoitureRoutes);
app.use('/api/planning', PlanningRoutes);
app.use('/api/facture', FactureRoutes);
app.use('/api/paiement', PaiementRoutes);

setInterval(deleteOldInscriptions, 60 * 1000);


app.get("/api/message", (req, res) => {
    res.json({ message: "Connexion réussie entre Angular et Express.js 🎉" });
  });

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(` Serveur démarré sur le port ${PORT}`));
