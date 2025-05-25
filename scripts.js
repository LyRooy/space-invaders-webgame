/*
===============================================
SPACE INVADERS - DOKUMENTACJA
===============================================

FUNKCJE:
- Tylko tryb nieskończony - fale stają się coraz trudniejsze
- Brak systemu żyć - jedno trafienie kończy grę
- Ulepszona grafika z robotami/statkami
- Power-upy: Power Shot, Rapid Fire, Shield
- System combo za kolejne trafienia
- Inteligentna sztuczna inteligencja wrogów różnych typów
- Efekty eksplozji cząsteczkowych
- System najlepszych wyników z localStorage

STEROWANIE:
- Strzałki: Ruch statku gracza
- Spacja: Strzał (pojedyncze strzały, szybkie strzelanie tylko z power-upem)
- R: Poddaj się i wróć do menu
- Enter: Restart po końcu gry
- ESC: Powrót do menu podczas gry lub w game over

POWER-UPY:
- Power Shot: Większe, mocniejsze pociski
- Rapid Fire: Szybsze tempo strzelania
- Shield: Tymczasowa nieśmiertelność

TYPY WROGÓW:
- Normal (Czerwony): Podstawowi wrogowie, wolne strzelanie
- Fast (Pomarańczowy): Szybsze strzelanie
- Boss (Fioletowy): Najsilniejsi, najcelniejsze strzały
*/

// ===============================================
// SYSTEM AUDIO
// ===============================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
    // Dźwięk lasera gracza
    shoot: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    },
    
    // Dźwięk zniszczenia wroga
    enemyHit: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    },
    
    // Dźwięk zebrania power-upu
    powerUp: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    },
    
    // Dźwięk śmierci gracza
    playerHit: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    },
    
    // Dźwięk osiągnięcia combo
    combo: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
};

// ===============================================
// ELEMENTY DOM
// ===============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const elements = {
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    gameOver: document.getElementById('gameOverPopup'),
    finalScore: document.getElementById('finalScore'),
    startScreen: document.getElementById('startScreen'),
    gameContainer: document.getElementById('gameContainer'),
    nickname: document.getElementById('nicknameInput'),
    highScores: document.getElementById('highScores'),
    powerIndicator: document.getElementById('powerIndicator'),
    rapidIndicator: document.getElementById('rapidIndicator'),
    shieldIndicator: document.getElementById('shieldIndicator')
};

// ===============================================
// STAN GRY
// ===============================================
let game = {
    running: false,
    score: 0,
    nickname: '',
    wave: 1,
    lastTime: 0,
    lastEnemyShot: 0,
    animationId: null,
    movedDown: false,
    combo: 0,
    comboTimer: 0,
    playerDeathAnimation: false,
    deathAnimationTimer: 0,
    gameEnded: false
};

// ===============================================
// OBIEKTY GRY
// ===============================================
let player = { x: 375, y: 550, width: 50, height: 30, speed: 300, dx: 0 };
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let explosions = [];

// ===============================================
// WŁAŚCIWOŚCI GRY
// ===============================================
let bulletProps = { 
    width: 5, 
    height: 10, 
    speed: 700, 
    powerUp: false, 
    timer: 0,
    rapidFire: false,
    rapidTimer: 0,
    canShoot: true
};

let playerProps = {
    shield: false,
    shieldTimer: 0
};

let enemyProps = { 
    speed: 100, 
    shootInterval: 2500, 
    direction: 1 
};

// ===============================================
// OBSŁUGA WEJŚCIA
// ===============================================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Pojedynczy strzał na wciśnięcie spacji (nie trzymanie)
    if (e.code === 'Space' && game.running && bulletProps.canShoot && !game.playerDeathAnimation) {
        shootBullet();
        bulletProps.canShoot = false;
    }
    
    // Poddanie się klawiszem R
    if (e.code === 'KeyR' && game.running) {
        surrenderGame();
    }
    
    // Powrót do menu klawiszem ESC - działa w grze i w game over
    if (e.code === 'Escape') {
        if (game.running) {
            returnToMenu();
        } else if (elements.gameOver.style.display === 'flex') {
            returnToMenu();
        }
    }
    
    // Restart klawiszem Enter
    if (e.code === 'Enter' && elements.gameOver.style.display === 'flex') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    
    // Pozwalaj strzelać ponownie gdy spacja zostanie zwolniona
    if (e.code === 'Space') {
        bulletProps.canShoot = true;
    }
});

