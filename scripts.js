const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameContainer = document.getElementById('gameContainer');
const gameOverPopup = document.getElementById('gameOverPopup');
const gameOverContent = document.getElementById('gameOverContent');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const returnToMenuButton = document.getElementById('returnToMenuButton');
const scoreDisplay = document.getElementById('score');
const powerUpMessage = document.getElementById('powerUpMessage');

let player, enemies, bullets, enemyBullets, powerUp, score, gameState, difficulty;
let lastShotTime = 0;
const shootInterval = 300; // ms

function initGame() {
    player = { x: canvas.width / 2 - 25, y: canvas.height - 50, width: 50, height: 30, speed: 5 };
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerUp = null;
    score = 0;
    gameState = 'playing';
    scoreDisplay.textContent = `Score: ${score}`;
    powerUpMessage.classList.remove('power-up-active');
}

function setDifficulty(diff) {
    difficulty = diff;
    let enemyRows, enemySpeed, enemyShootInterval;

    switch (difficulty) {
        case 'easy':
            enemyRows = 5;
            enemySpeed = 1;
            enemyShootInterval = 2000; // Rzadsze strzały
            break;
        case 'medium':
            enemyRows = 6;
            enemySpeed = 1.5;
            enemyShootInterval = 1500; // Częstsze strzały
            break;
        case 'hard':
            enemyRows = 7;
            enemySpeed = 2;
            enemyShootInterval = 1000; // Najczęstsze strzały
            break;
        default:
            console.error('Unknown difficulty:', difficulty);
            enemyRows = 5;
            enemySpeed = 1;
            enemyShootInterval = 2000;
    }

    console.log(`Setting difficulty: ${difficulty}, enemyRows: ${enemyRows}, enemySpeed: ${enemySpeed}, enemyShootInterval: ${enemyShootInterval}`);
    return { enemyRows, enemySpeed, enemyShootInterval };
}

function createEnemies(enemyRows) {
    enemies = [];
    const enemyWidth = 40;
    const enemyHeight = 30;
    const cols = 10;
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            });
        }
    }
}

function startGame(diff) {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    initGame();
    const { enemyRows, enemySpeed, enemyShootInterval } = setDifficulty(diff);
    createEnemies(enemyRows);
    console.log(`Game started, difficulty: ${difficulty}, Player: ${JSON.stringify(player)}, Enemies: ${enemies.length}`);
    gameLoop();
    setInterval(enemyShoot, enemyShootInterval);
}

document.getElementById('easyButton').addEventListener('click', () => startGame('easy'));
document.getElementById('mediumButton').addEventListener('click', () => startGame('medium'));
document.getElementById('hardButton').addEventListener('click', () => startGame('hard'));

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
}

function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime < shootInterval) return;
    lastShotTime = currentTime;
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speed: powerUp ? 10 : 5,
        color: powerUp ? 'yellow' : 'white'
    };
    bullets.push(bullet);
}

function enemyShoot() {
    if (gameState !== 'playing') return;
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) return;
    const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    enemyBullets.push({
        x: shooter.x + shooter.width / 2 - 2.5,
        y: shooter.y + shooter.height,
        width: 5,
        height: 10,
        speed: 3
    });
}

function spawnPowerUp() {
    if (Math.random() < 0.01 && !powerUp) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length === 0) return;
        const enemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        powerUp = {
            x: enemy.x + enemy.width / 2 - 10,
            y: enemy.y + enemy.height,
            width: 20,
            height: 20,
            speed: 2
        };
    }
}

function update() {
    if (gameState !== 'playing') return;

    movePlayer();
    if (keys['Space']) shoot();

    // Ruch pocisków gracza
    bullets.forEach(b => (b.y -= b.speed));
    bullets = bullets.filter(b => b.y > -b.height);

    // Ruch pocisków wrogów
    enemyBullets.forEach(b => (b.y += b.speed));
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

    // Ruch wrogów
    const { enemySpeed } = setDifficulty(difficulty);
    let maxX = 0, minX = canvas.width, direction = 0;
    enemies.forEach(e => {
        if (e.alive) {
            maxX = Math.max(maxX, e.x + e.width);
            minX = Math.min(minX, e.x);
        }
    });
    if (maxX > canvas.width - 50) direction = -1;
    if (minX < 50) direction = 1;
    enemies.forEach(e => {
        if (e.alive) e.x += direction * enemySpeed;
    });

    // Power-Up
    if (powerUp) {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) powerUp = null;
        if (collides(player, powerUp)) {
            powerUp = null;
            powerUpMessage.classList.add('power-up-active');
            setTimeout(() => {
                powerUpMessage.classList.remove('power-up-active');
            }, 5000);
        }
    }
    spawnPowerUp();

    // Kolizje
    bullets.forEach(b => {
        enemies.forEach(e => {
            if (e.alive && collides(b, e)) {
                e.alive = false;
                b.y = -b.height;
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;
            }
        });
    });

    enemyBullets.forEach(b => {
        if (collides(b, player)) {
            gameState = 'gameover';
            showGameOver('Lost!');
        }
    });

    if (enemies.every(e => !e.alive)) {
        gameState = 'gameover';
        showGameOver('Won!');
    }

    enemies.forEach(e => {
        if (e.alive && e.y + e.height > player.y) {
            gameState = 'gameover';
            showGameOver('Lost!');
        }
    });
}

function collides(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function showGameOver(result) {
    gameOverPopup.style.display = 'flex';
    gameOverContent.children[0].textContent = result;
    finalScore.textContent = `Score: ${score}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log(`Drawing: player: ${JSON.stringify(player)}, enemies: ${enemies.filter(e => e.alive).length}`);

    // Gracz
    ctx.fillStyle = powerUp ? 'yellow' : 'white';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    if (powerUp) {
        ctx.strokeStyle = 'yellow';
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }

    // Wrogowie
    ctx.fillStyle = 'green';
    enemies.forEach(e => {
        if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    // Pociski
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Pociski wrogów
    ctx.fillStyle = 'red';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Power-Up
    if (powerUp) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
}

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

let keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Escape' && gameState === 'gameover') {
        console.log('Returned to difficulty selection menu');
        gameOverPopup.style.display = 'none';
        gameContainer.style.display = 'none';
        startScreen.style.display = 'block';
    }
    if (e.code === 'Enter' && gameState === 'gameover') {
        console.log(`Game restarted, difficulty: ${difficulty}`);
        gameOverPopup.style.display = 'none';
        startGame(difficulty);
    }
});
window.addEventListener('keyup', e => (keys[e.code] = false));

restartButton.addEventListener('click', () => {
    console.log(`Game restarted, difficulty: ${difficulty}`);
    gameOverPopup.style.display = 'none';
    startGame(difficulty);
});

returnToMenuButton.addEventListener('click', () => {
    console.log('Returned to difficulty selection menu');
    gameOverPopup.style.display = 'none';
    gameContainer.style.display = 'none';
    startScreen.style.display = 'block';
});
