
const levelsConfig = {
  "1": { count: 5, points: 15 },
  "2": { count: 4, points: 25 },
  "3": { count: 3, points: 75 },
  "4": { count: 2, points: 150 },
  "5": { count: 1, points: 300 }
};

let level = 1;
let score = 0;
let current = 0;
let questions = [];
let answers = [];
let timer;
let timeLeft = 15;
let audioElement = document.getElementById("audio");
let gamemode = 0; //0 normal; 1 daily; a partir de 2 nivells. 2 nivell 1, 3 nivell 2, etc
let titols = ["PRIMER", "SEGON", "TERCER", "QUART", "CINQUÈ"];


function startGame() {
  background_sound = new Audio(`static/audiomenu/gran_dictat_music.mp3`);
  background_sound.play()
  background_sound.loop = true
  switch (gamemode) {
    case 3:
      level = 2;
      break;
    case 4:
      level = 3;
      break;
    case 5:
      level = 4;
      break;
    case 6:
      level = 5;
      break;
    default:
      level = 1;
      break;
  }
  score = 0;
  current = 0;
  answers = [];
  loadLevel(level)
}


function mostrarPopup() {
    document.getElementById('popup-nivells').style.display = 'flex';
  }

function tancarPopup() {
  document.getElementById('popup-nivells').style.display = 'none';
}


function startClassicMode(gm) {
  gamemode = gm;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-container").style.display = "block";

  uinp = document.getElementById("user-input");
  uinp.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      if (uinp.value != "") {
        submitAnswer();
      }
    }
  });

  skipSeparator = (event) => {
    if (event.target.tagName === "BUTTON" || event.target.tagName === "SPAN") return; // ignora clics en botons
    if (event.key === "Enter" | event.code ==="Space" | event.type === "click") {
      separator.style.display = "none";
      gameContainer.style.display = "block";
      renderQuestion();
    }
  };
  separator = document.getElementById("separator");
  gameContainer = document.getElementById("game-container");
  document.addEventListener("keyup", skipSeparator);
  document.addEventListener("click", skipSeparator);
  document.getElementById('startmusic').pause();

  startGame();
}

function loadLevel(lvl) {
  document.getElementById('startmusic').pause();
  audioElement.src = "static/audiomenu/separator_level_" + lvl + ".mp3"
  audioElement.play();
  currentAudio = audioElement

  const levelQuestions = Object.entries(audioWordMap)
    .filter(([file]) => file.startsWith(lvl + "-"));

  if (gamemode == 1) {
    questions = dateSeededShuffle(levelQuestions).slice(0, levelsConfig[lvl].count);
  } else if (gamemode == 0) {
    questions = shuffle(levelQuestions).slice(0, levelsConfig[lvl].count);
  } else {
    questions = shuffle(levelQuestions).slice(0, 15);
  }
  showLevelSeparator(lvl);

  current = 0;
}

function showLevelSeparator(level) {
  const separator = document.getElementById("separator");
  const gameContainer = document.getElementById("game-container");
  
  separator.style.display = "block";

  document.removeEventListener("click", restartAudio);
  document.addEventListener("keyup", skipSeparator)

  document.getElementById('nivell-titol').innerText = `${titols[level - 1]} NIVELL`;
  document.getElementById('nivell-info').innerText = `${levelsConfig[level].count} PARAULES`;
  document.getElementById('nivell-punts').innerText = `${levelsConfig[level].points} PUNTS PER CADA ENCERT`;

  //animació actualització nivell
  const level_el = document.getElementById("level-points");
  level_el.classList.remove('barrel-text');
  void level_el.offsetWidth;
  level_el.classList.add('barrel-text')
  level_el.textContent = `x${levelsConfig[level].points}`;

  // Set the text and show the separator
  gameContainer.style.display = "none";
  separator.style.display = 'flex';

  document.addEventListener("click", skipSeparator);
  if (gamemode >= 2) {
    document.body.click()
  }
}

function renderQuestion() {
  audioElement.currentTime = 0;
  audioElement.pause()

  document.removeEventListener("click", skipSeparator);
  document.removeEventListener("keyup", skipSeparator)
  document.addEventListener("click", restartAudio);
  if (current >= questions.length) {
    const nextLevel = level + 1;
    if (levelsConfig[nextLevel] && gamemode < 2) {
      level = nextLevel;
      loadLevel(level);
    } else {
      renderResult();
    }
    return;
  }

  const [audioFile, correctWord] = questions[current];
  audioElement.src = `static/audiowords/${audioFile}`;
  document.getElementById("score").textContent = `${score.toString().padStart(5, '0')}`;
  document.getElementById("level-points").textContent = `x${levelsConfig[level].points}`;
  document.getElementById("feedback").textContent = "";

  uinp = document.getElementById("user-input")
  uinp.disabled = false;
  uinp.value = "";
  uinp.focus()
  uinp.style.color="black"

  audioElement.play()
  
  startTimer();
}