// ===============================================
// SYSTEM NAJLEPSZYCH WYNIKÓW Z LOCALSTORAGE
// ===============================================
let highScoresData = [];

/**
 * Ładuje najlepsze wyniki z localStorage
 */
function loadHighScores() {
    try {
        const stored = localStorage.getItem('spaceInvadersHighScores');
        if (stored) {
            highScoresData = JSON.parse(stored);
        } else {
            // Domyślne wyniki jeśli nie ma zapisanych
            highScoresData = [
                { nickname: "RobotDestroyer", score: 2500 },
                { nickname: "SpaceCommander", score: 2000 },
                { nickname: "WaveRider", score: 1500 },
                { nickname: "LaserMaster", score: 1000 }
            ];
            saveHighScoresToStorage();
        }
    } catch (e) {
        console.error('Błąd podczas ładowania wyników:', e);
        // Fallback do domyślnych wyników
        highScoresData = [
            { nickname: "RobotDestroyer", score: 2500 },
            { nickname: "SpaceCommander", score: 2000 },
            { nickname: "WaveRider", score: 1500 },
            { nickname: "LaserMaster", score: 1000 }
        ];
    }
}

/**
 * Zapisuje najlepsze wyniki do localStorage
 */
function saveHighScoresToStorage() {
    try {
        localStorage.setItem('spaceInvadersHighScores', JSON.stringify(highScoresData));
    } catch (e) {
        console.error('Błąd podczas zapisywania wyników:', e);
    }
}

/**
 * Zapisuje najlepszy wynik gracza
 * Sprawdza czy gracz już istnieje w tabeli i aktualizuje jego wynik jeśli jest lepszy
 */
function saveHighScore() {
    if (!game.nickname) game.nickname = 'Anonymous';
    
    const existing = highScoresData.findIndex(s => s.nickname === game.nickname);
    if (existing !== -1) {
        if (game.score <= highScoresData[existing].score) return;
        highScoresData.splice(existing, 1);
    }
    
    highScoresData.push({ 
        nickname: game.nickname, 
        score: game.score,
        timestamp: Date.now()
    });
    
    highScoresData.sort((a, b) => b.score - a.score);
    if (highScoresData.length > 10) highScoresData.length = 10;
    
    saveHighScoresToStorage();
    updateHighScores();
}

/**
 * Aktualizuje tabelę najlepszych wyników w interfejsie
 */
function updateHighScores() {
    elements.highScores.innerHTML = '<tr><th>Rank</th><th>Player</th><th>Score</th></tr>';
    highScoresData.forEach((entry, i) => {
        const row = elements.highScores.insertRow();
        row.innerHTML = `<td>${i + 1}</td><td>${entry.nickname}</td><td>${entry.score}</td>`;
    });
}

// ===============================================
// SYSTEM EKSPLOZJI
// ===============================================
/**
 * Tworzy efekt eksplozji z cząsteczkami
 * @param {number} x - pozycja X eksplozji
 * @param {number} y - pozycja Y eksplozji
 * @param {number} width - szerokość obiektu eksplodującego
 * @param {number} height - wysokość obiektu eksplodującego
 * @param {string} color - kolor eksplozji
 */
function createExplosion(x, y, width, height, color = 'orange') {
    const fragments = [];
    const fragmentSize = Math.max(2, Math.min(6, width / 8));
    const fragmentsPerRow = Math.ceil(width / fragmentSize);
    const fragmentsPerCol = Math.ceil(height / fragmentSize);
    
    for (let row = 0; row < fragmentsPerCol; row++) {
        for (let col = 0; col < fragmentsPerRow; col++) {
            fragments.push({
                x: x + col * fragmentSize,
                y: y + row * fragmentSize,
                width: Math.min(fragmentSize, width - col * fragmentSize),
                height: Math.min(fragmentSize, height - row * fragmentSize),
                vx: (Math.random() - 0.5) * 300 + (col - fragmentsPerRow/2) * 80,
                vy: (Math.random() - 0.5) * 300 + (row - fragmentsPerCol/2) * 80 - 150,
                life: 1.0,
                decay: Math.random() * 0.015 + 0.008,
                color: color
            });
        }
    }
    
    explosions.push({ fragments: fragments });
}

// ===============================================
// SYSTEM COMBO
// ===============================================
/**
 * Dodaje punkt do combo i nalicza bonus jeśli combo jest wystarczająco wysokie
 */
