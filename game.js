// ==========================================
// WebBlox: 3D Roblox Style Sandbox & Obby
// Built with Three.js & HTML5 Web Audio API
// ==========================================

// --- SOUND SYNTHESIZER ---
class RobloxAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
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

    jump() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Classic Roblox "OOF" Sound Synthesizer
    oof() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    place() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    coin() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        [987.77, 1318.51].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0.2, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.12);
        });
    }
}

const audio = new RobloxAudio();

// --- SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 0.85);
sunLight.position.set(40, 80, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 200;
const d = 50;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// --- COLLIDERS & OBJECT REGISTRY ---
const platforms = []; // Array of { mesh, box, isLava, isCoin, isBounce, isGoal }
const userPlacedBlocks = [];

// Helper Box Creator
function createStudMaterial(colorHex, emissive = 0x000000) {
    return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.35,
        metalness: 0.1,
        emissive: emissive
    });
}

function addPlatform(x, y, z, w, h, d, colorHex, options = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = createStudMaterial(colorHex, options.isLava ? 0xff2200 : 0x000000);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    const platformData = {
        mesh,
        box,
        isLava: options.isLava || false,
        isCoin: options.isCoin || false,
        isBounce: options.isBounce || false,
        isGoal: options.isGoal || false,
        collected: false
    };
    platforms.push(platformData);
    return platformData;
}

// Build Spawn Baseplate
addPlatform(-30, -2, -30, 60, 2, 60, 0x27ae60);

// Add classic Roblox Stud Spawn point decal/platform
addPlatform(-4, 0.01, -4, 8, 0.2, 8, 0x95a5a6);

// --- OBBY COURSE CREATION ---
function buildObby() {
    // Stage 1: Floating stepping stones
    addPlatform(10, 1, -2, 4, 1, 4, 0x3498db);
    addPlatform(18, 2.5, -2, 4, 1, 4, 0x3498db);
    addPlatform(26, 4, -2, 4, 1, 4, 0x3498db);

    // Stage 2: Red Lava Obstacle Jumps (Don't touch red!)
    addPlatform(34, 4, -4, 14, 1, 8, 0xbdc3c7); // safe pad
    addPlatform(40, 5.05, -3, 2, 0.2, 6, 0xff0000, { isLava: true }); // Red Lava stripe

    // Stage 3: Bounce Pad & Stairway
    addPlatform(52, 4, -2, 5, 1, 5, 0xe67e22, { isBounce: true }); // Super Bounce Pad!

    // High Platform
    addPlatform(52, 14, -15, 6, 1, 6, 0x9b59b6);
    addPlatform(42, 16, -20, 5, 1, 5, 0x9b59b6);
    addPlatform(30, 18, -20, 5, 1, 5, 0x9b59b6);
    addPlatform(15, 20, -20, 6, 1, 6, 0xf1c40f, { isGoal: true }); // Golden Victory Platform

    // Add Rotating BloxCoins along the obstacle
    createCoin(12, 3.5, 0);
    createCoin(28, 6.5, 0);
    createCoin(54, 16.5, -12);
    createCoin(18, 23.0, -17);
}

const coinsList = [];
function createCoin(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x665500
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(x, y, z);
    coin.castShadow = true;
    scene.add(coin);

    const platformData = {
        mesh: coin,
        box: new THREE.Box3().setFromObject(coin),
        isCoin: true,
        collected: false
    };
    platforms.push(platformData);
    coinsList.push(coin);
}

buildObby();

// --- ROBLOX CHARACTER MODEL (Classic Blocky Avatar) ---
const character = new THREE.Group();

// Torso (Blue)
const torsoGeo = new THREE.BoxGeometry(1.6, 1.8, 0.9);
const torsoMat = createStudMaterial(0x0078d7);
const torso = new THREE.Mesh(torsoGeo, torsoMat);
torso.position.y = 1.8;
torso.castShadow = true;
character.add(torso);

// Head (Yellow) with Face
const headGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
const headMat = createStudMaterial(0xf4d03f);
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 3.25;
head.castShadow = true;
character.add(head);

