const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialisation du SDK officiel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const promptText = req.body.contents || req.body.prompt || req.body.message || "";

        if (!promptText || typeof promptText !== 'string' || promptText.trim() === "") {
            return res.status(400).json({ error: "Le texte du message est vide ou invalide." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(promptText);
        const responseText = result.response.text();

        return res.json({ reply: responseText });

    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({ error: error.message || "Erreur interne" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