function addCombo() {
    game.combo++;
    game.comboTimer = 3.0;
    
    if (game.combo >= 3) {
        const bonus = game.combo * 10;
        game.score += bonus;
        elements.combo.textContent = `COMBO x${game.combo} (+${bonus})`;
        elements.combo.classList.add('combo-active');
        sounds.combo();
    } else {
        elements.combo.textContent = `Combo x${game.combo}`;
        elements.combo.classList.remove('combo-active');
    }
}

/**
 * Resetuje combo gracza
 */
function resetCombo() {
    game.combo = 0;
    elements.combo.textContent = '';
    elements.combo.classList.remove('combo-active');
}

// ===============================================
// PROGRESJA FAL
// ===============================================
/**
 * Zwiększa trudność gry po zakończeniu fali
 * Wrogowie stają się szybsi i częściej strzelają
 */
function increaseDifficulty() {
    game.wave++;
    enemyProps.speed = Math.min(400, enemyProps.speed + 30);
    enemyProps.shootInterval = Math.max(800, enemyProps.shootInterval - 200);
}

// ===============================================
// INICJALIZACJA GRY
// ===============================================
/**
 * Inicjalizuje nową grę - resetuje wszystkie obiekty i właściwości do stanu początkowego
 */
function initGame() {
    player = { x: 375, y: 550, width: 50, height: 30, speed: 300, dx: 0 };
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    explosions = [];
    game.score = 0;
    game.wave = 1;
    game.combo = 0;
    game.comboTimer = 0;
    game.playerDeathAnimation = false;
    game.deathAnimationTimer = 0;
    game.gameEnded = false;
    
    // Resetuj power-upy
    bulletProps = { 
        width: 5, height: 10, speed: 700, powerUp: false, timer: 0,
        rapidFire: false, rapidTimer: 0, canShoot: true
    };
    playerProps = { shield: false, shieldTimer: 0 };
    enemyProps = { speed: 100, shootInterval: 2500, direction: 1 };
    
    game.lastEnemyShot = 0;
    game.movedDown = false;
    elements.score.textContent = 'Score: 0';
    clearPowerUpIndicators();
    resetCombo();
    initEnemies();
}

/**
 * Czyści wszystkie wskaźniki power-upów
 */
function clearPowerUpIndicators() {
    elements.powerIndicator.classList.remove('active');
    elements.rapidIndicator.classList.remove('active');
    elements.shieldIndicator.classList.remove('active');
}

/**
 * Inicjalizuje formację wrogów na początku każdej fali
 */
function initEnemies() {
    enemies = [];
    // Tworzy formację wrogów
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
            enemies.push({
                x: col * 60 + 70,
                y: row * 50 + 50,
                width: 40,
                height: 30,
                alive: true,
                col, row,
                type: row === 0 ? 'boss' : row <= 2 ? 'fast' : 'normal'
            });
        }
    }
}

// ===============================================
// SYSTEM WALKI
// ===============================================
/**
 * Wystrzeliwuje pocisk z pozycji gracza
 * Jeśli aktywny jest rapid fire, dodaje dodatkowy pocisk z opóźnieniem
 */
function shootBullet() {
    // Sprawdzenie rapid fire
    if (bulletProps.rapidFire) {
        setTimeout(() => {
            if (bulletProps.rapidFire && game.running) {
                bullets.push({
                    x: player.x + player.width / 2 - bulletProps.width / 2,
                    y: player.y,
                    width: bulletProps.width,
                    height: bulletProps.height,
                    speed: bulletProps.speed
                });
                sounds.shoot();
            }
        }, 50);
    }
    
    bullets.push({
        x: player.x + player.width / 2 - bulletProps.width / 2,
        y: player.y,
        width: bulletProps.width,
        height: bulletProps.height,
        speed: bulletProps.speed
    });
    sounds.shoot();
}

/**
 * Wróg strzela inteligentnie w kierunku gracza
 * @param {Object} enemy - obiekt wroga który strzela
 */
function enemyShoot(enemy) {
    // System inteligentnego celowania
    const dx = (player.x + player.width/2) - (enemy.x + enemy.width/2);
    const dy = (player.y + player.height/2) - (enemy.y + enemy.height);
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    const speed = 350;
    const accuracy = enemy.type === 'boss' ? 0.8 : enemy.type === 'fast' ? 0.6 : 0.4;
    
    let targetX = dx / distance;
    let targetY = dy / distance;
    
    // Dodaje losowość bazującą na celności
    targetX += (Math.random() - 0.5) * (1 - accuracy);
    targetY += (Math.random() - 0.5) * (1 - accuracy);
    
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5, height: 10,
        speedX: speed * targetX,
        speedY: speed * targetY,
        type: enemy.type
    });
}

