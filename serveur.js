const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Tes 10 clés API chargées depuis le fichier .env
const API_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6,
    process.env.GEMINI_KEY_7,
    process.env.GEMINI_KEY_8,
    process.env.GEMINI_KEY_9,
    process.env.GEMINI_KEY_10
].filter(Boolean);

let currentKeyIndex = 0;

async function appelerGeminiAvecRotation(chatHistory, tentatives = 0) {
    if (tentatives >= API_KEYS.length) {
        throw new Error("Toutes les clés API ont atteint leur quota.");
    }

    const apiKey = API_KEYS[currentKeyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: chatHistory })
    });

    if (response.status === 429 || response.status === 403) {
        console.warn(`Clé API index ${currentKeyIndex} saturée. Basculement...`);
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        return await appelerGeminiAvecRotation(chatHistory, tentatives + 1);
    }

    return await response.json();
}

app.post('/api/chat', async (req, res) => {
    try {
        const { chatHistory } = req.body;
        const data = await appelerGeminiAvecRotation(chatHistory);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: { message: err.message } });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur KING IA lancé sur le port ${PORT}`));
