const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const returnToMenuButton = document.getElementById('returnToMenuButton');
const startScreen = document.getElementById('startScreen');
const gameContainer = document.getElementById('gameContainer');
const powerUpMessage = document.getElementById('powerUpMessage');
const easyButton = document.getElementById('easyButton');
const mediumButton = document.getElementById('mediumButton');
const hardButton = document.getElementById('hardButton');
const endlessButton = document.getElementById('endlessButton');
const nicknameInput = document.getElementById('nicknameInput');
const highScoresTable = document.getElementById('highScores');

// Obiekt gracza
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: 300, // Piksele na sekundę
    dx: 0
};

// Pociski gracza
let bullets = [];
let bulletSpeed = 700; // Piksele na sekundę
let bulletWidth = 5;
let bulletHeight = 10;
let bulletPowerUp = false;
let powerUpTimer = 0;

// Wrogowie
let enemies = [];
let enemyRows = 5;
let enemyCols = 10;
let enemyWidth = 40;
let enemyHeight = 30;
let enemySpeed = 100; // Piksele na sekundę (ustawiane w setDifficulty)
let enemyDirection = 1;

// Pociski wrogów
let enemyBullets = [];

// Power-upy
let powerUps = [];

// Punkty
let score = 0;

// Timer strzałów wrogów
let lastEnemyShotTime = 0;
let enemyShootInterval = 2500; // Milisekundy (ustawiane w setDifficulty)

// Stan gry
let gameRunning = false;
let animationFrameId;
let lastTime = 0;
let isEndlessMode = false;
let nickname = '';
let movedDown = false; // Flaga dla przesunięcia wrogów
let difficultyLevel = 0; // Licznik odrodzeń w trybie Endless

// Poziom trudności
let difficulty = 'medium';

// Sterowanie
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !keys['SpaceDown'] && gameRunning) {
        shootBullet();
        keys['SpaceDown'] = true;
    }
    if (e.code === 'Enter' && gameOverPopup.style.display === 'flex') {
        restartGame();
    }
    if (e.code === 'Escape' && gameOverPopup.style.display === 'flex') {
        returnToMenu();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'Space') keys['SpaceDown'] = false;
});

// Ustawianie parametrów trudności
function setDifficulty(diff) {
    difficulty = diff;
    difficultyLevel = 0; // Resetuj poziom trudności
    if (difficulty === 'easy') {
        enemyShootInterval = 4000; // 4 sekundy
        enemySpeed = 50; // 50 pikseli na sekundę
    } else if (difficulty === 'medium') {
        enemyShootInterval = 2500; // 2.5 sekundy
        enemySpeed = 100; // 100 pikseli na sekundę
    } else if (difficulty === 'hard') {
        enemyShootInterval = 1500; // 1.5 sekundy
        enemySpeed = 150; // 150 pikseli na sekundę
    }
    console.log(`Difficulty: ${difficulty}, enemySpeed: ${enemySpeed}px/s, enemyShootInterval: ${enemyShootInterval}ms, difficultyLevel: ${difficultyLevel}`);
}

// Zwiększanie trudności w trybie Endless
function increaseDifficulty() {
    difficultyLevel++;
    enemySpeed = Math.min(650, enemySpeed + 50); // Max 650px/s
    enemyShootInterval = Math.max(500, enemyShootInterval - 250); // Min 500ms
    console.log(`Endless mode difficulty increased: difficultyLevel: ${difficultyLevel}, enemySpeed: ${enemySpeed}px/s, enemyShootInterval: ${enemyShootInterval}ms`);
}

// Tabela wyników
function saveHighScore() {
    if (!nickname) nickname = 'Anonymous';
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    // Znajdź istniejący wpis dla nicka
    const existingScore = highScores.find(entry => entry.nickname === nickname);
    if (existingScore) {
        // Nadpisz tylko jeśli nowy wynik jest wyższy
        if (score > existingScore.score) {
            const filteredScores = highScores.filter(entry => entry.nickname !== nickname);
            filteredScores.push({ 
                nickname, 
                score, 
                timestamp: Date.now() 
            });
            filteredScores.sort((a, b) => b.score - a.score);
            if (filteredScores.length > 10) filteredScores.length = 10;
            localStorage.setItem('highScores', JSON.stringify(filteredScores));
            console.log(`High score saved (overwritten for ${nickname}): score: ${score}`);
        } else {
            console.log(`High score not saved (lower score for ${nickname}): current: ${existingScore.score}, new: ${score}`);
        }
    } else {
        // Dodaj nowy wpis, jeśli nick nie istnieje
        highScores.push({ 
            nickname, 
            score, 
            timestamp: Date.now() 
        });
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > 10) highScores.length = 10;
        localStorage.setItem('highScores', JSON.stringify(highScores));
        console.log(`High score saved (new for ${nickname}): score: ${score}`);
    }
    updateHighScoresTable();
}

