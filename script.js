const SUPABASE_URL = "https://qmijwpakcexboqnfsgzw.supabase.co";
const SUPABASE_KEY = "sb_publishable_OjCVGUz4jcvGZOTrA3TqOw_sZhAFR3x";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const enterBtn = document.getElementById("enterBtn");
const result = document.getElementById("result");
const countEl = document.getElementById("count");
const citizenList = document.getElementById("citizenList");

function formatCitizenNumber(number) {
  return String(number).padStart(5, "0");
}

function showCitizen(number, message) {
  result.classList.remove("hidden");
  result.innerHTML = `
    Citizen #${formatCitizenNumber(number)}<br/>
    ${message}
  `;
}

async function getCitizenCount() {
  const { count, error } = await db
    .from("citizens")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Count Error:", error);
    return null;
  }

  return count;
}

async function loadCitizens() {
  const count = await getCitizenCount();

  if (count === null) return;

  countEl.textContent = count;

  const { data, error } = await db
    .from("citizens")
    .select("*")
    .order("citizen_number", { ascending: false })
    .limit(14);

  if (error) {
    console.error("Recent Citizens Error:", error);
    return;
  }

  citizenList.innerHTML = data
    .map(c => `<div>Citizen #${formatCitizenNumber(c.citizen_number)}</div>`)
    .join("");
}

async function registerCitizen() {
  const existingCitizen = localStorage.getItem("citizen_number");

  if (existingCitizen) {
    showCitizen(existingCitizen, "Already registered.");
    return;
  }

  const count = await getCitizenCount();

  if (count === null) return;

  const newNumber = count + 1;

  const { error } = await db
    .from("citizens")
    .insert({
      citizen_number: newNumber
    });

  if (error) {
    console.error("Insert Error:", error);
    result.classList.remove("hidden");
    result.textContent = "Registration failed.";
    return;
  }

  localStorage.setItem("citizen_number", newNumber);

  showCitizen(newNumber, "You are now a citizen of Cyclopia.");

  loadCitizens();
}

enterBtn.addEventListener("click", registerCitizen);

loadCitizens();


// -------------------------
// Wind Line Animation
// line.png를 캔버스에 그리고, 바람처럼 아주 살짝 흔들리게 함
// 모바일에서는 조각 수/속도/흔들림을 줄여서 덜 자잘하게 보이게 함
// -------------------------

const canvas = document.getElementById("windLine");
const ctx = canvas.getContext("2d");

const lineImg = new Image();
lineImg.src = "line.png";

let time = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

lineImg.onload = () => {
  animateLine();
};

function animateLine() {
  const isMobile = window.innerWidth < 768;

  // 모바일/데스크탑별 조절값
  const speed = isMobile ? 0.01 : 0.01;
  const slices = isMobile ? 42 : 90;
  const amp1 = isMobile ? 5 : 4;
  const amp2 = isMobile ? 2 : 2;

  time += speed;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 라인 이미지 크기/위치
  const imgWidth = isMobile
    ? canvas.width * 1.65
    : canvas.width * 1.15;

  const imgHeight = imgWidth * (lineImg.height / lineImg.width);

  const startX = isMobile
    ? -canvas.width * 0.32
    : -canvas.width * 0.08;

  const startY = isMobile
    ? -44
    : -74;

  const sliceWidth = imgWidth / slices;

  for (let i = 0; i < slices; i++) {
    const sx = (lineImg.width / slices) * i;
    const sw = lineImg.width / slices;
    const dx = startX + sliceWidth * i;

    // 바람 흔들림: 두 개의 느린 사인파를 섞어서 자연스럽게 만듦
    const wind =
      Math.sin(time + i * 0.18) * amp1 +
      Math.sin(time * 0.7 + i * 0.35) * amp2;

    const dy = startY + wind;

    ctx.drawImage(
      lineImg,
      sx,
      0,
      sw,
      lineImg.height,
      dx,
      dy,
      sliceWidth + 1,
      imgHeight
    );
  }

  requestAnimationFrame(animateLine);
}