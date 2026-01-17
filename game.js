// Game state
let gameWords = [];
let currentWordIndex = 0;
let currentWord = '';
let score = 0;
let attemptsLeft = 2;
let isSpellingOut = false; // Flag to prevent interrupting spelling

// DOM elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const endScreen = document.getElementById('endScreen');
const startBtn = document.getElementById('startBtn');
const submitBtn = document.getElementById('submitBtn');
const repeatBtn = document.getElementById('repeatBtn');
const restartBtn = document.getElementById('restartBtn');
const userInput = document.getElementById('userInput');
const messageDiv = document.getElementById('message');
const scoreDisplay = document.getElementById('score');
const currentWordDisplay = document.getElementById('currentWord');
const attemptsDisplay = document.getElementById('attempts');
const finalScoreDisplay = document.getElementById('finalScore');
const finalMessageDisplay = document.getElementById('finalMessage');

// Speech synthesis
const synth = window.speechSynthesis;

// Event listeners
startBtn.addEventListener('click', startGame);
submitBtn.addEventListener('click', checkAnswer);
repeatBtn.addEventListener('click', speakWord);
restartBtn.addEventListener('click', resetGame);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Initialize game
function startGame() {
    // Select 10 random words
    gameWords = getRandomWords(10);
    currentWordIndex = 0;
    score = 0;
    
    // Switch to game screen
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Start first word
    nextWord();
}

// Get random words from dictionary
function getRandomWords(count) {
    const words = Object.keys(WORD_DICTIONARY);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Move to next word
function nextWord() {
    if (currentWordIndex >= gameWords.length) {
        endGame();
        return;
    }

    currentWord = gameWords[currentWordIndex];
    attemptsLeft = 2;
    isSpellingOut = false; // Reset flag

    // Update UI
    currentWordDisplay.textContent = `${currentWordIndex + 1}/10`;
    scoreDisplay.textContent = score;
    attemptsDisplay.textContent = attemptsLeft;
    userInput.value = '';
    messageDiv.textContent = '';
    userInput.focus();

    // Speak the word
    speakWord();
}

// Speak current word using speech synthesis
function speakWord() {
    // Don't interrupt if we're spelling out a word
    if (isSpellingOut) {
        return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(`Spell ${currentWord}`);
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    synth.speak(utterance);
}

// Spell out word letter by letter, then read definition
function spellOutWord(word, definition) {
    // Set flag to prevent interruption
    isSpellingOut = true;

    // Cancel any ongoing speech
    synth.cancel();

    // First say "The correct spelling is"
    const intro = new SpeechSynthesisUtterance('The correct spelling is');
    intro.rate = 0.9;

    // When intro finishes, spell out the letters
    intro.onend = () => {
        spellLetters(word, definition);
    };

    synth.speak(intro);
}

// Helper function to spell out letters one by one
function spellLetters(word, definition) {
    const letters = word.split('');
    let index = 0;

    function speakNextLetter() {
        if (index < letters.length) {
            const letterUtterance = new SpeechSynthesisUtterance(letters[index]);
            letterUtterance.rate = 0.8;
            letterUtterance.pitch = 1.1;

            letterUtterance.onend = () => {
                index++;
                // Small delay between letters
                setTimeout(speakNextLetter, 300);
            };

            synth.speak(letterUtterance);
        } else {
            // All letters spoken, now say the word
            setTimeout(() => {
                const wordUtterance = new SpeechSynthesisUtterance(word);
                wordUtterance.rate = 0.8;

                wordUtterance.onend = () => {
                    // After word, read the definition
                    setTimeout(() => {
                        const defUtterance = new SpeechSynthesisUtterance(definition);
                        defUtterance.rate = 0.9;
                        synth.speak(defUtterance);
                    }, 500);
                };

                synth.speak(wordUtterance);
            }, 500);
        }
    }

    speakNextLetter();
}

// Modify the checkAnswer function to handle apostrophes correctly
function checkAnswer() {
    const userAnswer = userInput.value.trim(); // Removed .toLowerCase() to preserve case

    if (!userAnswer) {
        messageDiv.textContent = 'Please type a word!';
        messageDiv.className = 'incorrect';
        return;
    }

    // Compare userAnswer directly with currentWord
    if (userAnswer === currentWord) {
        // Correct answer
        score++;
        messageDiv.textContent = '✓ Correct!';
        messageDiv.className = 'correct';

        // Speak encouragement
        const utterance = new SpeechSynthesisUtterance('Correct!');
        synth.speak(utterance);

        // Move to next word after delay
        setTimeout(() => {
            currentWordIndex++;
            nextWord();
        }, 1500);
    } else {
        // Wrong answer
        attemptsLeft--;
        attemptsDisplay.textContent = attemptsLeft;

        if (attemptsLeft > 0) {
            messageDiv.textContent = `✗ Incorrect. Try again! (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} left)`;
            messageDiv.className = 'incorrect';
            userInput.value = '';
            userInput.focus();

            // Speak the word again
            setTimeout(() => {
                speakWord();
            }, 1000);
        } else {
            // Show the correct spelling and definition
            const definition = WORD_DICTIONARY[currentWord];
            messageDiv.innerHTML = `✗ The correct spelling was: <strong>${currentWord}</strong><br><em>${definition}</em>`;
            messageDiv.className = 'incorrect';

            // Spell out the word letter by letter, then read the definition
            setTimeout(() => {
                spellOutWord(currentWord, definition);
            }, 500);

            // Move to next word after delay (longer to allow for spelling + definition)
            const estimatedTime = 2000 + (currentWord.length * 1000) + 1000 + 4000 + 2000;
            setTimeout(() => {
                currentWordIndex++;
                nextWord();
            }, estimatedTime);
        }
    }
}

// End game and show results
function endGame() {
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    finalScoreDisplay.textContent = `Score: ${score}/10`;
    
    let message = '';
    if (score === 10) {
        message = '🎉 Perfect! You\'re a spelling champion!';
    } else if (score >= 7) {
        message = '👏 Great job! You\'re an excellent speller!';
    } else if (score >= 5) {
        message = '👍 Good effort! Keep practicing!';
    } else {
        message = '💪 Keep trying! Practice makes perfect!';
    }
    
    finalMessageDisplay.textContent = message;
    
    // Speak final score
    const utterance = new SpeechSynthesisUtterance(`Game over. Your score is ${score} out of 10. ${message}`);
    synth.speak(utterance);
}

// Reset game
function resetGame() {
    endScreen.classList.remove('active');
    startScreen.classList.add('active');
    synth.cancel();
}

