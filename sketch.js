let video, faceMesh, faces = [], modelLoaded = false;
let currentScene = 0, bruises = [], worldX = 0, worldY = 0, velX = 0, velY = 0; 

const StageOrder = ['Fresh', 'Middle', 'Healing', 'Fading'];
const ColorGroups = {
  'Fresh': { colors: [[230, 20, 30], [255, 40, 50]], sensitivity: 1.2, label: "최초의 외압", sublimatable: false }, 
  'Middle': { colors: [[90, 40, 220], [120, 60, 255]], sensitivity: 0.9, label: "욱신거리는 응어리", sublimatable: false }, 
  'Healing': { colors: [[60, 255, 100], [100, 255, 130]], sensitivity: 0.4, label: "무뎌지는 중", sublimatable: false }, 
  'Fading': { colors: [[255, 230, 30], [255, 200, 50]], sensitivity: 0.1, label: "아물어가는 흔적", sublimatable: true } 
};

const depthLabels = [
  "옅은 파동", "흩어지는 잔상", "고요한 시림", "맺힌 응어리", "묵직한 가라앉음", 
  "숨 막히는 압박", "짙은 먹먹함", "끝없는 침전", "빛이 닿지 않는 곳", "완전한 심연"
];

let distance = 0, smoothDistance = 0, currentScale = 1.0, charge = 0, selectedBruise = null, boostMultiplier = 1;
let writeBtn, connectBtn, fsBtn, modalWrapper, traumaInput, painInput, backBtn, sublimateBtn;
let memoryDisplay, focusParticles = [];
let showConnections = true; 
let isPaused = false;
let spaceReleased = true; 

let introWrapper, introActive = true;
let loadingParticles = [];
let auras = [];
let parallaxDust = []; 
let typingInterval = null; 

function preload() { 
  try {
    faceMesh = ml5.faceMesh({ maxFaces: 1, flipHorizontal: false }); 
  } catch (e) {
    console.error("ml5 로딩 실패. 강제 진행합니다.", e);
  }
}