// Classic Roblox Face (Eyes & Smile)
const canvasFace = document.createElement('canvas');
canvasFace.width = 128;
canvasFace.height = 128;
const fctx = canvasFace.getContext('2d');
fctx.fillStyle = '#f4d03f';
fctx.fillRect(0, 0, 128, 128);
fctx.fillStyle = '#111';
// Eyes
fctx.beginPath();
fctx.arc(38, 48, 8, 0, Math.PI * 2);
fctx.arc(90, 48, 8, 0, Math.PI * 2);
fctx.fill();
// Smile
fctx.beginPath();
fctx.lineWidth = 6;
fctx.strokeStyle = '#111';
fctx.arc(64, 68, 28, 0.2 * Math.PI, 0.8 * Math.PI);
fctx.stroke();

const faceTexture = new THREE.CanvasTexture(canvasFace);
const facePlaneGeo = new THREE.PlaneGeometry(0.85, 0.85);
const facePlaneMat = new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true });
const faceMesh = new THREE.Mesh(facePlaneGeo, facePlaneMat);
faceMesh.position.set(0, 3.25, 0.56);
character.add(faceMesh);

// Limbs: Left Arm, Right Arm, Left Leg, Right Leg
const limbMat = createStudMaterial(0xf4d03f);
const pantsMat = createStudMaterial(0x27ae60);

// Left Arm
const armGeo = new THREE.BoxGeometry(0.7, 1.8, 0.8);
const leftArm = new THREE.Mesh(armGeo, limbMat);
leftArm.position.set(-1.25, 1.8, 0);
leftArm.castShadow = true;
character.add(leftArm);

// Right Arm
const rightArm = new THREE.Mesh(armGeo, limbMat);
rightArm.position.set(1.25, 1.8, 0);
rightArm.castShadow = true;
character.add(rightArm);

// Left Leg
const legGeo = new THREE.BoxGeometry(0.75, 1.7, 0.8);
const leftLeg = new THREE.Mesh(legGeo, pantsMat);
leftLeg.position.set(-0.42, 0.85, 0);
leftLeg.castShadow = true;
character.add(leftLeg);

// Right Leg
const rightLeg = new THREE.Mesh(legGeo, pantsMat);
rightLeg.position.set(0.42, 0.85, 0);
rightLeg.castShadow = true;
character.add(rightLeg);

scene.add(character);

// Spawn position
const SPAWN_POINT = new THREE.Vector3(0, 3, 0);
character.position.copy(SPAWN_POINT);

// --- CHARACTER PHYSICS & MOVEMENT ---
const playerVelocity = new THREE.Vector3();
let isGrounded = false;
let moveSpeed = 0.22;
let sprintMultiplier = 1;
let coins = 0;

// Camera Orbit Controls (Roblox style 3rd person)
let cameraDistance = 9;
let cameraYaw = 0;
let cameraPitch = 0.35;
let isRightMouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;

// Keys State
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false
};

// Selected Color for building blocks
let selectedColorHex = 0xe74c3c;

// --- INPUT LISTENERS ---
window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = true;
    if (k === 'a') keys.a = true;
    if (k === 's') keys.s = true;
    if (k === 'd') keys.d = true;
    if (e.code === 'Space') {
        keys.space = true;
        if (isGrounded) {
            playerVelocity.y = 0.32;
            isGrounded = false;
            audio.jump();
        }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keys.shift = true;
    }

    // Number keys 1-7 for hotbar
    if (['1','2','3','4','5','6','7'].includes(e.key)) {
        const slot = document.querySelector(`.slot[data-key="${e.key}"]`);
        if (slot) selectSlot(slot);
    }

    // Delete targeted block with Q or Delete key
    if (k === 'q' || e.key === 'Delete') {
        removeTargetedBlock();
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = false;
    if (k === 'a') keys.a = false;
    if (k === 's') keys.s = false;
    if (k === 'd') keys.d = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
});

// Camera Mouse Orbit
window.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
        isRightMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    } else if (e.button === 0 && e.target === renderer.domElement) { // Left click: build
        placeBlock();
    }
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mouseup', (e) => {
    if (e.button === 2) isRightMouseDown = false;
});

