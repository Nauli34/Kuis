const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors({
    origin: 'https://kuis-gilt.vercel.app', // Hanya izinkan domain ini
}));

let leaderboard = [];

// Route untuk root ("/")
app.get('/', (req, res) => {
    res.send('Server is running. Welcome to the Quiz Game API.');
});

// Endpoint untuk menyimpan data pemain
app.post('/savePlayerData', (req, res) => {
    const { name, score, correctAnswers, incorrectAnswers } = req.body;
    
    leaderboard.push({ name, score, correctAnswers, incorrectAnswers });
    
    // Sort leaderboard berdasarkan score secara descending
    leaderboard.sort((a, b) => b.score - a.score);
    
    res.status(200).json({ message: 'Player data saved successfully!' });
});

// Endpoint untuk mengambil data leaderboard
app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
