const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Récupération des clés sous forme de tableau
const apiKeys = (process.env.GEMINI_API_KEYS || "TA_CLE_PAR_DEFAUT")
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

let currentKeyIndex = 0;

// Fonction pour obtenir le modèle Gemini avec la clé courante
function getNextGenerativeModel() {
    const key = apiKeys[currentKeyIndex];
    // Passage à la clé suivante pour la prochaine requête (Round-Robin)
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

app.post('/chat', async (req, res) => {
    try {
        const { contents } = req.body;

        if (!contents) {
            return res.status(400).json({ error: "Le texte du message est requis." });
        }

        let attempts = 0;
        let success = false;
        let reply = "";
        let lastError = null;

        // Tente d'envoyer la requête jusqu'à autant de fois qu'il y a de clés disponibles
        while (attempts < apiKeys.length && !success) {
            try {
                const model = getNextGenerativeModel();
                const result = await model.generateContent(contents);
                const response = await result.response;
                reply = response.text();
                success = true;
            } catch (err) {
                console.warn(`Échec avec la clé index ${currentKeyIndex}. Essai de la clé suivante...`, err.message);
                lastError = err;
                attempts++;
            }
        }

        if (success) {
            return res.json({ reply });
        } else {
            console.error("Toutes les clés API ont échoué:", lastError);
            return res.status(500).json({ 
                error: "Toutes les clés API ont atteint leurs limites ou sont invalides." 
            });
        }

    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({ error: error.message || "Erreur interne du serveur." });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur prêt sur le port ${PORT} avec ${apiKeys.length} clés API configurées.`);
});