window.addEventListener('mousemove', (e) => {
    if (isRightMouseDown) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        cameraYaw -= dx * 0.005;
        cameraPitch += dy * 0.005;
        cameraPitch = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraPitch));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    }
});

window.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(3.5, Math.min(22, cameraDistance));
});

// Hotbar selection UI
const hotbarSlots = document.querySelectorAll('.hotbar .slot');
function selectSlot(slot) {
    hotbarSlots.forEach(s => s.classList.remove('active'));
    slot.classList.add('active');
    selectedColorHex = parseInt(slot.getAttribute('data-color'), 16);
}
hotbarSlots.forEach(slot => {
    slot.addEventListener('click', () => selectSlot(slot));
});

// Sound Toggle
const soundBtn = document.getElementById('soundToggle');
soundBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    soundBtn.innerText = audio.muted ? '🔇 Muted' : '🔊 Sound';
});

// Reset Button
const respawnBtn = document.getElementById('respawnBtn');
respawnBtn.addEventListener('click', respawnPlayer);

// Chat helper
const chatMessages = document.getElementById('chatMessages');
function addChatMessage(text, type = '') {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerText = text;
    chatMessages.appendChild(div);
    if (chatMessages.children.length > 5) {
        chatMessages.removeChild(chatMessages.children[0]);
    }
}

// Raycaster for block placement & deletion
const raycaster = new THREE.Raycaster();
const mouseCenter = new THREE.Vector2(0, 0);

function getClickIntersection() {
    raycaster.setFromCamera(mouseCenter, camera);
    const targetObjects = platforms.map(p => p.mesh);
    const intersects = raycaster.intersectObjects(targetObjects);
    return intersects.length > 0 ? intersects[0] : null;
}

function placeBlock() {
    const hit = getClickIntersection();
    if (!hit) return;

    // Grid snap on normal position
    const normal = hit.face.normal;
    const targetPos = hit.point.clone().add(normal.clone().multiplyScalar(1.0));
    const snapX = Math.round(targetPos.x / 2) * 2;
    const snapY = Math.max(1, Math.round(targetPos.y / 2) * 2);
    const snapZ = Math.round(targetPos.z / 2) * 2;

    const block = addPlatform(snapX - 1, snapY - 1, snapZ - 1, 2, 2, 2, selectedColorHex);
    userPlacedBlocks.push(block);
    audio.place();
    addChatMessage(`Placed block at (${snapX}, ${snapY}, ${snapZ})`);
}

function removeTargetedBlock() {
    const hit = getClickIntersection();
    if (!hit) return;

    // Check if the hit mesh is a user-placed block
    const index = userPlacedBlocks.findIndex(b => b.mesh === hit.object);
    if (index !== -1) {
        const block = userPlacedBlocks[index];
        scene.remove(block.mesh);
        platforms.splice(platforms.indexOf(block), 1);
        userPlacedBlocks.splice(index, 1);
        audio.place();
        addChatMessage('Block deleted!');
    } else {
        addChatMessage('Cannot remove base world obstacles!', 'danger');
    }
}

// Player Respawn
function respawnPlayer(fellInLava = false) {
    audio.oof();
    character.position.copy(SPAWN_POINT);
    playerVelocity.set(0, 0, 0);
    if (fellInLava) {
        addChatMessage('OOF! You touched lava or fell off!', 'danger');
    } else {
        addChatMessage('Character Reset.');
    }
}

// Banner Announcement
const banner = document.getElementById('banner');
const bannerTitle = document.getElementById('bannerTitle');
const bannerDesc = document.getElementById('bannerDesc');
function showBanner(title, desc) {
    bannerTitle.innerText = title;
    bannerDesc.innerText = desc;
    banner.classList.remove('hidden');
    setTimeout(() => {
        banner.classList.add('hidden');
    }, 3500);
}