function setup() {
  let style = createElement('style', `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400&family=Noto+Sans+KR:wght@100;200;300;400;500&family=Space+Mono&display=swap');
    body { margin: 0; padding: 0; overflow: hidden; background: #010101; font-family: 'Inter', 'Noto Sans KR', sans-serif; color: #fff; }
    canvas { display: block; position: absolute; top: 0; left: 0; z-index: 0; }
    
    .intro-wrapper {
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 3000; background: #010101; transition: opacity 1.5s ease-in-out;
    }
    .intro-title {
      font-family: 'Space Mono', sans-serif; font-size: 52px; letter-spacing: 12px; color: #fff; 
      margin-bottom: 50px; text-shadow: 0 0 20px rgba(255,255,255,0.5);
    }
    .intro-text {
      width: 80%; max-width: 1000px; text-align: center; color: #eee;
      font-family: 'Noto Sans KR', sans-serif; font-size: 26px; line-height: 2.2; font-weight: 300; 
      margin-bottom: 60px; letter-spacing: 0.5px; word-break: keep-all;
    }
    .btn-start {
      background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff;
      padding: 20px 60px; cursor: pointer; font-family: 'Space Mono', sans-serif; letter-spacing: 6px;
      text-transform: uppercase; transition: 0.5s; font-size: 18px;
    }
    .btn-start:hover { background: rgba(255,255,255,0.1); border-color: #fff; box-shadow: 0 0 20px rgba(255,255,255,0.3); }

    #memory-display {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 80%; max-width: 1000px; max-height: 70vh; 
      overflow-y: auto; padding-right: 20px;
      font-family: 'Noto Sans KR', sans-serif; font-size: 26px; line-height: 2.0; 
      letter-spacing: 1px; text-align: left; word-break: keep-all; font-weight: 300;
      color: rgba(255, 255, 255, 0.9); 
      opacity: 0; pointer-events: none; transition: opacity 0.2s ease-out, filter 0.2s ease-out; z-index: 500;
    }
    #memory-display::-webkit-scrollbar { width: 6px; }
    #memory-display::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
    #memory-display::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }

    .memory-date {
      font-family: 'Space Mono', sans-serif; font-size: 20px; color: rgba(255, 255, 255, 0.6); 
      margin-bottom: 24px; letter-spacing: 2px; border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 10px; display: inline-block;
    }

    .terminal-btn {
      position: absolute; background: transparent; 
      padding: 8px 0; border: none; border-bottom: 1px solid rgba(255,255,255,0.4); 
      color: rgba(255,255,255,0.9); font-weight: 500; text-shadow: none; 
      cursor: pointer; transition: 0.3s; z-index: 500; text-transform: uppercase;
      letter-spacing: 2px; font-size: 18px; font-family: 'Noto Sans KR', sans-serif; right: 50px;
    }
    .write-btn { top: 40px; }
    .connect-btn { top: 95px; }
    .fs-btn { top: 150px; }
    .terminal-btn:hover { color: #fff; border-bottom: 2px solid #fff; }

    .back-btn {
      position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); color: #ccc; font-weight: bold; padding: 15px 60px;
      cursor: pointer; z-index: 1000; text-transform: uppercase; letter-spacing: 4px; font-size: 15px;
      display: none; border-radius: 4px; transition: 0.5s; backdrop-filter: blur(5px);
    }
    .back-btn:hover { color: #fff; border-color: #fff; background: rgba(255,255,255,0.1); box-shadow: 0 0 15px rgba(255,255,255,0.3); }

    .sublimate-btn {
      position: absolute; bottom: 130px; left: 50%; transform: translateX(-50%);
      background: rgba(255, 200, 50, 0.1); border: 1px solid rgba(255, 230, 50, 0.5); color: #ffd700; font-weight: bold; padding: 15px 60px;
      cursor: pointer; z-index: 1000; text-transform: uppercase; letter-spacing: 4px; font-size: 15px;
      display: none; border-radius: 4px; transition: 0.5s; backdrop-filter: blur(5px);
    }
    .sublimate-btn:hover { background: rgba(255, 200, 50, 0.3); color: #fff; border-color: #fff; }

    .modal-wrapper { 
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; 
      display: none; align-items: center; justify-content: center; 
      z-index: 2000; background: transparent;
    }
    
    .trauma-form { 
      position: relative; 
      width: 75vw; max-width: 1200px; 
      height: 75vh; max-height: 850px; 
      padding: 50px 60px; 
      box-sizing: border-box;
      display: flex; flex-direction: column; 
      border-radius: 16px; 
      background: rgba(10, 10, 15, 0.35); 
      backdrop-filter: blur(35px) saturate(120%); 
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03);
      transition: box-shadow 1.0s ease-out, background-color 1.0s ease-out;
    }
    
    .trauma-form.typing-active {
      background: rgba(5, 5, 8, 0.7); 
      box-shadow: 0 40px 100px rgba(0,0,0,0.95), inset 0 0 120px rgba(0,0,0,0.85); 
    }
    
    .btn-close {
      position: absolute; top: 25px; right: 35px; background: transparent; border: none;
      color: rgba(255,255,255,0.3); font-family: 'Space Mono', sans-serif; cursor: pointer; 
      font-size: 14px; letter-spacing: 2px; transition: 0.3s; z-index: 2001;
    }
    .btn-close:hover { color: rgba(255,255,255,0.8); }

    .trauma-text {
      width: 100%; flex-grow: 1; margin: 10px 0 40px 0; padding: 20px 0; 
      background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); 
      color: rgba(255,255,255,0.8); opacity: 0.1; filter: blur(8px);
      font-family: 'Noto Sans KR', sans-serif; font-weight: 200; font-size: 20px; line-height: 2.0; 
      resize: none; outline: none; overflow-y: auto; letter-spacing: 0.5px;
      transition: filter 4.0s cubic-bezier(0.4, 0, 0.2, 1), opacity 4.0s ease-in-out;
    }
    
    .trauma-text.typing-active { opacity: 0.9; filter: blur(0px); transition: filter 0.5s ease-out, opacity 0.5s ease-out; }
    .trauma-text:focus { animation: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .trauma-text::-webkit-scrollbar { width: 4px; }
    .trauma-text::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
    .trauma-text::placeholder { color: rgba(255,255,255,0.3); font-weight: 200; transition: 0.5s; }
    .trauma-text:focus::placeholder { opacity: 0.05; }
    
    .form-footer { display: flex; flex-direction: column; margin-top: auto; }

    .pain-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; padding-bottom: 10px; }
    .pain-label { color: rgba(255,255,255,0.4); font-size: 16px; letter-spacing: 4px; font-family: 'Noto Sans KR'; font-weight: 300;}
    .pain-val-box { font-family: 'Noto Sans KR', sans-serif; font-size: 24px; color: rgba(255,255,255,0.85); font-weight: 200; letter-spacing: 2px; }

    .pain-slider { -webkit-appearance: none; width: 100%; height: 2px; margin-bottom: 60px; background: rgba(255,255,255,0.15); outline: none; }
    .pain-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%;
      background: #000; border: 2.5px solid rgba(255,255,255,0.6); cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5);
      transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .pain-slider::-webkit-slider-thumb:hover { transform: scale(1.6); background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.8); }

    .btn-submit { 
      width: 100%; padding: 22px; background: rgba(255,255,255,0.05); 
      color: rgba(255,255,255,0.4); font-size: 18px; border: 1px solid rgba(255,255,255,0.2); 
      cursor: pointer; letter-spacing: 1px; font-family: 'Noto Sans KR', sans-serif; font-weight: 400;
      transition: 0.3s ease; border-radius: 6px; text-transform: uppercase;
    }
    .btn-submit:hover { 
      background: rgba(255,255,255,0.15); color: #fff !important; 
      border-color: rgba(255,255,255,0.8) !important; letter-spacing: 1px; 
    }
  `);
  
  createCanvas(windowWidth, windowHeight); 
  
  pixelDensity(1); 
  frameRate(30); // 💡 [극강 최적화 1] 60프레임 연산을 30프레임으로 제한 (체감 부하 50% 즉각 감소)

  try {
    video = createCapture(VIDEO); 
    video.elt.setAttribute('playsinline', ''); 
    video.elt.setAttribute('autoplay', '');
    video.size(320, 240); 
    video.hide();
    if(faceMesh) {
      faceMesh.detectStart(video, (results) => { faces = results; modelLoaded = true; }); 
    }
  } catch(e) {
    console.error("비디오 캡처 오류", e);
  }

  setTimeout(() => { if (!modelLoaded) modelLoaded = true; }, 3000);
  
  loadFromLocalStorage(); 
  createUI();

  // 💡 [극강 최적화 2] 오라(Aura) 렌더링용 기본 RGB 색상을 미리 분리해서 저장 (매 프레임 계산 방지)
  for(let i = 0; i < 12; i++) {
    let cols = [ [25, 25, 45], [40, 20, 50], [15, 30, 45], [50, 50, 60] ];
    let c = random(cols);
    auras.push({ x: random(-3000, 3000), y: random(-3000, 3000), r: random(800, 1800), seed: random(1000), baseR: c[0], baseG: c[1], baseB: c[2] });
  }

  let range = 4000;
  for(let i = 0; i < 80; i++) parallaxDust.push({ x: random(-range, range), y: random(-range, range), z: random(0.1, 0.3), size: random(1, 3), alpha: random(40, 100) });
  for(let i = 0; i < 50; i++) parallaxDust.push({ x: random(-range, range), y: random(-range, range), z: random(0.4, 0.7), size: random(3, 6), alpha: random(60, 150) });
  for(let i = 0; i < 20; i++) parallaxDust.push({ x: random(-range, range), y: random(-range, range), z: random(1.0, 1.5), size: random(6, 12), alpha: random(100, 200) });

  let maxRadius = max(width, height);
  for(let i=0; i<100; i++) loadingParticles.push({ angle: random(TWO_PI), radius: random(50, maxRadius), speed: random(1, 5), size: random(1, 3) });
}

