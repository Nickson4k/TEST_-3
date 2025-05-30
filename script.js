// Завантаження даних з JSON файлу
let quizData = [];
let currentQuestion = 0;
let score = 0;
let selectedOption = null;

// DOM елементи
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const nextButton = document.getElementById('next-btn');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const quizContainer = document.querySelector('.quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const percentageElement = document.getElementById('percentage');
const restartButton = document.getElementById('restart-btn');

// Масив з можливими файлами даних
const dataFiles = ['data.json', 'data_1.json', 'data_2.json'];

// Функція для випадкового вибору файлу
function getRandomDataFile() {
    const randomIndex = Math.floor(Math.random() * dataFiles.length);
    return dataFiles[randomIndex];
}

// Завантаження даних
fetch(getRandomDataFile())
    .then(response => response.json())
    .then(data => {
        quizData = data.quiz_data;
        startQuiz();
    })
    .catch(error => {
        console.error('Помилка завантаження даних:', error);
        questionElement.textContent = 'Помилка завантаження тесту. Будь ласка, спробуйте пізніше.';
    });

function startQuiz() {
    currentQuestion = 0;
    score = 0;
    showQuestion();
}

// Функція для перемішування масиву (алгоритм Фішера-Єйтса)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
    const question = quizData[currentQuestion];
    questionElement.textContent = `${currentQuestion + 1}. ${question.q}`;
    
    // Очищення попередніх опцій
    optionsContainer.innerHTML = '';
    
    // Створюємо масив об'єктів з опціями та їх індексами
    const optionsWithIndexes = question.options.map((option, index) => ({
        text: option,
        originalIndex: index
    }));
    
    // Перемішуємо опції
    const shuffledOptions = shuffleArray([...optionsWithIndexes]);
    
    // Знаходимо новий індекс правильної відповіді
    const correctAnswerIndex = shuffledOptions.findIndex(option => option.originalIndex === question.answer);
    
    // Оновлюємо індекс правильної відповіді в поточному питанні
    quizData[currentQuestion].answer = correctAnswerIndex;
    
    // Додавання нових опцій
    shuffledOptions.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.textContent = option.text;
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });

    // Оновлення прогресу
    updateProgress();
    
    // Скидання стану кнопки
    nextButton.disabled = true;
    selectedOption = null;
}

function selectOption(index) {
    // Видалення попереднього вибору
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    
    // Відмітка нового вибору
    options[index].classList.add('selected');
    selectedOption = index;
    nextButton.disabled = false;
}

function updateProgress() {
    const progress = ((currentQuestion + 1) / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Питання ${currentQuestion + 1} з ${quizData.length}`;
}

function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    const percentage = (score / quizData.length) * 100;
    scoreElement.textContent = `${score} з ${quizData.length}`;
    percentageElement.textContent = `Відсоток правильних відповідей: ${percentage.toFixed(1)}%`;
}

function checkAnswer() {
    const question = quizData[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    // Позначення правильної та неправильної відповіді
    options[question.answer].classList.add('correct');
    if (selectedOption !== question.answer) {
        options[selectedOption].classList.add('wrong');
    }
    
    // Оновлення рахунку
    if (selectedOption === question.answer) {
        score++;
    }
    
    // Блокування кнопки та опцій
    nextButton.disabled = false;
    options.forEach(option => {
        option.style.pointerEvents = 'none';
    });
    
    // Зміна тексту кнопки
    nextButton.textContent = currentQuestion === quizData.length - 1 ? 'Завершити' : 'Наступне питання';
}

// Обробники подій
nextButton.addEventListener('click', () => {
    if (selectedOption === null) {
        alert('Будь ласка, оберіть варіант відповіді!');
        return;
    }
    
    if (nextButton.textContent === 'Відповісти') {
        checkAnswer();
    } else {
        currentQuestion++;
        if (currentQuestion < quizData.length) {
            showQuestion();
            nextButton.textContent = 'Відповісти';
        } else {
            showResult();
        }
    }
});

restartButton.addEventListener('click', () => {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    startQuiz();
}); 
