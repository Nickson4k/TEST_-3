// Завантаження даних з JSON файлу
let quizData = [];
let currentQuestion = 0;
let score = 0;
let selectedOption = null;
let isAIMode = false;
const GROQ_API_KEY = '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';

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
const modeSwitchBtn = document.getElementById('mode-switch-btn');
const aiAnswerContainer = document.getElementById('ai-answer-container');
const userAnswerInput = document.getElementById('user-answer');
const aiFeedback = document.getElementById('ai-feedback');

// Функціонал перемикання теми
const themeSwitchBtn = document.getElementById('theme-switch-btn');
const themeEmoji = themeSwitchBtn.querySelector('.theme-emoji');

// Перевіряємо збережену тему
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Масив з можливими файлами даних
const dataFiles = [
    './data.json',
    './data_1.json',
    './data_2.json'
];

// Функція для додавання timestamp до URL
function addTimestamp(url) {
    return `${url}?t=${Date.now()}`;
}

// Функція для завантаження всіх файлів
async function loadAllData() {
    try {
        const responses = await Promise.all(
            dataFiles.map(file => fetch(addTimestamp(file)))
        );
        
        const data = await Promise.all(
            responses.map(response => response.json())
        );
        
        // Вибираємо випадковий файл з завантажених
        const randomIndex = Math.floor(Math.random() * data.length);
        quizData = data[randomIndex].quiz_data;
        startQuiz();
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        questionElement.textContent = 'Помилка завантаження тесту. Будь ласка, спробуйте пізніше.';
    }
}

// Завантаження даних
loadAllData();

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
    
    if (isAIMode) {
        optionsContainer.style.display = 'none';
        aiAnswerContainer.style.display = 'block';
        userAnswerInput.value = '';
        aiFeedback.textContent = '';
        nextButton.disabled = false;
    } else {
        optionsContainer.style.display = 'block';
        aiAnswerContainer.style.display = 'none';
        
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
        
        nextButton.disabled = true;
    }

    // Оновлення прогресу
    updateProgress();
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

// Функція для анімації друкування тексту
async function typeText(element, text, speed = 10) {
    element.textContent = '';
    element.classList.add('typing-animation');
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    element.classList.remove('typing-animation');
}

async function checkAIAnswer() {
    const userAnswer = userAnswerInput.value.trim();
    if (!userAnswer) {
        alert('Будь ласка, введіть вашу відповідь!');
        return;
    }

    nextButton.disabled = true;
    aiFeedback.textContent = 'Думаю';
    aiFeedback.classList.add('typing-animation');

    const question = quizData[currentQuestion];
    
    try {
        // Завантажуємо промпт з файлу
        const promptResponse = await fetch('prompt.json');
        const promptData = await promptResponse.json();
        const promptTemplate = promptData.prompt_template;

        // Формуємо промпт
        const prompt = `${promptTemplate.context}

Стиль відповіді:
${promptTemplate.style.tone}
${promptTemplate.style.language}

Сленгові фрази для використання:
Позитивні: ${promptTemplate.style.slang_phrases.positive.join(', ')}
Негативні: ${promptTemplate.style.slang_phrases.negative.join(', ')}

${promptTemplate.style.features.map(feature => `- ${feature}`).join('\n')}

Питання: ${question.q}
Правильна відповідь: ${question.options[question.answer]}
Відповідь користувача: ${userAnswer}

Важливо: 
${promptTemplate.rules.map(rule => `- ${rule}`).join('\n')}

Правильні відповіді для всіх питань:
${promptTemplate.correct_answers.map(answer => `- ${answer}`).join('\n')}

Альтернативні формулювання правильних відповідей:
${promptTemplate.alternative_answers.map(answer => `- ${answer}`).join('\n')}

Критерії оцінки:
${promptTemplate.evaluation_criteria.map(criterion => `- ${criterion}`).join('\n')}

Надай оцінку у форматі:
${promptTemplate.rating_format.correct.symbol} ${promptTemplate.rating_format.correct.description}
${promptTemplate.rating_format.partially_correct.symbol} ${promptTemplate.rating_format.partially_correct.description}
${promptTemplate.rating_format.incorrect.symbol} ${promptTemplate.rating_format.incorrect.description}

${promptTemplate.explanation_requirement}

Важливо: Давай коротку відповідь, максимум 2 речення.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            mode: 'cors',
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const feedback = data.choices[0].message.content;
        
        await typeText(aiFeedback, feedback);
        nextButton.disabled = false;
        nextButton.textContent = currentQuestion === quizData.length - 1 ? 'Завершити' : 'Наступне питання';
    } catch (error) {
        console.error('Помилка при аналізі відповіді:', error);
        aiFeedback.textContent = 'Виникла помилка при аналізі відповіді. Спробуйте ще раз.';
        nextButton.disabled = false;
    } finally {
        aiFeedback.classList.remove('typing-animation');
    }
}

// Обробники подій
modeSwitchBtn.addEventListener('click', () => {
    isAIMode = !isAIMode;
    modeSwitchBtn.textContent = isAIMode ? 'Перемкнути на звичайний режим' : 'XOXLO AI';
    startQuiz();
});

nextButton.addEventListener('click', () => {
    if (isAIMode) {
        if (nextButton.textContent === 'Відповісти') {
            checkAIAnswer();
        } else {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                showQuestion();
                nextButton.textContent = 'Відповісти';
            } else {
                showResult();
            }
        }
    } else {
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
    }
});

restartButton.addEventListener('click', () => {
    resultContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    startQuiz();
});

// Обробник перемикання теми
themeSwitchBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
});

function updateThemeButton(theme) {
    if (theme === 'dark') {
        themeEmoji.textContent = '☀️';
    } else {
        themeEmoji.textContent = '🌙';
    }
} 
