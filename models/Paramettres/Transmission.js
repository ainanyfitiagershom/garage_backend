const mongoose = require("mongoose");

const TransmissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
});

module.exports = mongoose.model("Transmission", TransmissionSchema);