function startTimer() {
  clearInterval(timer);
  timeLeft = 150; // 150.0 dècimes de segon = 150.0 segons

  //animació reinici comptador
  const timer_el = document.getElementById("timer");
  timer_el.classList.remove('barrel-text');
  void timer_el.offsetWidth;
  timer_el.classList.add('barrel-text')
  timer_el.textContent = '⏲ '+(timeLeft / 10).toFixed(1);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = '⏲ '+(timeLeft / 10).toFixed(1);
    if (timeLeft <= 0) {
      clearInterval(timer);
      submitAnswer(true);
    }
  }, 100); // cada 0.1 segons
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitAnswer(timeout = false) {
  //background_sound.pause()
  clearInterval(timer);
  const userInput = document.getElementById("user-input").value.trim().toUpperCase();
  document.getElementById("user-input").disabled = true;
  const correctAnswer = questions[current][1].toUpperCase();
  const isCorrect = !timeout && userInput === correctAnswer;

  typewriter_sound = new Audio('static/audiomenu/nova.mp3')
  feedback_sound = new Audio(`static/audiomenu/error.mp3`);

  var i = 0;
  var speed = 35; /* The speed/duration of the effect in milliseconds */
  function typeWriter() {
      if (i < correctAnswer.length) {
        document.getElementById("feedback").innerHTML += correctAnswer.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
    }
  }
  typewriter_sound.play()
  typeWriter()

  await sleep(speed*correctAnswer.length); //esperar uns ms
  typewriter_sound.pause()

  if (isCorrect) {
    score += levelsConfig[level].points;
    score += Math.ceil(parseInt((10 + timeLeft)*levelsConfig[level].points/10) / 5) * 5
    feedback_sound = new Audio(`static/audiomenu/acierto.mp3`);
    //document.getElementById("feedback").textContent = correctAnswer;
    document.getElementById("user-input").style.color="#366826";
    const score_el = document.getElementById("score");
    score_el.classList.remove('barrel-text');
    void score_el.offsetWidth;
    score_el.classList.add('barrel-text')
    score_el.textContent = `${score.toString().padStart(5, '0')}`;
  } else {
    //document.getElementById("feedback").textContent = correctAnswer;
    document.getElementById("user-input").style.color="#F55353";
  }

  feedback_sound.play()
  answers.push([correctAnswer, userInput, isCorrect]);
  current++;
  setTimeout(renderQuestion, 1500);
}

function renderResult() {
  end_sound = new Audio(`static/audiomenu/game_music.mp3`);
  end_sound.play();
  end_sound.loop = true;
  document.removeEventListener("click", restartAudio);

  const encerts = answers.filter(([_, __, isCorrect]) => isCorrect).length;
  const total = answers.length;
  const punts = score.toString();

  const resultHTML = answers.map(([correct, user, isCorrect]) => `
    <tr>
      <td>${correct}</td>
      <td class="${isCorrect ? 'resposta-correcta' : 'resposta-incorrecta'}">${user}</td>
      <td></td>
    </tr>
  `).join("");

  document.body.innerHTML = `
    <div class="resultat-container">
      <div class="tl3">HAS ACABAT LA PARTIDA!</div>
      <div class="tl4">Has encertat ${encerts} paraules d'un total de ${total} i has sumat ${punts} punts</div>
      <table class="taula-resultats">
        <tr>
          <th>PARAULA</th>
          <th>RESPOSTA</th>
          <th></th>
        </tr>
        ${resultHTML}
      </table>
      <div class="botonera">
        <button class="boto-inici" onclick="location.reload()">TORNA A COMENÇAR</button>
      </div>
    </div>
  `;
}


/* function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
} */

function shuffle(array) { 
  for (let i = array.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); // Random index 
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements 
  } 
  return array; 
} 


function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function dateSeededShuffle(array) {
    const today = new Date();
    const seed = parseInt(today.toISOString().slice(0, 10).replace(/-/g, '')); // ex: 20250727
    let shuffled = array.slice(); // Copiem l'array per no modificar l'original

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}


const restartAudio = () => {
  if (audioElement) {
    audioElement.currentTime = 0;
    audioElement.play();
  }
}