function updateHighScoresTable() {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScoresTable.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Nickname</th>
            <th>Score</th>
        </tr>
    `;
    highScores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.nickname}</td>
            <td>${entry.score}</td>
        `;
        highScoresTable.appendChild(row);
    });
    console.log('High scores table updated:', highScores);
}

// Inicjalizacja gry
function initGame() {
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 50,
        width: 50,
        height: 30,
        speed: 300,
        dx: 0
    };
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    score = 0; // Zawsze resetuj wynik
    difficultyLevel = 0; // Zawsze resetuj poziom trudności
    bulletPowerUp = false;
    bulletWidth = 5;
    bulletSpeed = 700;
    powerUpTimer = 0;
    lastEnemyShotTime = 0;
    movedDown = false;
    scoreDisplay.textContent = 'Score: ' + score; // Aktualizuj wyświetlanie wyniku
    powerUpMessage.textContent = '';
    powerUpMessage.classList.remove('power-up-active');
    initEnemies();
    console.log(`Game initialized, score: ${score}, scoreDisplay: ${scoreDisplay.textContent}, enemies: ${enemies.length}`);
}

// Inicjalizacja wrogów
function initEnemies() {
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true,
                col: col,
                row: row
            });
        }
    }
    console.log('Enemies initialized:', enemies.length);
}

// Strzał gracza
function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - bulletWidth / 2,
        y: player.y,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed
    });
}

// Strzał wroga (losowy kierunek)
function enemyShoot(enemy) {
    const randomAngle = (Math.random() - 0.5) * Math.PI / 4; // Losowy kąt ±22.5 stopni
    const speed = 400; // 400 pikseli na sekundę
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5,
        height: 10,
        speedX: speed * Math.sin(randomAngle),
        speedY: speed * Math.cos(randomAngle)
    });
}

// Znajdź najniższego wroga w danej kolumnie
function getLowestEnemyInColumn(col) {
    let lowestEnemy = null;
    let maxRow = -1;
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.col === col && enemy.row > maxRow) {
            lowestEnemy = enemy;
            maxRow = enemy.row;
        }
    });
    return lowestEnemy;
}

// Sprawdzenie kolizji
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Aktualizacja power-upu
function updatePowerUp(deltaTime) {
    if (bulletPowerUp) {
        powerUpTimer -= deltaTime / 1000; // Odejmuj czas w sekundach
        powerUpMessage.textContent = 'Power-Up Active!';
        powerUpMessage.classList.add('power-up-active');
        powerUpMessage.style.color = 'yellow';
        if (powerUpTimer <= 0) {
            bulletPowerUp = false;
            bulletWidth = 5;
            bulletSpeed = 700;
            powerUpMessage.textContent = '';
            powerUpMessage.classList.remove('power-up-active');
        }
    } else {
        powerUpMessage.textContent = '';
        powerUpMessage.classList.remove('power-up-active');
    }
}

// Pokazanie popupu przegranej lub wygranej
function showGameOver(isWin) {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverPopup.querySelector('h2').textContent = isWin ? 'Won!' : 'Lost!';
    gameOverPopup.style.display = 'flex';
    saveHighScore();
}

// Powrót do menu wyboru poziomu trudności
function returnToMenu() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverPopup.style.display = 'none';
    gameContainer.style.display = 'none';
    startScreen.style.display = 'block';
    isEndlessMode = false;
    nicknameInput.value = '';
    initGame();
    updateHighScoresTable();
    console.log('Returned to difficulty selection menu');
}

returnToMenuButton.addEventListener('click', returnToMenu);

// Rozpoczęcie gry z wybranym poziomem trudności
function startGame(diff, endless = false) {
    nickname = nicknameInput.value.trim() || 'Anonymous';
    isEndlessMode = endless;
    setDifficulty(diff);
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    initGame();
    gameRunning = true;
    lastTime = 0;
    console.log('Game started, difficulty:', difficulty, 'endless:', isEndlessMode, 'nickname:', nickname, 'Player:', player, 'Enemies:', enemies.length);
    requestAnimationFrame(gameLoop);
}

easyButton.addEventListener('click', () => startGame('easy'));
mediumButton.addEventListener('click', () => startGame('medium'));
hardButton.addEventListener('click', () => startGame('hard'));
endlessButton.addEventListener('click', () => startGame(difficulty, true));

// Restart gry
function restartGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverPopup.style.display = 'none';
    score = 0; // Resetuj wynik
    difficultyLevel = 0; // Resetuj poziom trudności
    scoreDisplay.textContent = 'Score: ' + score; // Aktualizuj wyświetlanie wyniku
    initGame();
    setDifficulty(difficulty);
    gameRunning = true;
    lastTime = 0;
    console.log(`Game restarted, score: ${score}, scoreDisplay: ${scoreDisplay.textContent}, difficultyLevel: 0, difficulty: ${difficulty}, endless: ${isEndlessMode}`);
    requestAnimationFrame(gameLoop);
}