/**
 * Znajduje najniższego żywego wroga w danej kolumnie
 * @param {number} col - numer kolumny
 * @returns {Object|null} - najniższy wróg lub null
 */
function getLowestEnemyInColumn(col) {
    return enemies.filter(e => e.alive && e.col === col)
                  .reduce((lowest, enemy) => 
                      !lowest || enemy.row > lowest.row ? enemy : lowest, null);
}

/**
 * Sprawdza kolizję między dwoma obiektami prostokątnymi
 * @param {Object} a - pierwszy obiekt
 * @param {Object} b - drugi obiekt
 * @returns {boolean} - czy obiekty się zderzają
 */
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// ===============================================
// KONTROLA PRZEPŁYWU GRY
// ===============================================
/**
 * Poddaje grę - rozpoczyna animację śmierci gracza
 */
function surrenderGame() {
    startPlayerDeathAnimation();
}

/**
 * Rozpoczyna animację śmierci gracza - używane dla WSZYSTKICH typów śmierci
 * @param {string} reason - powód śmierci (bullet, collision, surrender, bottom)
 */
function startPlayerDeathAnimation(reason = 'bullet') {
    if (game.playerDeathAnimation || game.gameEnded) return; // Zapobiega wielokrotnemu wywołaniu
    
    game.running = false; // Zatrzymaj grę natychmiast
    game.gameEnded = true; // Oznacz grę jako zakończoną
    game.playerDeathAnimation = true;
    game.deathAnimationTimer = 1.5; // 1.5 sekundy animacji
    
    sounds.playerHit();
    createExplosion(player.x, player.y, player.width, player.height, 'white');
    
    // Natychmiast pokaż game over ale kontynuuj animację
    setTimeout(() => {
        showGameOver(false);
    }, 100); // Małe opóźnienie żeby animacja się rozpoczęła
}

/**
 * Pokazuje ekran końca gry
 * @param {boolean} isWin - czy gracz wygrał
 */
function showGameOver(isWin) {
    elements.finalScore.textContent = `Score: ${game.score} | Wave: ${game.wave}`;
    elements.gameOver.querySelector('h2').textContent = isWin ? 'Victory!' : 'Game Over';
    elements.gameOver.style.display = 'flex';
    saveHighScore();
}

/**
 * Powraca do menu głównego
 */
function returnToMenu() {
    game.running = false;
    game.playerDeathAnimation = false;
    game.gameEnded = false;
    cancelAnimationFrame(game.animationId);
    elements.gameOver.style.display = 'none';
    elements.gameContainer.classList.add('hidden');
    elements.startScreen.style.display = 'block';
    elements.nickname.value = '';
    updateHighScores();
}

/**
 * Rozpoczyna nową grę
 */
function startGame() {
    audioCtx.resume();
    game.nickname = elements.nickname.value.trim() || 'Anonymous';
    elements.startScreen.style.display = 'none';
    elements.gameContainer.classList.remove('hidden');
    initGame();
    game.running = true;
    game.lastTime = 0;
    requestAnimationFrame(gameLoop);
}

/**
 * Restartuje grę po końcu
 */
function restartGame() {
    elements.gameOver.style.display = 'none';
    initGame();
    game.running = true;
    game.lastTime = 0;
    requestAnimationFrame(gameLoop);
}

// ===============================================
// GŁÓWNA PĘTLA GRY
// ===============================================
/**
 * Aktualizuje stan gry w każdej klatce
 * @param {number} dt - czas delta między klatkami
 */
