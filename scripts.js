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

// Obiekt gracza
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: 5,
    dx: 0
};

// Pociski gracza
let bullets = [];
let bulletSpeed = 7;
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
let enemySpeed = 1;
let enemyDirection = 1;

// Pociski wrogów
let enemyBullets = [];

// Power-upy
let powerUps = [];

// Punkty
let score = 0;

// Timer strzałów wrogów
let enemyShootTimer = 0;
let enemyShootInterval = 120; // Domyślnie 2 sekundy przy 60 FPS

// Stan gry
let gameRunning = false;
let animationFrameId;

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
    if (difficulty === 'easy') {
        enemyShootInterval = 240; // 4 sekundy
        enemySpeed = 0.5;
    } else if (difficulty === 'medium') {
        enemyShootInterval = 150; // 2.5 sekundy
        enemySpeed = 1;
    } else if (difficulty === 'hard') {
        enemyShootInterval = 90; // 1.5 sekundy
        enemySpeed = 1.5;
    }
    console.log(`Difficulty: ${difficulty}, enemySpeed: ${enemySpeed}, enemyShootInterval: ${enemyShootInterval}`);
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
    const randomAngle = (Math.random() - 0.5) * Math.PI / 4; // Losowy kąt w zakresie ±22.5 stopni
    const speed = 4;
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
function updatePowerUp() {
    if (bulletPowerUp) {
        powerUpTimer--;
        powerUpMessage.textContent = 'Power-Up Active!';
        powerUpMessage.classList.add('power-up-active');
        powerUpMessage.style.color = 'yellow';
        if (powerUpTimer <= 0) {
            bulletPowerUp = false;
            bulletWidth = 5;
            bulletSpeed = 7;
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
}

// Powrót do menu wyboru poziomu trudności
function returnToMenu() {
    gameOverPopup.style.display = 'none';
    gameContainer.style.display = 'none';
    startScreen.style.display = 'block';
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    player.x = canvas.width / 2 - 25;
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    bulletPowerUp = false;
    bulletWidth = 5;
    bulletSpeed = 7;
    powerUpTimer = 0;
    enemyShootTimer = 0;
    powerUpMessage.textContent = '';
    powerUpMessage.classList.remove('power-up-active');
    enemies = [];
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    console.log('Returned to difficulty selection menu');
}

returnToMenuButton.addEventListener('click', returnToMenu);

// Rozpoczęcie gry z wybranym poziomem trudności
function startGame(diff) {
    setDifficulty(diff);
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    gameRunning = true;
    initEnemies();
    console.log('Game started, difficulty:', difficulty, 'Player:', player, 'Enemies:', enemies.length);
    gameLoop();
}

easyButton.addEventListener('click', () => startGame('easy'));
mediumButton.addEventListener('click', () => startGame('medium'));
hardButton.addEventListener('click', () => startGame('hard'));

// Restart gry
function restartGame() {
    gameOverPopup.style.display = 'none';
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    player.x = canvas.width / 2 - 25;
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    bulletPowerUp = false;
    bulletWidth = 5;
    bulletSpeed = 7;
    powerUpTimer = 0;
    enemyShootTimer = 0;
    powerUpMessage.textContent = '';
    powerUpMessage.classList.remove('power-up-active');
    setDifficulty(difficulty); // Przywróć parametry trudności
    gameRunning = true;
    initEnemies();
    console.log('Game restarted, difficulty:', difficulty);
    gameLoop();
}

restartButton.addEventListener('click', restartGame);

// Ruch i logika gry
function update() {
    if (!gameRunning) return;

    // Ruch gracza
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Ruch pocisków gracza
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Ruch pocisków wrogów
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            enemyBullets.splice(index, 1);
        }

        // Kolizja z graczem
        if (checkCollision(bullet, player)) {
            showGameOver(false); // Przegrana
        }
    });

    // Ruch wrogów
    let edge = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemySpeed * enemyDirection;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) edge = true;
    });

    if (edge) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            enemy.y += 20;
        });
    }

    // Strzelanie wrogów
    enemyShootTimer++;
    if (enemyShootTimer >= enemyShootInterval) {
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
        enemyShootTimer = 0;
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
        powerUp.y += 2;
        if (powerUp.y > canvas.height) powerUps.splice(index, 1);

        if (checkCollision(powerUp, player)) {
            powerUps.splice(index, 1);
            bulletPowerUp = true;
            bulletWidth = 15;
            bulletSpeed = 10;
            powerUpTimer = 600; // 10 sekund przy 60 FPS
        }
    });

    updatePowerUp();

    // Sprawdzenie końca gry (wygrana)
    let aliveEnemies = enemies.filter(enemy => enemy.alive).length;
    if (aliveEnemies === 0) {
        showGameOver(true); // Wygrana
    }
}

// Rysowanie
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Drawing: player:', player, 'enemies:', enemies.length);

    // Gracz z animacją
    ctx.save();
    if (bulletPowerUp) {
        const scale = 1 + 0.2 * Math.sin(Date.now() / 100); // Pulsowanie
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
function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}