restartButton.addEventListener('click', restartGame);

// Ruch i logika gry
function update(deltaTime) {
    if (!gameRunning) return;

    console.log('Updating, deltaTime:', deltaTime, 'gameRunning:', gameRunning);

    // Delta time w sekundach
    let dt = deltaTime / 1000;
    if (dt < 0 || isNaN(dt)) dt = 0;

    // Ruch gracza
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;

    player.x += player.dx * dt;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Ruch pocisków gracza
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed * dt;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Ruch pocisków wrogów
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.speedX * dt;
        bullet.y += bullet.speedY * dt;
        if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            enemyBullets.splice(index, 1);
        }

        // Kolizja z graczem
        if (checkCollision(bullet, player)) {
            showGameOver(false);
        }
    });

    // Ruch wrogów
    let edge = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemySpeed * enemyDirection * dt;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) edge = true;
    });

    if (edge && !movedDown) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            enemy.y += 20;
        });
        movedDown = true;
        console.log('Enemies moved down');
    } else if (!edge) {
        movedDown = false;
    }

    // Kolizje wrogów z graczem lub dolną krawędzią
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        if (checkCollision(enemy, player) || enemy.y + enemy.height >= canvas.height) {
            showGameOver(false);
        }
    });

    // Strzelanie wrogów
    const currentTime = performance.now();
    if (currentTime - lastEnemyShotTime >= enemyShootInterval) {
        let aliveCols = [];
        for (let col = 0; col < enemyCols; col++) {
            if (getLowestEnemyInColumn(col)) {
                aliveCols.push(col);
            }
        }
        if (aliveCols.length > 0) {
            let randomCol = aliveCols[Math.floor(Math.random() * aliveCols.length)];
            let shooter = getLowestEnemyInColumn(randomCol);
            if (shooter) {
                enemyShoot(shooter);
            }
        }
        lastEnemyShotTime = currentTime;
    }

    // Kolizje pocisków z wrogami
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (!enemy.alive) return;
            if (checkCollision(bullet, enemy)) {
                enemy.alive = false;
                bullets.splice(bIndex, 1);
                score += 10;
                scoreDisplay.textContent = 'Score: ' + score;

                // Losowy power-up
                if (Math.random() < 0.2) {
                    powerUps.push({
                        x: enemy.x,
                        y: enemy.y,
                        width: 20,
                        height: 20
                    });
                }
            }
        });
    });

    // Ruch i kolizje power-upów
    powerUps.forEach((powerUp, index) => {
        powerUp.y += 200 * dt; // 200 pikseli na sekundę
        if (powerUp.y > canvas.height) powerUps.splice(index, 1);

        if (checkCollision(powerUp, player)) {
            powerUps.splice(index, 1);
            bulletPowerUp = true;
            bulletWidth = 15;
            bulletSpeed = 1000;
            powerUpTimer = 10; // 10 sekund
        }
    });

    updatePowerUp(deltaTime);

    // Sprawdzenie końca gry lub odrodzenie w trybie Endless
    let aliveEnemies = enemies.filter(enemy => enemy.alive).length;
    if (aliveEnemies === 0) {
        if (isEndlessMode) {
            console.log(`Wave ${difficultyLevel + 1} cleared, preparing next wave`);
            increaseDifficulty();
            initEnemies();
            console.log('Endless mode: Enemies respawned');
        } else {
            showGameOver(true);
        }
    }
}

// Rysowanie
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Drawing: player:', player, 'enemies:', enemies.filter(e => e.alive).length);

    // Gracz z animacją
    ctx.save();
    if (bulletPowerUp) {
        const scale = 1 + 0.2 * Math.sin(performance.now() / 100); // Pulsowanie
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(player.x + player.width / 2), -(player.y + player.height / 2));
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.restore();

    // Pociski gracza
    ctx.fillStyle = bulletPowerUp ? 'yellow' : 'white';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Wrogowie
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // Pociski wrogów
    ctx.fillStyle = 'orange';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Power-upy
    ctx.fillStyle = 'green';
    powerUps.forEach(powerUp => {
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

// Główna pętla gry
function gameLoop(timestamp) {
    if (!gameRunning) {
        console.log('Game loop stopped, gameRunning:', gameRunning);
        return;
    }

    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (deltaTime < 0 || isNaN(deltaTime)) {
        console.warn('Invalid deltaTime:', deltaTime, 'resetting to 0');
        deltaTime = 0;
    }

    console.log('Game loop running, timestamp:', timestamp, 'deltaTime:', deltaTime);

    update(deltaTime);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Inicjalizacja tabeli wyników przy starcie
updateHighScoresTable();