function update(dt) {
    // Zawsze kontynuuj animację śmierci gracza
    if (game.playerDeathAnimation) {
        game.deathAnimationTimer -= dt;
        if (game.deathAnimationTimer <= 0) {
            game.playerDeathAnimation = false;
            // Animacja zakończona, ale game over już jest pokazane
        }
    }

    // Jeśli gra nie działa, aktualizuj tylko eksplozje
    if (!game.running) {
        // Aktualizuj eksplozje nawet po zakończeniu gry
        explosions.forEach((explosion, expIndex) => {
            explosion.fragments.forEach((fragment, fragIndex) => {
                fragment.x += fragment.vx * dt;
                fragment.y += fragment.vy * dt;
                fragment.vy += 400 * dt; // grawitacja
                fragment.life -= fragment.decay;
                
                if (fragment.life <= 0) {
                    explosion.fragments.splice(fragIndex, 1);
                }
            });
            
            if (explosion.fragments.length === 0) {
                explosions.splice(expIndex, 1);
            }
        });
        return;
    }

    // Ruch gracza (tylko jeśli nie ma animacji śmierci)
    if (!game.playerDeathAnimation) {
        player.dx = keys.ArrowLeft ? -player.speed : keys.ArrowRight ? player.speed : 0;
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x + player.dx * dt));
    }

    // Aktualizuj pociski
    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed * dt;
        if (bullet.y < 0) bullets.splice(i, 1);
    });

    // Aktualizuj eksplozje
    explosions.forEach((explosion, expIndex) => {
        explosion.fragments.forEach((fragment, fragIndex) => {
            fragment.x += fragment.vx * dt;
            fragment.y += fragment.vy * dt;
            fragment.vy += 400 * dt; // grawitacja
            fragment.life -= fragment.decay;
            
            if (fragment.life <= 0) {
                explosion.fragments.splice(fragIndex, 1);
            }
        });
        
        if (explosion.fragments.length === 0) {
            explosions.splice(expIndex, 1);
        }
    });

    // Aktualizuj pociski wrogów
    enemyBullets.forEach((bullet, i) => {
        bullet.x += bullet.speedX * dt;
        bullet.y += bullet.speedY * dt;
        if (bullet.y > canvas.height || bullet.x < -50 || bullet.x > canvas.width + 50) {
            enemyBullets.splice(i, 1);
        }
        // Sprawdź kolizję z graczem
        if (!game.playerDeathAnimation && !game.gameEnded && checkCollision(bullet, player)) {
            enemyBullets.splice(i, 1);
            if (!playerProps.shield) {
                startPlayerDeathAnimation('bullet');
                return;
            }
        }
    });

    // Ruch wrogów
    let edge = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemyProps.speed * enemyProps.direction * dt;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) edge = true;
    });

    if (edge && !game.movedDown) {
        enemyProps.direction *= -1;
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += 30;
                // Sprawdź czy wrogowie dotarli do dna ekranu
                if (enemy.y + enemy.height >= canvas.height - 50) {
                    startPlayerDeathAnimation('bottom');
                    return;
                }
            }
        });
        game.movedDown = true;
    } else if (!edge) {
        game.movedDown = false;
    }

    // Sprawdź kolizję wróg-gracz
    if (!game.playerDeathAnimation && !game.gameEnded) {
        enemies.forEach(enemy => {
            if (enemy.alive && checkCollision(enemy, player)) {
                if (!playerProps.shield) {
                    startPlayerDeathAnimation('collision');
                    return;
                }
            }
        });
    }

    // Strzelanie wrogów
    const now = performance.now();
    if (now - game.lastEnemyShot >= enemyProps.shootInterval) {
        const aliveCols = [...new Set(enemies.filter(e => e.alive).map(e => e.col))];
        if (aliveCols.length > 0) {
            const randomCol = aliveCols[Math.floor(Math.random() * aliveCols.length)];
            const shooter = getLowestEnemyInColumn(randomCol);
            if (shooter) enemyShoot(shooter);
        }
        game.lastEnemyShot = now;
    }

    // Kolizje pocisk-wróg
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (!enemy.alive || !checkCollision(bullet, enemy)) return;
            
            enemy.alive = false;
            bullets.splice(bIndex, 1);
            
            // System punktacji
            let points = enemy.type === 'boss' ? 50 : enemy.type === 'fast' ? 20 : 10;
            game.score += points;
            elements.score.textContent = 'Score: ' + game.score;
            
            sounds.enemyHit();
            createExplosion(enemy.x, enemy.y, enemy.width, enemy.height);
            addCombo();

            // ZREDUKOWANE SZANSE NA POWER-UPY
            const dropChance = enemy.type === 'boss' ? 0.25 : enemy.type === 'fast' ? 0.08 : 0.03;
            if (Math.random() < dropChance) {
                const powerUpType = Math.random();
                let type = 'rapid';
                if (powerUpType < 0.35) type = 'power';
                else if (powerUpType < 0.65) type = 'shield';
                
                powerUps.push({ 
                    x: enemy.x, 
                    y: enemy.y, 
                    width: 25, 
                    height: 25, 
                    type: type 
                });
            }
        });
    });

    // Zbieranie power-upów
    powerUps.forEach((powerUp, i) => {
        powerUp.y += 200 * dt;
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
            return;
        }
        
        if (!game.playerDeathAnimation && !game.gameEnded && checkCollision(powerUp, player)) {
            powerUps.splice(i, 1);
            sounds.powerUp();
            
            switch(powerUp.type) {
                case 'power':
                    bulletProps.powerUp = true;
                    bulletProps.width = 15;
                    bulletProps.speed = 1000;
                    bulletProps.timer = 8;
                    elements.powerIndicator.classList.add('active');
                    break;
                case 'rapid':
                    bulletProps.rapidFire = true;
                    bulletProps.rapidTimer = 6;
                    elements.rapidIndicator.classList.add('active');
                    break;
                case 'shield':
                    playerProps.shield = true;
                    playerProps.shieldTimer = 5;
                    elements.shieldIndicator.classList.add('active');
                    break;
            }
        }
    });

    // Liczniki power-upów
    if (bulletProps.powerUp) {
        bulletProps.timer -= dt;
        if (bulletProps.timer <= 0) {
            bulletProps.powerUp = false;
            bulletProps.width = 5;
            bulletProps.speed = 700;
            elements.powerIndicator.classList.remove('active');
        }
    }

    if (bulletProps.rapidFire) {
        bulletProps.rapidTimer -= dt;
        if (bulletProps.rapidTimer <= 0) {
            bulletProps.rapidFire = false;
            elements.rapidIndicator.classList.remove('active');
        }
    }

    if (playerProps.shield) {
        playerProps.shieldTimer -= dt;
        if (playerProps.shieldTimer <= 0) {
            playerProps.shield = false;
            elements.shieldIndicator.classList.remove('active');
        }
    }

    // Licznik combo
    if (game.combo > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) {
            resetCombo();
        }
    }

    // Sprawdzenie zakończenia fali
    const aliveEnemies = enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0) {
        increaseDifficulty();
        initEnemies();
        game.score += 100 * game.wave;
        elements.score.textContent = 'Score: ' + game.score;
    }
}