function saveToLocalStorage() {
  try { localStorage.setItem('abyss_bruises_data', JSON.stringify(bruises)); } catch(e) {}
}

function loadFromLocalStorage() {
  let saved = localStorage.getItem('abyss_bruises_data');
  if (saved) {
    try {
      let parsed = JSON.parse(saved);
      bruises = [];
      for (let b of parsed) {
        if (b == null || typeof b !== 'object') continue;
        if (isNaN(b.x) || isNaN(b.y) || b.x === null || b.y === null) continue;

        bruises.push({
          x: Number(b.x),
          y: Number(b.y),
          baseSize: isNaN(b.baseSize) ? 150 : Number(b.baseSize),
          seed: isNaN(b.seed) ? random(10000) : Number(b.seed),
          painLevel: isNaN(b.painLevel) ? 5 : Number(b.painLevel),
          timestamp: b.timestamp || "이전 기록",
          diary: b.diary || "기록되지 않은 덩어리...",
          startGroup: b.startGroup || 'Middle',
          spawnTime: isNaN(b.spawnTime) ? millis() : Number(b.spawnTime),
          stageDuration: isNaN(b.stageDuration) ? 86400000 : Number(b.stageDuration)
        });
      }
    } catch (e) {
      bruises = [];
      localStorage.removeItem('abyss_bruises_data');
    }
  }
}

let formWrapperElement, submitBtnElement, typingTimeout; 

function createUI() {
  introWrapper = createDiv('').class('intro-wrapper').id('intro-wrapper');
  createDiv('BRUISE ARCHIVE').class('intro-title').parent(introWrapper);
  
  let introStr = `이 시스템은 보이지 않는 상처를 추적하는 심연의 관측소입니다.<br><br>고통은 형태를 띠고 내면 깊은 곳으로 가라앉습니다. 시스템은 입력된 통증의 깊이를 기반으로 응어리의 크기와 색상을 결정하며, 시간의 흐름에 따라 상처가 무뎌지는 과정을 실시간으로 연산합니다.<br><br>당신의 역할은 관찰자입니다. 상처가 완전히 바스라질 준비가 될 때까지 기다리고, 직면하여, 마침내 심연에서 승화시키십시오.`;
  createDiv(introStr).class('intro-text').parent(introWrapper);
  let startBtn = createButton('시스템 접속 [ SPACE ]').class('btn-start').parent(introWrapper);
  startBtn.mousePressed(startSystem);

  memoryDisplay = createDiv(''); memoryDisplay.id('memory-display');
  
  writeBtn = createButton('+ 기록 남기기 [N]'); writeBtn.class('terminal-btn write-btn'); writeBtn.mousePressed(openWriteModal);
  connectBtn = createButton('연결망 확인 [C]'); connectBtn.class('terminal-btn connect-btn'); connectBtn.mousePressed(() => { showConnections = !showConnections; });
  fsBtn = createButton('전체화면 [F]'); fsBtn.class('terminal-btn fs-btn');
  fsBtn.mousePressed(() => { let fs = fullscreen(); fullscreen(!fs); });
  
  backBtn = createButton('표면으로 돌아가기 [←]'); backBtn.class('back-btn'); backBtn.mousePressed(goBackFromFocus);
  sublimateBtn = createButton('이 기억을 영원히 승화하기 [ENTER]'); sublimateBtn.class('sublimate-btn'); sublimateBtn.mousePressed(sublimateBruise);

  modalWrapper = createDiv(''); modalWrapper.class('modal-wrapper'); 
  formWrapperElement = createDiv('').class('trauma-form').parent(modalWrapper);
  
  let closeBtn = createButton('닫기 [ TAB ]').class('btn-close').parent(formWrapperElement);
  closeBtn.mousePressed(() => { 
    currentScene = 0; 
    modalWrapper.style('display', 'none'); 
  });

  traumaInput = createElement('textarea', '').class('trauma-text').parent(formWrapperElement); 
  traumaInput.attribute('placeholder', '이곳에 당신의 이야기를 털어놓으세요. 입력이 멈추면 당신의 기록은 안전하게 숨겨집니다.');
  
  traumaInput.input(() => {
    if (!traumaInput.hasClass('typing-active')) {
      formWrapperElement.addClass('typing-active');
      traumaInput.addClass('typing-active');
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      formWrapperElement.removeClass('typing-active');
      traumaInput.removeClass('typing-active');
    }, 500);

    let len = traumaInput.value().length;
    let btnIntensity = constrain(map(len, 0, 40, 0.2, 1.0), 0.2, 1.0); 
    submitBtnElement.style('color', `rgba(255, 255, 255, ${btnIntensity})`);
    submitBtnElement.style('border-color', `rgba(255, 255, 255, ${btnIntensity * 0.5})`);
  });
  
  let footerDiv = createDiv('').class('form-footer').parent(formWrapperElement);

  let painContainer = createDiv('').class('pain-container').parent(footerDiv); 
  createElement('div', '고통의 단계').class('pain-label').parent(painContainer);
  let painValDisplay = createDiv('5단계').id('pain-val').class('pain-val-box').parent(painContainer);
  
  painInput = createSlider(1, 10, 5, 1).class('pain-slider').parent(footerDiv);
  painInput.input(() => { 
    let val = painInput.value(); 
    select('#pain-val').html(val + '단계'); 
  });
  
  submitBtnElement = createButton('흔적 남기기').class('btn-submit').parent(footerDiv);
  submitBtnElement.mousePressed(addNewBruise);
}

