// Three.js 3D Scene Setup
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0f1722);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Factory Building (main structure)
const buildingGeometry = new THREE.BoxGeometry(8, 6, 6);
const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.3, roughness: 0.7 });
const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
building.position.y = 3;
building.castShadow = true;
building.receiveShadow = true;
scene.add(building);

// Roof
const roofGeometry = new THREE.ConeGeometry(6, 2, 4);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.4 });
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(0, 8, 0);
roof.castShadow = true;
roof.receiveShadow = true;
scene.add(roof);

// Assembly Line (conveyor)
const conveyorGeometry = new THREE.BoxGeometry(6, 0.3, 2);
const conveyorMaterial = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 });
const conveyor = new THREE.Mesh(conveyorGeometry, conveyorMaterial);
conveyor.position.set(-2, 2, 0);
conveyor.castShadow = true;
conveyor.receiveShadow = true;
scene.add(conveyor);

// Create mini bikes (particles in production)
const bikes = [];
function createBike(x, y, z) {
    const bikeGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
    const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2 });
    const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
    bike.position.set(x, y, z);
    bike.castShadow = true;
    bike.receiveShadow = true;
    bike.velocity = { x: 0, y: 0, z: 0 };
    scene.add(bike);
    return bike;
}

// Game State
const gameState = {
    money: 0,
    income: 0,
    totalBikes: 0,
    totalRevenue: 0,
    bestDay: 0,
    currentProduction: 0,
    maxProduction: 100,
    bikeValue: 50,
    autoAssemble: false,
    stations: {
        1: { level: 1, income: 50, cost: 400 },
        2: { level: 0, income: 30, cost: 800 },
        3: { level: 0, income: 20, cost: 1500 }
    },
    upgrades: {
        tools: 0,
        speed: 0,
        workers: 0
    }
};

// UI Elements
const elements = {
    money: document.getElementById('money'),
    income: document.getElementById('income'),
    bikeValue: document.getElementById('bikeValue'),
    autoCost: document.getElementById('autoCost'),
    bikeCounter: document.getElementById('bikeCounter'),
    progressFill: document.getElementById('progressFill'),
    totalBikes: document.getElementById('totalBikes'),
    totalRevenue: document.getElementById('totalRevenue'),
    bestDay: document.getElementById('bestDay'),
    assembleBtn: document.getElementById('assembleBtn'),
    autoAssembleBtn: document.getElementById('autoAssembleBtn'),
    loadingScreen: document.getElementById('loadingScreen')
};

function formatMoney(value) {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
    return '$' + Math.floor(value);
}

function updateIncome() {
    let total = 0;
    Object.values(gameState.stations).forEach(station => {
        total += station.level * station.income;
    });
    gameState.income = total;
}

function addBike(count = 1) {
    for (let i = 0; i < count; i++) {
        gameState.currentProduction += gameState.bikeValue;
        gameState.totalBikes += 1;
        gameState.totalRevenue += gameState.bikeValue;
        gameState.money += gameState.bikeValue;
        gameState.bestDay = Math.max(gameState.bestDay, gameState.totalRevenue);

        // Create visual bike
        const bikeX = (Math.random() - 0.5) * 4;
        const bikeZ = (Math.random() - 0.5) * 2;
        const bike = createBike(bikeX, 2.2, bikeZ);
        bikes.push(bike);

        // Remove bike after animation
        setTimeout(() => {
            scene.remove(bike);
            bikes.splice(bikes.indexOf(bike), 1);
        }, 2000);
    }
    updateUI();
}

function assembleManual() {
    addBike(1);
}

function toggleAutoAssemble() {
    const cost = 200 + (gameState.autoAssemble ? 0 : 0);
    if (gameState.money < cost && !gameState.autoAssemble) return;
    
    if (!gameState.autoAssemble) {
        gameState.money -= cost;
        gameState.autoAssemble = true;
        elements.autoAssembleBtn.textContent = 'Auto Assemble (Active)';
        elements.autoAssembleBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
        gameState.autoAssemble = false;
        elements.autoAssembleBtn.textContent = 'Auto Assemble';
        elements.autoAssembleBtn.style.background = 'rgba(79, 70, 229, 0.2)';
    }
    updateUI();
}