// ===============================================
// SYSTEM RENDEROWANIA
// ===============================================
/**
 * Rysuje robota o zadanych parametrach
 * @param {number} x - pozycja X
 * @param {number} y - pozycja Y  
 * @param {number} width - szerokość
 * @param {number} height - wysokość
 * @param {string} color - kolor robota
 */
function drawRobot(x, y, width, height, color) {
    ctx.fillStyle = color;
    // Główne ciało
    ctx.fillRect(x + width * 0.2, y + height * 0.3, width * 0.6, height * 0.7);
    // Głowa
    ctx.fillRect(x + width * 0.3, y, width * 0.4, height * 0.4);
    // Ramiona
    ctx.fillRect(x, y + height * 0.4, width * 0.2, height * 0.3);
    ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.2, height * 0.3);
    // Oczy
    ctx.fillStyle = 'red';
    ctx.fillRect(x + width * 0.35, y + height * 0.1, width * 0.1, height * 0.1);
    ctx.fillRect(x + width * 0.55, y + height * 0.1, width * 0.1, height * 0.1);
}

/**
 * Rysuje statek kosmiczny gracza
 * @param {number} x - pozycja X
 * @param {number} y - pozycja Y
 * @param {number} width - szerokość  
 * @param {number} height - wysokość
 */
function drawSpaceship(x, y, width, height) {
    ctx.fillStyle = '#00aaff';
    // Główny kadłub
    ctx.beginPath();
    ctx.moveTo(x + width/2, y);
    ctx.lineTo(x + width * 0.8, y + height);
    ctx.lineTo(x + width * 0.2, y + height);
    ctx.closePath();
    ctx.fill();
    
    // Kokpit
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + width * 0.4, y + height * 0.2, width * 0.2, height * 0.3);
    
    // Silniki
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.1, height * 0.2);
    ctx.fillRect(x + width * 0.8, y + height * 0.8, width * 0.1, height * 0.2);
}

/**
 * Rysuje power-up w kształcie rombu
 * @param {number} x - pozycja X środka
 * @param {number} y - pozycja Y środka
 * @param {number} size - rozmiar rombu
 * @param {string} color - kolor power-upu
 */
