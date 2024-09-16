const express = require('express');
const Player = require('../models/player');
const router = express.Router();

// Route untuk menyimpan data pemain
router.post('/savePlayerData', async (req, res) => {
    try {
        const { name, score, correctAnswers, incorrectAnswers } = req.body;
        const player = new Player({
            name,
            score,
            correctAnswers,
            incorrectAnswers
        });
        await player.save();
        res.status(201).json({ message: 'Player data saved successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving player data', error });
    }
});

// Route untuk mengambil data leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const players = await Player.find().sort({ score: -1 }).limit(10); // Sort by score, top 10
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard', error });
    }
});

module.exports = router;
