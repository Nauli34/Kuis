import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';
import questions from './questions.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const App = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [playerName, setPlayerName] = useState('');
    const [gameStarted, setGameStarted] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [message, setMessage] = useState('');
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [timer, setTimer] = useState(0);
    const [intervalId, setIntervalId] = useState(null);
    const [lives, setLives] = useState(9);
    const [audioRef, setAudioRef] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        if (gameStarted) {
            // Filter and shuffle questions
            const categories = ['Geografi', 'Matematika', 'Sejarah Dunia', 'Rekayasa Perangkat Lunak', 'Ilmu Pengetahuan Alam',];
            let allQuestions = [];

            categories.forEach(category => {
                const categoryQuestions = questions.filter(q => q.category === category);
                allQuestions = allQuestions.concat(shuffle(categoryQuestions).slice(0, 10));
            });

            setShuffledQuestions(shuffle(allQuestions)); // Shuffle all questions
            setTimer(0);
            const id = setInterval(() => setTimer(prev => prev + 1), 1000);
            setIntervalId(id);

            // Fetch leaderboard data
            const  Leaderboard = async () => {
                try {
                    const response = await fetch('http://localhost:5000/leaderboard');
                    const data = await response.json();
                    setLeaderboard(data);
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                }
            };

            fetchLeaderboard();

            return () => clearInterval(id);
        }
    }, [gameStarted]);

    useEffect(() => {
        if (currentQuestionIndex >= shuffledQuestions.length && intervalId) {
            clearInterval(intervalId);
        }
    }, [currentQuestionIndex, shuffledQuestions.length, intervalId]);

    const handleAnswerChange = (event) => {
        setUserAnswer(event.target.value);
    };

    const handleOptionChange = (event) => {
        setUserAnswer(event.target.value);
    };

    const handleSubmitAnswer = () => {
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        let correct = false;
        if (currentQuestion.type === 'multiple-choice') {
            if (userAnswer === currentQuestion.answer) {
                setScore(prev => prev + 2);
                setMessage('Correct!');
                correct = true;
            }
        } else if (currentQuestion.type === 'essay') {
            if (userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
                setScore(prev => prev + 2);
                setMessage('Correct!');
                correct = true;
            }
        }

        if (!correct) {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setMessage('Game Over! You have run out of lives.');
                    clearInterval(intervalId);

                    // Save data to backend
                    fetch('http://localhost:5000/savePlayerData', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: playerName,
                            score,
                            correctAnswers: shuffledQuestions.length - lives,
                            incorrectAnswers: lives,
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Data saved:', data);
                        // Update leaderboard
                        fetchLeaderboard();
                    })
                    .catch(error => console.error('Error:', error));
                } else {
                    setMessage(`Incorrect! You have ${newLives} lives left.`);
                }
                return newLives;
            });
        }

        setUserAnswer('');
        setTimeout(() => {
            setMessage('');
            setCurrentQuestionIndex(prev => prev + 1);
        }, 1000);
    };

    const handleNameChange = (event) => {
        setPlayerName(event.target.value);
    };

    const handleStartGame = () => {
        if (playerName.trim()) {
            setGameStarted(true);
            if (audioRef) {
                audioRef.audioEl.play();
            }
        } else {
            alert('Please enter your name.');
        }
    };

    const handleRestartGame = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setLives(9);
        setGameStarted(false);
        setPlayerName('');
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setTimer(0);
        if (audioRef) {
            audioRef.audioEl.pause();
            audioRef.audioEl.currentTime = 0;
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('http://localhost:5000/leaderboard');
            const data = await response.json();
            setLeaderboard(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    if (!gameStarted) {
        return (
            <div className="App">
                <div className="name-entry">
                    <h1>Enter Your Name</h1>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={playerName}
                        onChange={handleNameChange}
                    />
                    <button onClick={handleStartGame}>Start Game</button>
                </div>
                <div className="leaderboard">
                    <h2>Leaderboard</h2>
                    <ul>
                        {leaderboard.map((player, index) => (
                            <li key={index}>{player.name}: {player.score}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    if (currentQuestionIndex >= shuffledQuestions.length || lives <= 0) {
        return (
            <div className="App">
                <h1>Game Over</h1>
                <div className="score">Final Score: {score}</div>
                <div className="timer">Time Taken: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
                <button onClick={handleRestartGame}>Play Again</button>
                <div className="leaderboard">
                    <h2>Leaderboard</h2>
                    <ul>
                        {leaderboard.map((player, index) => (
                            <li key={index}>{player.name}: {player.score}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    return (
        <div className="App">
            <div className="header">
                <div className="score">Score: {score}</div>
                <div className="timer">Time: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
                <div className="lives">
                    {Array.from({ length: lives }).map((_, index) => (
                        <FontAwesomeIcon key={index} icon={faHeart} className="heart-icon" />
                    ))}
                </div>
            </div>
            <div className="game-container">
                <h1>Nau Kuis</h1>
                <div className="question-box">
                    <h2>Question {currentQuestionIndex + 1}</h2>
                    <img src={currentQuestion.image} alt="Quiz" className="question-image" />
                    <p>{currentQuestion.question}</p>
                    {currentQuestion.type === 'multiple-choice' ? (
                        <div className="options">
                            {currentQuestion.options.map((option, index) => (
                                <label key={index}>
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option}
                                        checked={userAnswer === option}
                                        onChange={handleOptionChange}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="options">
                            <textarea
                                value={userAnswer}
                                onChange={handleAnswerChange}
                                placeholder="Write your answer here..."
                            />
                        </div>
                    )}
                    <button onClick={handleSubmitAnswer}>Submit</button>
                </div>
                {message && <div className="message">{message}</div>}
            </div>
            <ReactAudioPlayer
                src="/assets/audio/bg.mp3"
                autoPlay
                controls={false}
                ref={(player) => setAudioRef(player)}
            />
        </div>
    );
};
const deleteLeaderboardData = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/leaderboard', {
            method: 'DELETE',
        });
        const result = await response.json();
        console.log(result.message); // Menampilkan pesan sukses atau gagal
    } catch (error) {
        console.error('Error deleting leaderboard data:', error);
    }
};

export default App;
