document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const MAX_SIGN_QUESTIONS = 10;
    const MAX_SAFETY_QUESTIONS = 30;
    const SAFETY_PASS_PERCENTAGE = 0.80;
    const IMAGE_BASE_PATH = 'dmvimages/';

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
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Could not fetch questions:", error);
            showMessage("Failed to load questions. Please check the `questions.json` file and web server console.", "error");
            return [];
        }
    }

    function categorizeQuestions(questions) {
        allQuestionsMaster = questions.filter(q => q.answers && q.answers.length > 0);
        signQuestions = allQuestionsMaster.filter(q => q.description && q.description.toLowerCase() === 'signs');
        safetyQuestions = allQuestionsMaster.filter(q => q.description && q.description.toLowerCase() !== 'signs'); // Treat non-Signs as Safety/General
    }

    function showMessage(text, type = 'info') {
        messageArea.textContent = text;
        messageArea.className = '';
        messageArea.classList.add(type);
        messageArea.style.display = 'block';
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                if (messageArea.textContent === text) messageArea.style.display = 'none';
            }, 4000);
        }
    }

    function hideMessage() {
        messageArea.style.display = 'none';
    }

    function showScreen(screen) {
        homeScreenArea.style.display = 'none';
        quizArea.style.display = 'none';
        resultsArea.style.display = 'none';
        screen.style.display = 'block';
    }
    
    function resetQuizState() {
        currentQuestionIndex = 0;
        score = 0;
        selectedAnswerValue = null;
        officialTestPart1Score = 0;
        scoreDisplay.textContent = score;
        feedbackContainer.innerHTML = '';
        currentPartInfoDisplay.textContent = '';
        hideMessage();
    }

    function startPracticeAllMode() {
        resetQuizState();
        currentTestMode = 'practiceAll';
        currentActiveQuestions = shuffleArray([...allQuestionsMaster]);
        totalQuestionsDisplay.textContent = currentActiveQuestions.length;
        if (currentActiveQuestions.length > 0) {
            showScreen(quizArea);
            displayQuestion();
        } else {
            showMessage("No questions available for practice mode.", "error");
        }
    }

    function startOfficialTestMode() {
        resetQuizState();
        currentTestMode = 'officialSigns';
        currentActiveQuestions = shuffleArray([...signQuestions]).slice(0, MAX_SIGN_QUESTIONS);
        if (currentActiveQuestions.length < MAX_SIGN_QUESTIONS) {
            showMessage(`Not enough "Signs" questions for the official test (need ${MAX_SIGN_QUESTIONS}, found ${currentActiveQuestions.length}).`, "error");
            showScreen(homeScreenArea);
            return;
        }
        totalQuestionsDisplay.textContent = MAX_SIGN_QUESTIONS;
        currentPartInfoDisplay.textContent = "Part 1: Road Signs (100% required)";
        showMessage("Official Test - Part 1: Road Signs. You must answer all 10 questions correctly.", "info");
        showScreen(quizArea);
        displayQuestion();
    }
    
    function startOfficialTestPart2() {
        currentQuestionIndex = 0;
        score = 0;
        scoreDisplay.textContent = score;
        selectedAnswerValue = null;
        currentTestMode = 'officialSafety';
        currentActiveQuestions = shuffleArray([...safetyQuestions]).slice(0, MAX_SAFETY_QUESTIONS);
        if (currentActiveQuestions.length < MAX_SAFETY_QUESTIONS) {
            showMessage(`Not enough "General Knowledge" questions for the official test (need ${MAX_SAFETY_QUESTIONS}, found ${currentActiveQuestions.length}).`, "error");
            showScreen(homeScreenArea);
            return;
        }
        totalQuestionsDisplay.textContent = MAX_SAFETY_QUESTIONS;
        currentPartInfoDisplay.textContent = `Part 2: General Knowledge (${SAFETY_PASS_PERCENTAGE * 100}% required)`;
        showMessage("Congratulations! You passed Part 1. Now for Part 2: General Knowledge.", "success");
        displayQuestion();
    }

    function displayQuestion() {
        selectedAnswerValue = null;
        const currentQuestion = currentActiveQuestions[currentQuestionIndex];

        questionImageContainer.innerHTML = '';
        if (currentQuestion.images && currentQuestion.images.length > 0) {
            currentQuestion.images.forEach(imageName => {
                if (imageName && imageName.trim() !== "") {
                    const imgElement = document.createElement('img');
                    imgElement.src = `${IMAGE_BASE_PATH}${imageName}`;
                    imgElement.alt = `Image for: ${currentQuestion.question.substring(0, 30)}...`;
                    imgElement.onerror = function() {
                        this.onerror = null;
                        this.src = `https://placehold.co/200x150/EBF4FF/1E293B?text=Image+Not+Found`;
                        this.alt = 'Image not found';
                    };
                    questionImageContainer.appendChild(imgElement);
                }
            });
        }
        
        questionTextContainer.textContent = currentQuestion.question;
        answersContainer.innerHTML = '';
        feedbackContainer.innerHTML = '';

        currentQuestion.answers.forEach(answer => {
            if (answer.text && answer.text.trim() !== "") {
                const option = document.createElement('button');
                option.classList.add('answer-option');
                option.textContent = answer.text;
                option.dataset.value = answer.value;
                option.addEventListener('click', () => selectAnswer(option, answer.value));
                answersContainer.appendChild(option);
            }
        });

        questionCounterDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${currentActiveQuestions.length}`;
        const progressPercentage = ((currentQuestionIndex + 1) / currentActiveQuestions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        submitBtn.style.display = 'block';
        submitBtn.disabled = true;
        nextBtn.style.display = 'none';
    }

    function selectAnswer(selectedOptionElement, answerValue) {
        answersContainer.querySelector('.selected')?.classList.remove('selected');
        selectedOptionElement.classList.add('selected');
        selectedAnswerValue = answerValue;
        submitBtn.disabled = false;
    }

    function submitAnswer() {
        if (selectedAnswerValue === null) return;

        const currentQuestion = currentActiveQuestions[currentQuestionIndex];
        const correctAnswer = currentQuestion.correctAnswer;
        const isCorrect = selectedAnswerValue === correctAnswer;
        
        let feedbackText = '';
        const correctAnswerOption = currentQuestion.answers.find(ans => ans.value === correctAnswer);
        
        if (isCorrect) {
            score++;
            if (currentTestMode === 'officialSigns') officialTestPart1Score++;
            feedbackText = '<p class="feedback-correct">Correct!</p>';
        } else {
            feedbackText = `<p class="feedback-incorrect">Incorrect. The correct answer was: ${correctAnswerOption?.text || 'N/A'}</p>`;
        }
        
        feedbackText += `<div class="feedback-explanation">${currentQuestion.feedback || 'No feedback available.'}</div>`;
        feedbackContainer.innerHTML = feedbackText;
        scoreDisplay.textContent = score;

        submitBtn.style.display = 'none';
        nextBtn.style.display = 'block';

        Array.from(answersContainer.children).forEach(button => {
            button.disabled = true;
            if (button.dataset.value === correctAnswer) {
                button.classList.add('correct');
            } else if (button.dataset.value === selectedAnswerValue) {
                button.classList.add('incorrect');
            }
        });
        
        if (currentTestMode === 'officialSigns' && !isCorrect) {
            displayOfficialTestResults(false, "Signs Part Failed");
            nextBtn.style.display = 'none'; // Stop progression
        }
    }

    function nextQuestionFlow() {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentActiveQuestions.length) {
            displayQuestion();
        } else {
            if (currentTestMode === 'practiceAll') {
                displayPracticeAllResults();
            } else if (currentTestMode === 'officialSigns') {
                startOfficialTestPart2();
            } else if (currentTestMode === 'officialSafety') {
                const safetyPassMark = Math.ceil(MAX_SAFETY_QUESTIONS * SAFETY_PASS_PERCENTAGE);
                const passedSafety = score >= safetyPassMark;
                displayOfficialTestResults(passedSafety, "Test Complete");
            }
        }
    }

    function displayPracticeAllResults() {
        showScreen(resultsArea);
        resultsTitle.textContent = "Practice Mode Finished!";
        finalScoreDisplay.textContent = `Your final score: ${score} out of ${currentActiveQuestions.length}`;
        const percentage = currentActiveQuestions.length > 0 ? (score / currentActiveQuestions.length) * 100 : 0;
        finalPercentageDisplay.textContent = `Percentage: ${percentage.toFixed(2)}%`;
        officialTestPassFailMessage.textContent = '';
    }

    function displayOfficialTestResults(passedOverall, stage) {
        showScreen(resultsArea);
        resultsTitle.textContent = "Official Practice Test Results";
        officialTestPassFailMessage.className = 'text-lg font-semibold mb-4';

        if (stage === "Signs Part Failed") {
            finalScoreDisplay.textContent = `Signs Test Score: ${officialTestPart1Score} out of ${MAX_SIGN_QUESTIONS}.`;
            finalPercentageDisplay.textContent = "You must answer all 10 signs questions correctly to proceed.";
            officialTestPassFailMessage.textContent = "You did not pass the Road Signs portion.";
            officialTestPassFailMessage.classList.add('text-red-600');
        } else if (stage === "Test Complete") {
            const safetyPassMark = Math.ceil(MAX_SAFETY_QUESTIONS * SAFETY_PASS_PERCENTAGE);
            finalScoreDisplay.textContent = `Signs: ${officialTestPart1Score}/${MAX_SIGN_QUESTIONS} | General Knowledge: ${score}/${MAX_SAFETY_QUESTIONS}`;
            
            if (passedOverall) {
                officialTestPassFailMessage.textContent = "Congratulations! You have PASSED the Official Practice Test!";
                officialTestPassFailMessage.classList.add('text-green-600');
            } else {
                officialTestPassFailMessage.textContent = `You did not pass the General Knowledge portion. (Required: ${safetyPassMark} correct, You got: ${score})`;
                officialTestPassFailMessage.classList.add('text-red-600');
            }
        }
    }

    function handleRestart() {
        if (currentTestMode === 'practiceAll') {
            startPracticeAllMode();
        } else {
            startOfficialTestMode();
        }
    }

    // --- Initializer ---
    async function initializeApp() {
        const questions = await fetchQuestions();
        categorizeQuestions(questions);
        showScreen(homeScreenArea);

        startPracticeAllBtn.addEventListener('click', startPracticeAllMode);
        startOfficialTestBtn.addEventListener('click', startOfficialTestMode);
        quizBackToHomeBtn.addEventListener('click', () => showScreen(homeScreenArea));
        submitBtn.addEventListener('click', submitAnswer);
        nextBtn.addEventListener('click', nextQuestionFlow);
        restartBtn.addEventListener('click', handleRestart);
        homeBtnResults.addEventListener('click', () => showScreen(homeScreenArea));
    }

    initializeApp();
});