function startSystem() {
  if (!introActive) return; 
  introActive = false; 
  currentScene = 0;
  modalWrapper.style('display', 'none');
  introWrapper.style('opacity', '0');
  introWrapper.style('pointer-events', 'none'); 
  setTimeout(() => introWrapper.style('display', 'none'), 1500); 
}

function openWriteModal() { 
  currentScene = 2; 
  modalWrapper.style('display', 'flex'); 
  traumaInput.value(''); 
  painInput.value(5); 
  select('#pain-val').html('5단계'); 
  
  submitBtnElement.style('color', 'rgba(255,255,255,0.4)');
  submitBtnElement.style('border-color', 'rgba(255,255,255,0.2)');
  setTimeout(() => traumaInput.elt.focus(), 50); 
}

function goBackFromFocus() {
  currentScene = 0; selectedBruise = null; charge = 0; 
  backBtn.hide(); sublimateBtn.hide(); 
  memoryDisplay.style('opacity', '0'); 
  memoryDisplay.style('pointer-events', 'none'); 
  modalWrapper.style('display', 'none');
  focusParticles = []; 
  clearInterval(typingInterval); 
}

function sublimateBruise() {
  if (selectedBruise) {
    let index = bruises.indexOf(selectedBruise);
    if (index > -1) bruises.splice(index, 1); 
    saveToLocalStorage();
  }
  goBackFromFocus();
}

function getFormattedDate() {
  let d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addNewBruise() {
  let pain = painInput.value(); let group;
  if (pain >= 8) group = 'Fresh'; 
  else if (pain >= 5) group = 'Middle'; 
  else if (pain >= 2) group = 'Healing'; 
  else group = 'Fading'; 
  
  let totalDaysToHeal = (pain * pain) * 10; let msPerStage = (totalDaysToHeal / 3) * 24 * 60 * 60 * 1000; 
  
  bruises.push({ 
    x: -worldX + random(-500, 500), y: -worldY + random(-500, 500), painLevel: pain, baseSize: map(pain, 1, 10, 90, 240), 
    startGroup: group, spawnTime: millis(), stageDuration: msPerStage, diary: traumaInput.value() || "기록되지 않은 덩어리...", seed: random(10000), timestamp: getFormattedDate() 
  });
  saveToLocalStorage();
  currentScene = 0; 
  modalWrapper.style('display', 'none'); 
}

function mouseDragged() {
  if (currentScene === 0 && !introActive && !isPaused) {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let isHoveringAny = false;
    
    for (let b of bruises) {
      if (dist(mx - worldX, my - worldY, b.x, b.y) < b.baseSize * 0.8) {
        isHoveringAny = true; break;
      }
    }
    
    if (!isHoveringAny) {
      worldX += (mouseX - pmouseX);
      worldY += (mouseY - pmouseY);
      velX = 0; 
      velY = 0;
    }
  }
}

function draw() {
  try { actualDrawLogic(); } catch(e) { console.error(e); }
}

function actualDrawLogic() {
  if (!modelLoaded) { drawLoadingScreen(); return; }

  let bgColor = color(5, 5, 8);
  if (currentScene === 1 && selectedBruise) {
    let cg = getDynamicBruiseState(selectedBruise).group; let c = ColorGroups[cg].colors[0]; bgColor = lerpColor(color(5, 5, 8), color(c[0], c[1], c[2]), smoothDistance * 0.15);
  }
  background(bgColor); drawFilmGrain(); drawBackgroundEnvironment();

  push(); translate(width / 2, height / 2); stroke(255, 10); strokeWeight(1); noFill(); circle(0, 0, 120); fill(255, 15); noStroke(); circle(0, 0, 4); pop();

  push(); translate(width / 2, height / 2);
  if (currentScene === 0) { 
    writeBtn.show(); connectBtn.show(); fsBtn.show(); backBtn.hide(); sublimateBtn.hide(); drawMapScene(); 
  } 
  else if (currentScene === 1) { 
    writeBtn.hide(); connectBtn.hide(); fsBtn.hide(); backBtn.show(); 
    let state = getDynamicBruiseState(selectedBruise);
    if (ColorGroups[state.group].sublimatable) sublimateBtn.show(); else sublimateBtn.hide();
    drawFocusScene(); 
  }
  pop();

  if (currentScene === 0 && !introActive) {
    push();
    fill(255, 140);
    textFont('Noto Sans KR');
    textSize(16);
    textAlign(LEFT, BOTTOM);
    text("조작법 : [마우스 이동/드래그, WASD] 화면 유영  |  [Space] 표류 일시정지  |  [Shift] 고속 이동  |  [F] 전체화면", 30, height - 30);
    pop();
  }
}

function drawLoadingScreen() {
  background(5, 5, 8); drawFilmGrain();
  push(); translate(width / 2, height / 2); noStroke();
  for (let p of loadingParticles) {
    p.radius -= p.speed; if (p.radius < 20) { p.radius = random(max(width, height) * 0.6, max(width, height)); p.angle = random(TWO_PI); }
    fill(255, map(p.radius, 20, 400, 200, 0)); circle(cos(p.angle) * p.radius, sin(p.angle) * p.radius, p.size);
  }
  let time = frameCount * 0.05; let coreSize = 60 + sin(time) * 15;
  drawingContext.shadowBlur = 40; drawingContext.shadowColor = color(255, 255, 255, 120);
  fill(2, 2, 2); stroke(255, 200); strokeWeight(1.5); circle(0, 0, coreSize); drawingContext.shadowBlur = 0;
  textAlign(CENTER); textFont('Space Mono');
  fill(255, map(sin(time * 1.2), -1, 1, 40, 255)); noStroke(); textSize(18); letterSpacing("5"); 
  text("[ BRUISE ARCHIVE 동기화 중 ]", 0, 110);
  fill(150); textSize(16); letterSpacing("2"); text(`현재 깊이: -${floor(frameCount * 14.3)}m`, 0, 145);
  pop();
}

function drawFilmGrain() { 
  noStroke(); 
  // 💡 [극강 최적화 3] 사각형 그리기 횟수를 100회에서 40회로 대폭 감소
  fill(255, 6); 
  for(let i=0; i<40; i++) rect(random(width), random(height), 2.5, 2.5); 
}

function drawBackgroundEnvironment() {
  push(); translate(width / 2, height / 2); noStroke();
  
  // 💡 [극강 최적화 4] 사파리가 제일 싫어하는 실시간 방사형 그라데이션 완전 제거 -> 반투명 원 3개 겹치기로 동일한 효과 구현
  for(let a of auras) {
    let px = a.x + worldX * 0.15; let py = a.y + worldY * 0.15; let range = 6000;
    let wrappedX = (((px + range/2) % range) + range) % range - range/2; let wrappedY = (((py + range/2) % range) + range) % range - range/2;
    let currentR = a.r + sin(frameCount * 0.005 + a.seed) * 200;
    
    fill(a.baseR, a.baseG, a.baseB, 8); circle(wrappedX, wrappedY, currentR);
    fill(a.baseR, a.baseG, a.baseB, 15); circle(wrappedX, wrappedY, currentR * 0.6);
    fill(a.baseR, a.baseG, a.baseB, 25); circle(wrappedX, wrappedY, currentR * 0.3);
  }

  for(let p of parallaxDust) {
    let px = p.x + worldX * p.z; let py = p.y + worldY * p.z; let range = 4000;
    let wrappedX = (((px + range/2) % range) + range) % range - range/2; let wrappedY = (((py + range/2) % range) + range) % range - range/2;
    
    // 💡 [극강 최적화 5] 무의미하게 적용되던 먼지 입자의 개별 그림자(Shadow) 연산 전면 삭제
    fill(255, p.alpha);
    circle(wrappedX, wrappedY, p.size);
  }
  pop();
}

function getDynamicBruiseState(b) {
  let startIndex = StageOrder.indexOf(b.startGroup); 
  if (startIndex === -1) startIndex = 1; 
  let elapsed = millis() - b.spawnTime;
  let stagesPassed = floor(elapsed / b.stageDuration); let currentIndex = min(3, startIndex + stagesPassed);
  let currentGroup = StageOrder[currentIndex]; let totalTimeUntilFading = b.stageDuration * (3 - startIndex); 
  return { group: currentGroup, timeLeft: max(0, totalTimeUntilFading - elapsed), totalTimeUntilFading: totalTimeUntilFading };
}

function drawMapScene() {
  let mx = mouseX - width / 2, my = mouseY - height / 2;
  let distFromCenter = dist(0, 0, mx, my); 
  
  let isHoveringAny = false;
  let hoveredBruise = null;
  for (let b of bruises) {
    if (dist(mx - worldX, my - worldY, b.x, b.y) < b.baseSize * 0.8) {
      isHoveringAny = true;
      hoveredBruise = b;
    }
  }

  if (!isPaused && !introActive) { 
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) velX += 5;   
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) velX -= 5;  
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) velY += 5;     
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) velY -= 5;   
    
    if (distFromCenter > 10) {
      boostMultiplier = lerp(boostMultiplier, keyIsDown(16) ? 2.5 : 1.0, 0.05); 
      velX -= (mx * 0.001) * boostMultiplier; 
      velY -= (my * 0.001) * boostMultiplier; 
    }
    
    velX *= 0.92; 
    velY *= 0.92; 
    worldX += velX; 
    worldY += velY;
  }
  
  push(); translate(worldX, worldY);
  if (showConnections) {
    for (let i = 0; i < bruises.length; i++) {
      for (let j = i + 1; j < bruises.length; j++) {
        let d = dist(bruises[i].x, bruises[i].y, bruises[j].x, bruises[j].y);
        if (d < 800) { stroke(255, map(d, 0, 800, 50, 0)); strokeWeight(0.7); line(bruises[i].x, bruises[i].y, bruises[j].x, bruises[j].y); }
      }
    }
  }
  
  if (isHoveringAny && mouseIsPressed) { 
    charge += 2; 
    if (charge >= 100) initFocus(hoveredBruise); 
  } else { 
    charge = max(0, charge - 4); 
  }
  
  for (let b of bruises) {
    let absX = b.x + worldX;
    let absY = b.y + worldY;
    let margin = b.baseSize * 2.5; 
    let isVisible = (absX > -width/2 - margin && absX < width/2 + margin &&
                     absY > -height/2 - margin && absY < height/2 + margin);

    if (isVisible) {
      let isThisHovered = (b === hoveredBruise);
      let passCharge = isThisHovered ? charge : 0;
      drawTimeBasedBruise(b, isThisHovered, passCharge); 
    }
  }
  pop(); drawNavAids(mx, my, isHoveringAny);
}