function upgradeStation(stationNum) {
    const station = gameState.stations[stationNum];
    if (gameState.money < station.cost) return;

    gameState.money -= station.cost;
    station.level += 1;
    station.cost = Math.floor(station.cost * 1.5);
    updateIncome();
    updateUI();
}

function upgradeItem(upgradeType) {
    const costs = { tools: 150, speed: 300, workers: 500 };
    const cost = costs[upgradeType];
    if (gameState.money < cost) return;

    gameState.money -= cost;
    gameState.upgrades[upgradeType] += 1;
    
    // Apply upgrade effects
    if (upgradeType === 'tools') gameState.bikeValue *= 1.2;
    if (upgradeType === 'speed') gameState.maxProduction *= 1.3;
    if (upgradeType === 'workers') gameState.income *= 1.15;
    
    updateIncome();
    updateUI();
}

function updateUI() {
    elements.money.textContent = formatMoney(gameState.money);
    elements.income.textContent = formatMoney(gameState.income) + '/s';
    elements.bikeValue.textContent = Math.floor(gameState.bikeValue);
    elements.bikeCounter.textContent = gameState.totalBikes;
    elements.totalBikes.textContent = gameState.totalBikes;
    elements.totalRevenue.textContent = formatMoney(gameState.totalRevenue);
    elements.bestDay.textContent = formatMoney(gameState.bestDay);
    
    // Update progress bar
    const progress = (gameState.currentProduction / gameState.maxProduction) * 100;
    elements.progressFill.style.width = Math.min(progress, 100) + '%';

    // Update station UI
    for (let i = 1; i <= 3; i++) {
        const station = gameState.stations[i];
        document.getElementById(`stationLevel${i}`).textContent = station.level;
        document.getElementById(`stationIncome${i}`).textContent = station.level * (i === 1 ? 50 : i === 2 ? 30 : 20);
        document.getElementById(`stationCost${i}`).textContent = station.cost;
    }

    // Check achievements
    if (gameState.totalBikes >= 1) document.getElementById('ach1').classList.add('unlocked');
    if (gameState.totalBikes >= 50) document.getElementById('ach2').classList.add('unlocked');
    if (gameState.totalBikes >= 500) document.getElementById('ach3').classList.add('unlocked');
    if (gameState.money >= 1000000) document.getElementById('ach4').classList.add('unlocked');
}

// Event Listeners
elements.assembleBtn.addEventListener('click', assembleManual);
elements.autoAssembleBtn.addEventListener('click', toggleAutoAssemble);

document.querySelectorAll('.upgrade-station').forEach(btn => {
    btn.addEventListener('click', () => upgradeStation(parseInt(btn.dataset.station)));
});

document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => upgradeItem(btn.dataset.upgrade));
});

// Game Loop
let lastAutoAssembleTime = 0;
function gameLoop() {
    const now = Date.now();

    // Passive income
    gameState.money += gameState.income / 60; // 60 FPS
    gameState.totalRevenue += gameState.income / 60;
    gameState.bestDay = Math.max(gameState.bestDay, gameState.totalRevenue);

    // Auto assemble
    if (gameState.autoAssemble && now - lastAutoAssembleTime > 1000) {
        addBike(1);
        lastAutoAssembleTime = now;
    }

    // Animate bikes
    bikes.forEach((bike, index) => {
        bike.position.x += 0.02;
        bike.position.y -= 0.01;
        bike.rotation.z += 0.1;
    });

    // Animate conveyor
    conveyor.position.x += 0.02;
    if (conveyor.position.x > 4) conveyor.position.x = -4;

    // Rotate factory for visual effect
    building.rotation.y += 0.0005;

    updateUI();
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loading screen and start game
window.addEventListener('load', () => {
    setTimeout(() => {
        elements.loadingScreen.classList.add('hide');
        gameLoop();
    }, 800);
});

updateIncome();
updateUI();
