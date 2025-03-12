-- Création de la base de données
drop database if exists garage;
create database garage;
use garage;

-- Table Client
CREATE TABLE Client (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    adresse TEXT,
    type_client VARCHAR(50)
);

-- Table Voiture
CREATE TABLE Voiture (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    annee INT,
    immatriculation VARCHAR(20) UNIQUE,
    kilometrage INT,
    photo TEXT,
    carte_grise_photo TEXT,
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE
);

-- Table Categorie
CREATE TABLE Categorie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT
);

-- Table Employe
CREATE TABLE Employe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    adresse TEXT,
    role VARCHAR(50),
    salaire_mensuel DECIMAL(10,2),
    specialites TEXT -- Stocker les ID sous forme de JSON ("[1,2,3]")
);

-- Table Type_reparation
CREATE TABLE Type_reparation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categories TEXT, -- Stocker les ID des catégories en JSON
    temps_estime INT, -- en minutes
    prix_base DECIMAL(10,2)
);

-- Table Rendez_vous
CREATE TABLE Rendez_vous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    voiture INT,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    commentaire TEXT,
    status ENUM('En attente', 'Confirmé', 'Annulé') DEFAULT 'En attente',
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE,
    FOREIGN KEY (voiture) REFERENCES Voiture(id) ON DELETE CASCADE
);

-- Table Diagnostic
CREATE TABLE Diagnostic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    voiture INT,
    mecanicien INT,
    date_diag DATETIME DEFAULT CURRENT_TIMESTAMP,
    etat ENUM('En cours', 'Terminé') DEFAULT 'En cours',
    observation TEXT,
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE,
    FOREIGN KEY (voiture) REFERENCES Voiture(id) ON DELETE CASCADE,
    FOREIGN KEY (mecanicien) REFERENCES Employe(id) ON DELETE SET NULL
);

-- Table Reparations_voiture
CREATE TABLE Reparations_voiture (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    voiture INT,
    date_depot DATE,
    date_debut DATE,
    date_fin DATE,
    date_recup DATE,
    etat ENUM('En attente', 'En cours', 'Terminé') DEFAULT 'En attente',
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE,
    FOREIGN KEY (voiture) REFERENCES Voiture(id) ON DELETE CASCADE
);

-- Table Niveau
CREATE TABLE Niveau (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50),
    pourcentage DECIMAL(5,2)
);

-- Table Detail_Reparation
CREATE TABLE Detail_Reparation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reparation_voiture INT,
    id_type_reparation INT,
    mecaniciens TEXT,
    difficulte INT,
    etat ENUM('En attente', 'En cours', 'Terminé') DEFAULT 'En attente',
    FOREIGN KEY (id_reparation_voiture) REFERENCES Reparations_voiture(id) ON DELETE CASCADE,
    FOREIGN KEY (id_type_reparation) REFERENCES Type_reparation(id) ON DELETE CASCADE,
    FOREIGN KEY (difficulte) REFERENCES Niveau(id) ON DELETE SET NULL
);

-- Table Pieces
CREATE TABLE Pieces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    quantite INT DEFAULT 0,
    prix_unitaire DECIMAL(10,2)
);

-- Table Liste_pieces
CREATE TABLE Liste_pieces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reparation_voiture INT,
    id_piece INT,
    nom VARCHAR(100),
    nombre INT,
    etat ENUM('Disponible', 'Non disponible') DEFAULT 'Non disponible',
    FOREIGN KEY (id_reparation_voiture) REFERENCES Reparations_voiture(id) ON DELETE CASCADE,
    FOREIGN KEY (id_piece) REFERENCES Pieces(id) ON DELETE SET NULL
);

-- Table Factures
CREATE TABLE Factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    id_reparation_voiture INT,
    date_facture DATE DEFAULT CURRENT_DATE,
    montant_total DECIMAL(10,2),
    date_paiement DATE,
    mode_paiement VARCHAR(50),
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE,
    FOREIGN KEY (id_reparation_voiture) REFERENCES Reparations_voiture(id) ON DELETE CASCADE
);

-- Table Detail_factures
CREATE TABLE Detail_factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT,
    libelle VARCHAR(255),
    quantite INT,
    prix DECIMAL(10,2),
    prix_total DECIMAL(10,2),
    FOREIGN KEY (id_facture) REFERENCES Factures(id) ON DELETE CASCADE
);

-- Table Paiement
CREATE TABLE Paiement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_facture INT,
    montant_paye DECIMAL(10,2),
    date_paiement DATE DEFAULT CURRENT_DATE,
    mode_paiement VARCHAR(50),
    FOREIGN KEY (id_facture) REFERENCES Factures(id) ON DELETE CASCADE
);

-- Table Avis
CREATE TABLE Avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client INT,
    nombres_etoiles INT CHECK (nombres_etoiles BETWEEN 1 AND 5),
    date_avis DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (client) REFERENCES Client(id) ON DELETE CASCADE
);