function drawDiamond(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size/2);  // górny wierzchołek
    ctx.lineTo(x + size/2, y);  // prawy wierzchołek
    ctx.lineTo(x, y + size/2);  // dolny wierzchołek
    ctx.lineTo(x - size/2, y);  // lewy wierzchołek
    ctx.closePath();
    ctx.fill();
}

/**
 * Główna funkcja renderująca wszystkie elementy gry
 */
function draw() {
    // Wyczyść canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rysuj tło gwiazd
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 219 + performance.now() * 0.05) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }

    // Rysuj statek gracza (tylko jeśli nie ma animacji śmierci i gra się nie skończyła)
    if (!game.playerDeathAnimation && !game.gameEnded) {
        ctx.save();
        
        // Efekt tarczy
        if (playerProps.shield) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = performance.now() * 0.01;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        drawSpaceship(player.x, player.y, player.width, player.height);
        ctx.restore();
    }

    // Rysuj pociski z ulepszonymi efektami
    bullets.forEach(bullet => {
        if (bulletProps.powerUp) {
            ctx.fillStyle = 'yellow';
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    ctx.shadowBlur = 0;

    // Rysuj wrogów jako roboty
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        let color;
        switch(enemy.type) {
            case 'boss':
                color = '#8a2be2';
                break;
            case 'fast':
                color = '#ff6b35';
                break;
            default:
                color = '#ff4444';
        }
        drawRobot(enemy.x, enemy.y, enemy.width, enemy.height, color);
    });

    // Rysuj pociski wrogów
    enemyBullets.forEach(bullet => {
        switch(bullet.type) {
            case 'boss':
                ctx.fillStyle = '#8a2be2';
                break;
            case 'fast':
                ctx.fillStyle = '#ff6b35';
                break;
            default:
                ctx.fillStyle = '#ff4444';
        }
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Rysuj power-upy jako romby
    powerUps.forEach(powerUp => {
        const time = performance.now() / 200;
        const pulse = 1 + 0.3 * Math.sin(time);
        
        ctx.save();
        const centerX = powerUp.x + powerUp.width/2;
        const centerY = powerUp.y + powerUp.height/2;
        
        let color;
        switch(powerUp.type) {
            case 'power':
                color = '#ffff00';  // Żółty - Power Shot
                break;
            case 'rapid':
                color = '#00ff88';  // Zielony - Rapid Fire
                break;
            case 'shield':
                color = '#00ffff';  // Cyan - Shield
                break;
        }
        
        drawDiamond(centerX, centerY, powerUp.width * pulse, color);
        ctx.restore();
    });

    // Rysuj eksplozje
    explosions.forEach(explosion => {
        explosion.fragments.forEach(fragment => {
            let r, g, b;
            switch(fragment.color) {
                case 'white':
                    r = 255; g = 255; b = 255;
                    break;
                case 'purple':
                    r = 138; g = 43; b = 226;
                    break;
                default:
                    r = 255; g = Math.floor(100 + fragment.life * 155); b = 0;
            }
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fragment.life})`;
            ctx.fillRect(fragment.x, fragment.y, fragment.width, fragment.height);
        });
    });

    // Rysuj wskaźnik fali
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${game.wave}`, canvas.width/2, 30);
    ctx.textAlign = 'left';
}

/**
 * Główna pętla gry - wywołuje aktualizację i renderowanie
 * @param {number} timestamp - znacznik czasu klatki
 */
function gameLoop(timestamp) {
    if (!game.lastTime) game.lastTime = timestamp;
    const deltaTime = Math.max(0, Math.min(0.016, (timestamp - game.lastTime) / 1000));
    game.lastTime = timestamp;

    update(deltaTime);
    draw();
    
    // Kontynuuj pętlę jeśli gra działa LUB są eksplozje do wyrenderowania
    if (game.running || game.playerDeathAnimation || explosions.length > 0) {
        game.animationId = requestAnimationFrame(gameLoop);
    }
}

// ===============================================
// OBSŁUGA ZDARZEŃ
// ===============================================
document.getElementById('playButton').onclick = startGame;
document.getElementById('restartButton').onclick = restartGame;
document.getElementById('returnToMenuButton').onclick = returnToMenu;

// ===============================================
// INICJALIZACJA
// ===============================================
loadHighScores();
updateHighScores();