// --- ANIMATION / MAIN LOOP ---
let walkCycle = 0;
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Rotate Coins
    coinsList.forEach(c => {
        c.rotation.z += 0.03;
    });

    // Calculate movement direction relative to camera angle
    sprintMultiplier = keys.shift ? 1.6 : 1.0;
    const currentSpeed = moveSpeed * sprintMultiplier;

    let moveX = 0;
    let moveZ = 0;

    if (keys.w) moveZ -= 1;
    if (keys.s) moveZ += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;

    const isMoving = (moveX !== 0 || moveZ !== 0);

    if (isMoving) {
        const moveVec = new THREE.Vector2(moveX, moveZ).normalize();
        const angle = cameraYaw;
        const forwardX = -Math.sin(angle);
        const forwardZ = -Math.cos(angle);
        const rightX = Math.cos(angle);
        const rightZ = -Math.sin(angle);

        const worldMoveX = (forwardX * -moveVec.y + rightX * moveVec.x) * currentSpeed;
        const worldMoveZ = (forwardZ * -moveVec.y + rightZ * moveVec.x) * currentSpeed;

        character.position.x += worldMoveX;
        character.position.z += worldMoveZ;

        // Smooth character rotation towards movement direction
        const targetRot = Math.atan2(worldMoveX, worldMoveZ);
        character.rotation.y = targetRot;

        // Limbs walk animation swing
        walkCycle += 0.22 * sprintMultiplier;
        const swing = Math.sin(walkCycle) * 0.6;
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftArm.rotation.x = -swing;
        rightArm.rotation.x = swing;
    } else {
        // Return limbs to idle
        leftLeg.rotation.x *= 0.85;
        rightLeg.rotation.x *= 0.85;
        leftArm.rotation.x *= 0.85;
        rightArm.rotation.x *= 0.85;
    }

    // Apply Gravity
    playerVelocity.y -= 0.016; // gravity
    character.position.y += playerVelocity.y;

    // Player Bounding Box
    const playerBox = new THREE.Box3();
    const pSize = new THREE.Vector3(1.2, 3.4, 1.0);
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(character.position.x, character.position.y + 1.7, character.position.z),
        pSize
    );

    // Platform Collisions
    isGrounded = false;

    for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];
        if (plat.collected) continue;

        // Refresh dynamic bounding box if needed
        plat.box.setFromObject(plat.mesh);

        if (playerBox.intersectsBox(plat.box)) {
            // Coin Pickup
            if (plat.isCoin) {
                plat.collected = true;
                scene.remove(plat.mesh);
                coins += 10;
                document.getElementById('coinsCount').innerText = coins;
                audio.coin();
                addChatMessage('+10 BloxCoins!', 'success');
                continue;
            }

            // Lava Detection
            if (plat.isLava) {
                respawnPlayer(true);
                return;
            }

            // Victory Goal Platform
            if (plat.isGoal) {
                showBanner('🏆 OBBY COMPLETE!', 'Incredible jumping skills! +50 BloxCoins');
                coins += 50;
                document.getElementById('coinsCount').innerText = coins;
                audio.coin();
                respawnPlayer();
                return;
            }

            // Bounce Pad
            if (plat.isBounce) {
                playerVelocity.y = 0.65; // Super spring launch
                audio.jump();
                addChatMessage('BOING! Super Bounce Pad!', 'success');
                continue;
            }

            // Normal Platform Stand
            const playerFeetY = character.position.y;
            const platformTopY = plat.box.max.y;

            if (playerVelocity.y <= 0 && playerFeetY >= platformTopY - 0.7) {
                character.position.y = platformTopY;
                playerVelocity.y = 0;
                isGrounded = true;
            }
        }
    }

    // Void fall-off check
    if (character.position.y < -30) {
        respawnPlayer(true);
    }

    // Camera follow (3rd person orbit)
    const targetLook = new THREE.Vector3(character.position.x, character.position.y + 2.5, character.position.z);
    const camX = targetLook.x + cameraDistance * Math.sin(cameraYaw) * Math.cos(cameraPitch);
    const camY = targetLook.y + cameraDistance * Math.sin(cameraPitch);
    const camZ = targetLook.z + cameraDistance * Math.cos(cameraYaw) * Math.cos(cameraPitch);

    camera.position.set(camX, camY, camZ);
    camera.lookAt(targetLook);

    renderer.render(scene, camera);
}

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();

