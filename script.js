// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const hiScoreElement = document.getElementById('hiScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const soundToggle = document.getElementById('soundToggle');

// Sound state
let soundMuted = false;

soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    soundMuted = !soundMuted;
    soundToggle.innerText = soundMuted ? '🔇' : '🔊';
});

// Web Audio API Synthesizer (Zero external dependencies)
class SoundEffects {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playJump() {
        if (soundMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playScoreMilestone() {
        if (soundMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        [523.25, 659.25].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);

            gain.gain.setValueAtTime(0.12, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.1);
        });
    }

    playHit() {
        if (soundMuted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(35, this.ctx.currentTime + 0.28);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.28);
    }
}

const sounds = new SoundEffects();

// Game Physics & Constants
const GROUND_Y = 200;
let gameSpeed = 6;
let score = 0;
let highScore = localStorage.getItem('dino_hi_score') || 0;
let isGameOver = false;
let animationFrameId;
let obstacleTimer = 0;
let nextObstacleInterval = 80;
let isNight = false;

hiScoreElement.innerText = `HI ${String(highScore).padStart(5, '0')}`;

function getDinoColor() {
    return isNight ? '#d0d0d0' : '#535353';
}

// Dino Object
const dino = {
    x: 50,
    y: GROUND_Y - 45,
    normalWidth: 44,
    normalHeight: 45,
    duckWidth: 55,
    duckHeight: 26,
    width: 44,
    height: 45,
    vy: 0,
    gravity: 0.75,
    jumpStrength: -13.5,
    isGrounded: true,
    isDucking: false,
    legFrame: 0,
    legTimer: 0,

    jump() {
        if (this.isGrounded && !this.isDucking && !isGameOver) {
            this.vy = this.jumpStrength;
            this.isGrounded = false;
            sounds.playJump();
        }
    },

    duck(enable) {
        if (!this.isGrounded) {
            // Fast fall if pressing down in mid-air
            if (enable) this.vy += 2.0;
            return;
        }

        this.isDucking = enable;
        if (enable) {
            this.width = this.duckWidth;
            this.height = this.duckHeight;
            this.y = GROUND_Y - this.height;
        } else {
            this.width = this.normalWidth;
            this.height = this.normalHeight;
            this.y = GROUND_Y - this.height;
        }
    },

    update() {
        this.vy += this.gravity;
        this.y += this.vy;

        const currentFloor = GROUND_Y - this.height;
        if (this.y >= currentFloor) {
            this.y = currentFloor;
            this.vy = 0;
            this.isGrounded = true;
        }

        // Running animation
        if (this.isGrounded) {
            this.legTimer++;
            if (this.legTimer > 5) {
                this.legFrame = (this.legFrame + 1) % 2;
                this.legTimer = 0;
            }
        }
    },

    draw() {
        ctx.fillStyle = getDinoColor();
        const { x, y } = this;

        if (this.isDucking) {
            // Ducking Dino Sprite
            ctx.fillRect(x, y + 10, 36, 12);       // Low body
            ctx.fillRect(x + 30, y + 6, 25, 14);   // Stretched head/snout
            ctx.fillRect(x + 48, y + 4, 7, 7);     // Snout tip

            // Eye
            ctx.fillStyle = isNight ? '#202124' : '#fff';
            ctx.fillRect(x + 45, y + 7, 3, 3);

            // Ducking legs
            ctx.fillStyle = getDinoColor();
            if (this.legFrame === 0) {
                ctx.fillRect(x + 12, y + 20, 5, 6);
                ctx.fillRect(x + 24, y + 20, 5, 4);
            } else {
                ctx.fillRect(x + 12, y + 20, 5, 4);
                ctx.fillRect(x + 24, y + 20, 5, 6);
            }
        } else {
            // Normal Standing Dino Sprite
            ctx.fillRect(x + 16, y + 4, 18, 20);  // Head & neck
            ctx.fillRect(x + 24, y, 14, 14);      // Snout
            ctx.fillRect(x + 10, y + 16, 20, 20); // Torso
            ctx.fillRect(x + 2, y + 20, 10, 12);  // Tail

            // Eye
            ctx.fillStyle = isNight ? '#202124' : '#fff';
            ctx.fillRect(x + 26, y + 3, 3, 3);

            // Arms
            ctx.fillStyle = getDinoColor();
            ctx.fillRect(x + 28, y + 22, 6, 3);

            // Legs
            if (this.isGrounded) {
                if (this.legFrame === 0) {
                    ctx.fillRect(x + 14, y + 36, 4, 9);
                    ctx.fillRect(x + 22, y + 36, 4, 6);
                } else {
                    ctx.fillRect(x + 14, y + 36, 4, 6);
                    ctx.fillRect(x + 22, y + 36, 4, 9);
                }
            } else {
                ctx.fillRect(x + 14, y + 36, 4, 6);
                ctx.fillRect(x + 22, y + 36, 4, 6);
            }
        }
    }
};

// Obstacles
let obstacles = [];