function drawTimeBasedBruise(b, isHovered, chargeAmt) {
  chargeAmt = chargeAmt || 0; 
  let state = getDynamicBruiseState(b); let currentGroup = state.group; let { baseSize, seed, painLevel } = b;
  let c = ColorGroups[currentGroup].colors[ floor(seed) % 2 ]; randomSeed(seed); noiseSeed(seed);

  push(); translate(b.x, b.y);
  let time = frameCount * 0.01; 
  
  let throbSpeed = isHovered ? map(painLevel, 1, 10, 4.0, 20.0) : map(painLevel, 1, 10, 1.0, 6.0);
  let throbAmp = isHovered ? map(painLevel, 1, 10, 0.05, 0.3) : map(painLevel, 1, 10, 0.02, 0.15);
  let pulse = sin(time * throbSpeed + seed) * (baseSize * throbAmp); let s = baseSize + pulse;

  if (chargeAmt > 0) {
    s *= map(chargeAmt, 0, 100, 1.0, 1.4); 
  }

  let baseDistortion = map(painLevel, 1, 10, 0.02, 0.8);

  let blurAmt = 0; let edgeDistortion = 0; let mixColor = []; let blendType = BLEND;
  if (currentGroup === 'Fresh') { blurAmt = 12; edgeDistortion = baseDistortion * 1.5; blendType = MULTIPLY; mixColor = [60, 0, 10]; } 
  else if (currentGroup === 'Middle') { blurAmt = 18; edgeDistortion = baseDistortion * 1.2; blendType = OVERLAY; mixColor = [10, 20, 80]; } 
  else if (currentGroup === 'Healing') { blurAmt = 12; edgeDistortion = baseDistortion * 0.8; blendType = SCREEN; mixColor = [100, 255, 120]; } 
  else { blurAmt = 12; edgeDistortion = baseDistortion * 0.3; blendType = SCREEN; mixColor = [255, 230, 50]; }

  // 💡 [극강 최적화 6] 렉의 주범인 filter(blur)를 완전히 제거하고, 가벼운 shadowBlur 하나만으로 몽환적 테두리를 구현
  drawingContext.shadowBlur = s * 1.5 + (chargeAmt * 1.5); 
  drawingContext.shadowColor = color(c[0], c[1], c[2], 200); 
  
  noStroke(); fill(c[0], c[1], c[2], 230); beginShape();
  
  // 💡 [극강 최적화 7] 노이즈 형태를 잡는 꼭짓점 개수를 절반 이하로 줄여 다각형 렌더링 부하 최소화
  for (let a = 0; a < TWO_PI; a += 0.35) {
    let n = noise(cos(a) * 1.2 + seed, sin(a) * 1.2 + seed, time);
    let r = (s * 0.5) * map(n, 0, 1, 1 - edgeDistortion, 1 + edgeDistortion); vertex(r * cos(a), r * sin(a));
  }
  endShape(CLOSE);

  blendMode(blendType); 
  
  // 💡 [극강 최적화 8] 무한 증식하던 파티클 개수에 제한(Cap)을 걸어 안정적인 FPS 확보
  let particleCount = min(15, floor(s * 0.15)); 
  for(let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI); let radius = random(s * 0.45); let nx = cos(angle) * radius; let ny = sin(angle) * radius; let nVal = noise(nx * 0.03, ny * 0.03, time * 1.5);
    fill(lerp(c[0], mixColor[0], nVal), lerp(c[1], mixColor[1], nVal), lerp(c[2], mixColor[2], nVal), 220 * nVal); 
    circle(nx, ny, s * 0.18 * random(1.0, 2.5));
  }

  blendMode(BLEND); drawingContext.shadowBlur = 0; fill(255, 60); circle(0, 0, 2); 

  if (chargeAmt > 0) {
    push();
    noFill();
    stroke(255, map(chargeAmt, 0, 100, 50, 255));
    strokeWeight(map(chargeAmt, 0, 100, 1, 8));
    let ringSize = map(chargeAmt, 0, 100, s * 1.8, s * 0.5); 
    circle(0, 0, ringSize);
    
    fill(255, map(chargeAmt, 0, 100, 0, 150));
    noStroke();
    circle(0, 0, map(chargeAmt, 0, 100, 0, s));
    pop();
  }

  if (isHovered && currentScene === 0 && chargeAmt === 0) {
    push();
    let boxW = 680; let boxH = 340; let boxX = s * 0.8 + 50; let boxY = -170; 
    let absX = width / 2 + worldX + b.x; let absY = height / 2 + worldY + b.y;

    if (absX + boxX + boxW > width - 20) boxX = -s * 0.8 - 40 - boxW; 
    if (absX + boxX < 20) boxX = s * 0.8 + 40; 
    if (absY + boxY < 20) boxY = 20 - absY; else if (absY + boxY + boxH > height - 20) boxY = height - 20 - absY - boxH;
    
    fill(10, 10, 15, 240); stroke(255, 40); strokeWeight(1.5); rect(boxX, boxY, boxW, boxH, 8); 
    noStroke(); fill(c[0], c[1], c[2]); circle(boxX + 45, boxY + 55, 18); 
    
    fill(250); textAlign(LEFT, CENTER); textFont('Noto Sans KR'); textSize(36); text(ColorGroups[currentGroup].label, boxX + 80, boxY + 50);
    fill(160); textFont('Space Mono'); textSize(22); letterSpacing("1"); text(`기록 시점 : ${b.timestamp}`, boxX + 45, boxY + 120);
    
    let elapsed = millis() - b.spawnTime; let currentPain = b.painLevel;
    if (state.totalTimeUntilFading > 0) { currentPain = max(1, round(map(elapsed, 0, state.totalTimeUntilFading, b.painLevel, 1))); if (elapsed > state.totalTimeUntilFading) currentPain = 1; } 
    else { currentPain = 1; }
    
    fill(200); textSize(22); text(`현재 상태 : ${currentPain}단계`, boxX + 45, boxY + 165);
    
    fill(255, 10); noStroke(); rect(boxX + 45, boxY + 200, 10 * 32, 12, 6); 
    fill(255, 50); rect(boxX + 45, boxY + 200, b.painLevel * 32, 12, 6);
    fill(c[0], c[1], c[2], 220); rect(boxX + 45, boxY + 200, currentPain * 32, 12, 6);
    
    if (state.timeLeft > 0) {
      let days = floor(state.timeLeft / (1000 * 60 * 60 * 24)); let hours = floor((state.timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); let mins = floor((state.timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      let timeStr = days > 0 ? `${days}일 ${hours}시간` : (hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분 ${floor(state.timeLeft/1000 % 60)}초`);
      fill(220); textSize(22); text(`직면하기까지 : ${timeStr}`, boxX + 45, boxY + 270);
    } else {
      fill(255, 200, 50); textSize(22); text(`승화 준비 완료: 지금 직면할 수 있습니다`, boxX + 45, boxY + 270);
    }
    pop();
  }
  pop();
}

function drawNavAids(mx, my, isAnyHovered) {
  if(introActive) return; 

  push();
  noStroke(); fill(255, 180); circle(mx, my, 12); stroke(255, 120); strokeWeight(2); 
  line(mx-25, my, mx+25, my); line(mx, my-25, mx, my+25);
  
  textFont('Space Mono'); textSize(22); 
  let coordText = `[ 커서 위치: ${floor(mx)} , ${floor(my)} ]`;
  let textW = textWidth(coordText); let textOffX = 35; let textOffY = 45;

  if (isAnyHovered) textOffX = -textW - 25; 
  if (mx + textOffX + textW > width / 2 - 20) textOffX = -textW - 25; 
  if (mx + textOffX < -width / 2 + 20) textOffX = 35; 
  if (my + textOffY > height / 2 - 20) textOffY = -35; 

  fill(255, 200); noStroke(); text(coordText, mx + textOffX, my + textOffY);
  
  if (isPaused) {
    fill(255, 150); textSize(16); letterSpacing("2"); text(`|| 시스템 일시정지`, mx + textOffX, my + textOffY - 28);
  } else if (keyIsDown(16)) { 
    fill(255, random(160, 255)); textSize(16); letterSpacing("2"); text(`>>> 고속 이동 중`, mx + textOffX, my + textOffY - 28);
  }
  pop();

  for (let b of bruises) {
    let sx = b.x + worldX; let sy = b.y + worldY;
    if (sx < -width/2 + 50 || sx > width/2 - 50 || sy < -height/2 + 50 || sy > height/2 - 50) {
      let angle = atan2(sy, sx); let edgeX = constrain(sx, -width/2 + 60, width/2 - 60); let edgeY = constrain(sy, -height/2 + 60, height/2 - 60);
      let cg = getDynamicBruiseState(b).group; let targetColor = ColorGroups[cg].colors[0];
      push(); translate(edgeX, edgeY); rotate(angle); stroke(targetColor); strokeWeight(3); noFill(); 
      line(0, 0, -20, -10); line(0, 0, -20, 10); rotate(-angle); noStroke(); fill(targetColor); textSize(18); textAlign(CENTER); textFont('Space Mono');
      text(`${floor(dist(0,0, sx, sy)/10)}m`, 0, 35); pop();
    }
  }
}

function initFocus(b) {
  selectedBruise = b; currentScene = 1; charge = 0; 
  let state = getDynamicBruiseState(selectedBruise);
  let formattedDate = `<div class="memory-date">[ 기록된 시점 : ${selectedBruise.timestamp} ]</div><br>`;
  
  memoryDisplay.style('pointer-events', 'auto'); 
  clearInterval(typingInterval); 

  if (state.group === 'Healing' || state.group === 'Fading') {
    memoryDisplay.html(formattedDate); 
    let charIndex = 0;
    let fullText = selectedBruise.diary;
    let currentText = "";
    
    typingInterval = setInterval(() => {
      let char = fullText.charAt(charIndex);
      currentText += (char === '\n' ? '<br>' : char);
      memoryDisplay.html(formattedDate + currentText);
      charIndex++;
      if (charIndex >= fullText.length) clearInterval(typingInterval);
    }, 45); 
  } else {
    let formattedDiary = formattedDate + selectedBruise.diary.replace(/\n/g, '<br>');
    memoryDisplay.html(formattedDiary);
  }

  focusParticles = []; for(let i=0; i<200; i++) focusParticles.push({ x: random(-width, width), y: random(-height, height), z: random(0.5, 5.0) });
}

function drawFocusScene() {
  if (faces.length > 0 && faces[0] && faces[0].box) {
    distance = constrain(map(faces[0].box.width, 60, 250, 0, 1), 0, 1); 
  } else {
    distance = lerp(distance, 0, 0.05);
  }
  smoothDistance = lerp(smoothDistance, distance, 0.1); currentScale = lerp(currentScale, map(smoothDistance, 0, 1, 0.7, 3.8), 0.1);

  push(); scale(currentScale); translate(-selectedBruise.x, -selectedBruise.y); drawTimeBasedBruise(selectedBruise, true, 0); pop();

  let state = getDynamicBruiseState(selectedBruise);
  let c = ColorGroups[state.group].colors[0];
  noStroke(); 
  for(let p of focusParticles) { fill(c[0], c[1], c[2], map(p.z, 0.5, 5, 80, 5)); circle(p.x * (1 + smoothDistance * p.z * 0.25), p.y * (1 + smoothDistance * p.z * 0.25), p.z * 1.5); }

  if (smoothDistance > 0.45) { 
    let baseAlpha = map(smoothDistance, 0.45, 0.75, 0, 1);
    let pain = selectedBruise.painLevel;
    
    let blurVal = 0; 
    let shakeX = 0; 
    let shakeY = 0; 
    let currentAlpha = baseAlpha;
    
    if (pain >= 5) {
      blurVal = map(pain, 5, 10, 3, 12);
      let shakeAmp = map(pain, 5, 10, 2, 18);
      shakeX = random(-shakeAmp, shakeAmp);
      shakeY = random(-shakeAmp, shakeAmp);
      if (random() < map(pain, 5, 10, 0.1, 0.6)) currentAlpha *= random(0.1, 0.5);
    } else {
      blurVal = map(pain, 1, 4, 0, 1.5);
      shakeX = random(-0.5, 0.5); 
      shakeY = random(-0.5, 0.5);
    }
    
    memoryDisplay.style('filter', `blur(${blurVal}px)`); 
    memoryDisplay.style('transform', `translate(-50%, -50%) translate(${shakeX}px, ${shakeY}px)`);
    memoryDisplay.style('opacity', constrain(currentAlpha, 0, 1)); 
  } else { 
    memoryDisplay.style('opacity', '0'); 
  }
}

function letterSpacing(value) { 
  try { drawingContext.letterSpacing = value + "px"; } catch(e) {}
}

function keyReleased() {
  if (key === ' ') spaceReleased = true; 
}

function keyPressed() {
  if (introActive) {
    if (keyCode === ENTER || key === ' ') {
      startSystem();
      spaceReleased = false; 
    }
    return false;
  }

  if (key === '0') {
    localStorage.clear();
    alert("데이터 초기화 완료.");
    window.location.reload();
    return false;
  }

  if (keyCode === TAB && currentScene === 2) { 
    currentScene = 0; 
    modalWrapper.style('display', 'none'); 
    return false; 
  }
  
  if (document.activeElement.tagName === 'TEXTAREA') return;
  
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
    return false;
  }

  if ((key === 'n' || key === 'N') && currentScene === 0) openWriteModal();
  if ((key === 'c' || key === 'C') && currentScene === 0) showConnections = !showConnections;
  if (keyCode === LEFT_ARROW && currentScene === 1) goBackFromFocus();
  
  if (keyCode === ENTER && currentScene === 1) {
    let state = getDynamicBruiseState(selectedBruise);
    if (ColorGroups[state.group].sublimatable) sublimateBruise();
  }
  
  if (key === ' ' && spaceReleased && (currentScene === 0 || currentScene === 1)) { 
    isPaused = !isPaused; 
    return false; 
  }

  if (key === 'e' || key === 'E') {
    setTimeout(() => exportManualAsset('Fresh', 10, 'Spectrum_01_Fresh'), 100); setTimeout(() => exportManualAsset('Middle', 7, 'Spectrum_02_Middle'), 600);
    setTimeout(() => exportManualAsset('Healing', 4, 'Spectrum_03_Healing'), 1100); setTimeout(() => exportManualAsset('Fading', 1, 'Spectrum_04_Fading'), 1600);
  }
  if (key === 'b' || key === 'B') { exportA5Background(); }
}

function exportA5Background() {
  let pg = createGraphics(1748, 2480); pg.background(5, 5, 8); pg.push(); pg.translate(pg.width / 2, pg.height / 2); pg.noStroke();
  for(let a of auras) {
    let px = a.x + worldX * 0.15; let py = a.y + worldY * 0.15; let range = 6000;
    let wrappedX = (((px + range/2) % range) + range) % range - range/2; let wrappedY = (((py + range/2) % range) + range) % range - range/2;
    let currentR = a.r + sin(frameCount * 0.005 + a.seed) * 200;
    pg.fill(a.baseR, a.baseG, a.baseB, 8); pg.circle(wrappedX, wrappedY, currentR);
    pg.fill(a.baseR, a.baseG, a.baseB, 15); pg.circle(wrappedX, wrappedY, currentR * 0.6);
    pg.fill(a.baseR, a.baseG, a.baseB, 25); pg.circle(wrappedX, wrappedY, currentR * 0.3);
  }
  for(let p of parallaxDust) {
    let px = p.x + worldX * p.z; let py = p.y + worldY * p.z; let range = 4000;
    let wrappedX = (((px + range/2) % range) + range) % range - range/2; let wrappedY = (((py + range/2) % range) + range) % range - range/2;
    pg.noStroke(); pg.fill(255, p.alpha); pg.circle(wrappedX, wrappedY, p.size);
  }
  pg.pop(); save(pg, 'Abyss_Background_A5.png'); pg.remove();
}

function exportManualAsset(stage, pain, filename) {
  let pg = createGraphics(800, 800); pg.background(5, 5, 8); pg.push(); pg.translate(pg.width / 2, pg.height / 2);
  let c = ColorGroups[stage].colors[0]; let seed = random(10000); randomSeed(seed); noiseSeed(seed);
  let s = map(pain, 1, 10, 90, 240); let time = 100; let blurAmt = 0; let edgeDistortion = 0; let mixColor = []; let blendType = BLEND;
  
  let baseDistortion = map(pain, 1, 10, 0.05, 0.6);
  if (stage === 'Fresh') { blurAmt = 12; edgeDistortion = baseDistortion * 1.2; blendType = MULTIPLY; mixColor = [60, 0, 10]; } 
  else if (stage === 'Middle') { blurAmt = 18; edgeDistortion = baseDistortion * 0.9; blendType = OVERLAY; mixColor = [10, 20, 80]; } 
  else if (stage === 'Healing') { blurAmt = 12; edgeDistortion = baseDistortion * 0.5; blendType = SCREEN; mixColor = [100, 255, 120]; } 
  else { blurAmt = 12; edgeDistortion = 0.05; blendType = SCREEN; mixColor = [255, 230, 50]; }

  pg.drawingContext.shadowBlur = s * 1.5; pg.drawingContext.shadowColor = color(c[0], c[1], c[2], 200); pg.drawingContext.filter = `blur(${blurAmt}px)`;
  pg.noStroke(); pg.fill(c[0], c[1], c[2], 230); pg.beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) { let n = noise(cos(a) * 1.2 + seed, sin(a) * 1.2 + seed, time); let r = (s * 0.5) * map(n, 0, 1, 1 - edgeDistortion, 1 + edgeDistortion); pg.vertex(r * cos(a), r * sin(a)); }
  pg.endShape(CLOSE); pg.blendMode(blendType); pg.drawingContext.filter = `blur(${blurAmt * 0.3}px)`; 
  for(let i = 0; i < floor(s * 1.5); i++) {
    let angle = random(TWO_PI); let radius = random(s * 0.45); let nx = cos(angle) * radius; let ny = sin(angle) * radius; let nVal = noise(nx * 0.03, ny * 0.03, time * 1.5);
    pg.fill(lerp(c[0], mixColor[0], nVal), lerp(c[1], mixColor[1], nVal), lerp(c[2], mixColor[2], nVal), 220 * nVal); pg.circle(nx, ny, s * 0.1 * random(0.5, 2.0));
  }
  pg.blendMode(BLEND); pg.drawingContext.filter = 'none'; pg.drawingContext.shadowBlur = 0; pg.fill(255, 60); pg.circle(0, 0, 2); 
  pg.pop(); save(pg, filename + '.png'); pg.remove();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
