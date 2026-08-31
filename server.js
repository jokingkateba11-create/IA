const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialisation du SDK avec la clé d'API issue de l'environnement Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        // Extraction du texte peu importe le nom de la propriété reçue
        const promptText = req.body.contents || req.body.prompt || req.body.message || "";

        if (!promptText || typeof promptText !== 'string' || promptText.trim() === "") {
            return res.status(400).json({ error: "Le texte du message est requis." });
        }

        // Appel standard à l'API Gemini avec le format d'objet ou de chaîne valide
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText
        });

        return res.json({ reply: response.text });
    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({ error: error.message || "Erreur interne du serveur." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