class Cactus {
    constructor() {
        this.type = 'cactus';
        this.width = Math.random() > 0.5 ? 24 : 16;
        this.height = Math.floor(Math.random() * 15) + 35;
        this.x = canvas.width + 10;
        this.y = GROUND_Y - this.height;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        ctx.fillStyle = getDinoColor();
        ctx.fillRect(this.x + 4, this.y, this.width - 8, this.height);
        if (this.width > 20) {
            ctx.fillRect(this.x, this.y + 10, 5, 12);
            ctx.fillRect(this.x, this.y + 10, 10, 4);
            ctx.fillRect(this.x + this.width - 5, this.y + 16, 5, 12);
            ctx.fillRect(this.x + this.width - 10, this.y + 16, 10, 4);
        } else {
            ctx.fillRect(this.x, this.y + 8, 4, 10);
            ctx.fillRect(this.x, this.y + 8, 8, 3);
        }
    }
}

class Pterodactyl {
    constructor() {
        this.type = 'pterodactyl';
        this.width = 40;
        this.height = 28;
        this.x = canvas.width + 10;
        const heights = [GROUND_Y - 32, GROUND_Y - 58];
        this.y = heights[Math.floor(Math.random() * heights.length)];
        this.wingFrame = 0;
        this.wingTimer = 0;
    }

    update() {
        this.x -= gameSpeed + 1.2;
        this.wingTimer++;
        if (this.wingTimer > 10) {
            this.wingFrame = (this.wingFrame + 1) % 2;
            this.wingTimer = 0;
        }
    }

    draw() {
        ctx.fillStyle = getDinoColor();
        const { x, y } = this;
        ctx.fillRect(x + 10, y + 10, 22, 9);
        ctx.fillRect(x, y + 11, 12, 5);

        if (this.wingFrame === 0) {
            ctx.fillRect(x + 18, y, 6, 12);
            ctx.fillRect(x + 22, y + 2, 5, 8);
        } else {
            ctx.fillRect(x + 18, y + 15, 6, 12);
            ctx.fillRect(x + 22, y + 13, 5, 8);
        }
    }
}

// Clouds
let clouds = [
    { x: 200, y: 50, speed: 0.8 },
    { x: 550, y: 35, speed: 0.6 },
    { x: 720, y: 70, speed: 0.7 }
];

function updateClouds() {
    ctx.fillStyle = isNight ? '#444' : '#dcdcdc';
    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -60) c.x = canvas.width + 50;

        ctx.fillRect(c.x, c.y, 40, 12);
        ctx.fillRect(c.x + 8, c.y - 7, 24, 7);
    });
}

// Ground bump lines
let groundBumps = [
    { x: 50 }, { x: 180 }, { x: 340 }, { x: 520 }, { x: 680 }
];

function drawGround() {
    ctx.strokeStyle = getDinoColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = isNight ? '#555' : '#757575';
    groundBumps.forEach(b => {
        b.x -= gameSpeed;
        if (b.x < -20) b.x = canvas.width + Math.random() * 50;
        ctx.fillRect(b.x, GROUND_Y + 5, 10, 2);
        ctx.fillRect(b.x + 15, GROUND_Y + 9, 6, 2);
    });
}

// Collision Detection
function checkCollision(r1, r2) {
    const pad = 4;
    return (
        r1.x + pad < r2.x + r2.width - pad &&
        r1.x + r1.width - pad > r2.x + pad &&
        r1.y + pad < r2.y + r2.height - pad &&
        r1.y + r1.height - pad > r2.y + pad
    );
}

function handleGameOver() {
    isGameOver = true;
    sounds.playHit();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dino_hi_score', highScore);
        hiScoreElement.innerText = `HI ${String(highScore).padStart(5, '0')}`;
    }

    finalScoreElement.innerText = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    obstacles = [];
    score = 0;
    gameSpeed = 6;
    isGameOver = false;
    dino.duck(false);
    dino.y = GROUND_Y - dino.height;
    dino.vy = 0;
    dino.isGrounded = true;
    gameOverScreen.classList.add('hidden');
    animate();
}

// Main Game Loop
function animate() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Day/Night cycle every 500 score points
    const shouldBeNight = Math.floor(score / 500) % 2 === 1;
    if (shouldBeNight !== isNight) {
        isNight = shouldBeNight;
        document.body.classList.toggle('night-mode', isNight);
    }

    updateClouds();
    drawGround();

    // Dino
    dino.update();
    dino.draw();

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= nextObstacleInterval) {
        if (score > 250 && Math.random() > 0.65) {
            obstacles.push(new Pterodactyl());
        } else {
            obstacles.push(new Cactus());
        }
        obstacleTimer = 0;
        nextObstacleInterval = Math.floor(Math.random() * 45) + 60;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update();
        obs.draw();

        if (checkCollision(dino, obs)) {
            handleGameOver();
            return;
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // Score & Speed scaling
    score++;
    scoreElement.innerText = String(score).padStart(5, '0');

    // Chime every 100 points
    if (score % 100 === 0 && score > 0) {
        sounds.playScoreMilestone();
    }

    // Gradually speed up
    if (score % 200 === 0 && gameSpeed < 13.5) {
        gameSpeed += 0.35;
    }

    animationFrameId = requestAnimationFrame(animate);
}

// Key & Touch Listeners
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isGameOver) {
            resetGame();
        } else {
            dino.jump();
        }
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (!isGameOver) {
            dino.duck(true);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
        dino.duck(false);
    }
});

canvas.addEventListener('pointerdown', (e) => {
    if (isGameOver) {
        resetGame();
    } else {
        dino.jump();
    }
});

restartBtn.addEventListener('click', () => {
    resetGame();
});

// Start loop
animate();
