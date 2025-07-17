document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const MAX_SIGN_QUESTIONS = 10;
    const MAX_SAFETY_QUESTIONS = 30;
    const SAFETY_PASS_PERCENTAGE = 0.80;

    // --- DOM Elements ---
    const homeScreenArea = document.getElementById('home-screen-area');
    const quizArea = document.getElementById('quiz-area');
    const resultsArea = document.getElementById('results-area');
    const messageArea = document.getElementById('message-area');
    
    const startPracticeAllBtn = document.getElementById('start-practice-all-btn');
    const startOfficialTestBtn = document.getElementById('start-official-test-btn');
    const quizBackToHomeBtn = document.getElementById('quiz-back-to-home-btn'); 
    
    const questionImageContainer = document.getElementById('question-image-container');
    const questionTextContainer = document.getElementById('question-text-container');
    const answersContainer = document.getElementById('answers-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreDisplay = document.getElementById('score');
    const totalQuestionsDisplay = document.getElementById('total-questions-display');
    const questionCounterDisplay = document.getElementById('question-counter');
    const progressBar = document.getElementById('progress-bar');
    const currentPartInfoDisplay = document.getElementById('current-part-info');
    
    const resultsTitle = document.getElementById('results-title');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalPercentageDisplay = document.getElementById('final-percentage');
    const officialTestPassFailMessage = document.getElementById('official-test-pass-fail-message');
    const restartBtn = document.getElementById('restart-btn');
    const homeBtnResults = document.getElementById('home-btn-results');

    // --- Quiz State ---
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedAnswerValue = null;
    
    let allQuestionsMaster = [];
    let signQuestions = [];
    let safetyQuestions = [];
    let currentActiveQuestions = []; 

    let currentTestMode = null; 
    let officialTestPart1Score = 0;

    // --- Functions ---

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array; 
    }

    async function fetchQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const questions = await response.json();
            return questions;
        } catch (error) {
            console.error("Could not fetch questions:", error);
            showMessage("Failed to load questions. Please check the console.", "error");
            return [];
        }
    }
    
    function categorizeQuestions(questions) {
        allQuestionsMaster = questions;
        signQuestions = allQuestionsMaster.filter(q => q.description && q.description.toLowerCase() === 'signs');
        safetyQuestions = allQuestionsMaster.filter(q => q.description && q.description.toLowerCase() === 'safety');
    }
    
    function showMessage(text, type = 'info') { 
        messageArea.textContent = text;
        messageArea.className = ''; 
        messageArea.classList.add(type);
        messageArea.style.display = 'block';
        if (type !== 'error') {
            setTimeout(() => {
                if (messageArea.textContent === text) { 
                     messageArea.style.display = 'none';
                }
            }, 4000); 
        }
    }
    
    // ... (The rest of the JavaScript functions from the original file would go here)
    // - hideMessage()
    // - showHomeScreen()
    // - showQuizScreen()
    // - showResultsScreen()
    // - resetQuizState()
    // - startPracticeAllMode()
    // - startOfficialTestMode()
    // - startOfficialTestPart2()
    // - displayQuestion()
    // - selectAnswer()
    // - submitAnswer()
    // - nextQuestionFlow()
    // - displayPracticeAllResults()
    // - displayOfficialTestResults()
    // - handleRestart()
    
    // --- Initializer ---
    async function initializeApp() {
        const questions = await fetchQuestions();
        categorizeQuestions(questions);
        showHomeScreen();

        // --- Event Listeners ---
        startPracticeAllBtn.addEventListener('click', startPracticeAllMode);
        startOfficialTestBtn.addEventListener('click', startOfficialTestMode);
        quizBackToHomeBtn.addEventListener('click', showHomeScreen); 
        submitBtn.addEventListener('click', submitAnswer);
        nextBtn.addEventListener('click', nextQuestionFlow);
        restartBtn.addEventListener('click', handleRestart); 
        homeBtnResults.addEventListener('click', showHomeScreen);
    }
    
    initializeApp();
});
