const SUPABASE_URL = "https://qmijwpakcexboqnfsgzw.supabase.co";
const SUPABASE_KEY = "sb_publishable_OjCVGUz4jcvGZOTrA3TqOw_sZhAFR3x";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// -------------------------------------
// HTML 요소
// -------------------------------------

const landingSection = document.getElementById("landingSection");
const screeningSection = document.getElementById("screeningSection");
const processingSection = document.getElementById("processingSection");

const enterBtn = document.getElementById("enterBtn");
const nextBtn = document.getElementById("nextBtn");

const questionProgress = document.getElementById("questionProgress");
const questionText = document.getElementById("questionText");
const choiceList = document.getElementById("choiceList");

const result = document.getElementById("result");
const countEl = document.getElementById("count");
const citizenList = document.getElementById("citizenList");


// -------------------------------------
// Screening 질문
//
// value 값은 나중에 라인 형태를 결정할 때 사용
// -------------------------------------

const questions = [
  {
    id: "q1",
    question:
      "You noticed something unusual today. What was it?",
    choices: [
      {
        label: "A pattern where it shouldn't be?",
        value: "1pattern"
      },
      {
        label: "People acting differently?",
        value: "1people"
      },
      {
        label: "Unusual? What are you talking about?",
        value: "1unusual"
      }
    ]
  },

  {
    id: "q2",
    question:
      "Others started noticing it too. What did you do?",
    choices: [
      {
        label: "Noticing what?",
        value: "2ignore"
      },
      {
        label: "I investigated further.",
        value: "2investigate"
      },
      {
        label: "I waited and watched in my room.",
        value: "2wait"
      }
    ]
  },

  {
    id: "q3",
    question:
      "But what is 'it' that we're talking about? How would you describe it?",
    choices: [
      {
        label: "A warning. We should be scared.",
        value: "3warning"
      },
      {
        label: "How am I supposed to know?",
        value: "3unexplained"
      },
      {
        label: "Nothing important, probably.",
        value: "3unimportant"
      }
    ]
  },

  {
    id: "q4",
    question:
      "If it appeared again today, what would you do?",
    choices: [
      {
        label: "Get closer. I want to know what it is.",
        value: "4closer"
      },
      {
        label: "Tell someone.",
        value: "4tell"
      },
      {
        label: "I'm so lost. I just want to go home.",
        value: "4lost"
      }
    ]
  }
];


// -------------------------------------
// Screening 진행 상태
// -------------------------------------

let currentQuestionIndex = 0;

// 최종 답변이 들어갈 객체
const answers = {};

// 현재 질문에서 선택한 값
let selectedValue = null;


// -------------------------------------
// 시민 번호를 00001 형식으로 변환
// -------------------------------------

function formatCitizenNumber(number) {
  return String(number).padStart(5, "0");
}


// -------------------------------------
// 전체 Citizen 수 가져오기
// -------------------------------------

async function getCitizenCount() {
  const { count, error } = await db
    .from("citizens")
    .select("*", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error("Count Error:", error);
    return null;
  }

  return count;
}


// -------------------------------------
// Population 및 최근 Citizen 목록 표시
// -------------------------------------

async function loadCitizens() {
  const count = await getCitizenCount();

  if (count === null) {
    return;
  }

  countEl.textContent = count;

  const { data, error } = await db
    .from("citizens")
    .select("citizen_number")
    .order("citizen_number", {
      ascending: false
    })
    .limit(14);

  if (error) {
    console.error("Recent Citizens Error:", error);
    return;
  }

  citizenList.innerHTML = data
    .map(
      citizen =>
        `<div>
          Citizen #${formatCitizenNumber(
            citizen.citizen_number
          )}
        </div>`
    )
    .join("");
}


// -------------------------------------
// Screening 시작
// -------------------------------------

function startScreening() {
  const screeningComplete =
    localStorage.getItem("screening_complete");

  const existingCitizen =
    localStorage.getItem("citizen_number");

  // 이미 입국 심사를 완료한 경우
  if (screeningComplete === "true" && existingCitizen) {
    showFinalResult(
      existingCitizen,
      "Already registered.<br>Screening complete."
    );

    return;
  }

  landingSection.classList.add("hidden");
  result.classList.add("hidden");

  screeningSection.classList.remove("hidden");

  currentQuestionIndex = 0;

  showQuestion();
}


// -------------------------------------
// 현재 질문 표시
// -------------------------------------

function showQuestion() {
  const currentQuestion =
    questions[currentQuestionIndex];

  selectedValue = null;

  nextBtn.disabled = true;

  questionProgress.textContent =
    `SCREENING ${currentQuestionIndex + 1} / ${questions.length}`;

  questionText.textContent =
    currentQuestion.question;

  choiceList.innerHTML = "";

  currentQuestion.choices.forEach(choice => {
    const button =
      document.createElement("button");

    button.className = "choice-button";
    button.textContent = choice.label;

    button.addEventListener("click", () => {
      selectChoice(button, choice.value);
    });

    choiceList.appendChild(button);
  });

  // 마지막 문항에서는 버튼 문구 변경
  nextBtn.textContent =
    currentQuestionIndex === questions.length - 1
      ? "SUBMIT"
      : "NEXT";
}


// -------------------------------------
// 선택지 클릭 처리
// -------------------------------------

function selectChoice(selectedButton, value) {
  const choiceButtons =
    document.querySelectorAll(".choice-button");

  // 기존 선택 표시 제거
  choiceButtons.forEach(button => {
    button.classList.remove("selected");
  });

  selectedButton.classList.add("selected");

  selectedValue = value;

  nextBtn.disabled = false;
}


// -------------------------------------
// 다음 질문으로 이동
// -------------------------------------

function goToNextQuestion() {
  if (!selectedValue) {
    return;
  }

  const currentQuestion =
    questions[currentQuestionIndex];

  // 현재 답변 저장
  answers[currentQuestion.id] =
    selectedValue;

  // 다음 질문이 남아 있는 경우
  if (
    currentQuestionIndex <
    questions.length - 1
  ) {
    currentQuestionIndex += 1;

    showQuestion();

    return;
  }

  // 마지막 질문이면 완료 처리
  completeScreening();
}


// -------------------------------------
// 새 Citizen 생성
// -------------------------------------

async function createCitizen() {
  // 기존 Citizen이 있으면 그대로 사용
  const existingCitizen =
    localStorage.getItem("citizen_number");

  if (existingCitizen) {
    return Number(existingCitizen);
  }

  const count = await getCitizenCount();

  if (count === null) {
    throw new Error(
      "Could not retrieve citizen count."
    );
  }

  const newNumber = count + 1;

  const { error } = await db
    .from("citizens")
    .insert({
      citizen_number: newNumber
    });

  if (error) {
    throw error;
  }

  localStorage.setItem(
    "citizen_number",
    String(newNumber)
  );

  return newNumber;
}


// -------------------------------------
// Screening 답변을 Supabase에 저장
// -------------------------------------

async function saveScreening(
  citizenNumber
) {
  const { error } = await db
    .from("screenings")
    .insert({
      citizen_number: citizenNumber,
      q1: answers.q1,
      q2: answers.q2,
      q3: answers.q3,
      q4: answers.q4
    });

  if (error) {
    throw error;
  }
}


// -------------------------------------
// Screening 완료 처리
// -------------------------------------

async function completeScreening() {
  screeningSection.classList.add("hidden");

  processingSection.classList.remove("hidden");

  try {
    // Citizen 생성 또는 기존 번호 가져오기
    const citizenNumber =
      await createCitizen();

    // 답변 저장
    await saveScreening(citizenNumber);

    // 같은 브라우저에서 재응답 방지
    localStorage.setItem(
      "screening_complete",
      "true"
    );

    // 처리 화면을 잠깐 보여준 뒤 결과 표시
    setTimeout(() => {
      processingSection.classList.add("hidden");

      showFinalResult(
        citizenNumber,
        `
          Screening complete.<br>
          Response recorded.<br>
          Trace pending.
        `
      );

      loadCitizens();
    }, 1500);

  } catch (error) {
    console.error(
      "Screening Error:",
      error
    );

    processingSection.classList.add("hidden");

    result.classList.remove("hidden");

    result.innerHTML = `
      Registration failed.<br>
      Please try again.
    `;
  }
}


// -------------------------------------
// 최종 결과 표시
// -------------------------------------

function showFinalResult(
  citizenNumber,
  message
) {
  landingSection.classList.add("hidden");
  screeningSection.classList.add("hidden");
  processingSection.classList.add("hidden");

  result.classList.remove("hidden");

  result.innerHTML = `
    <h2>
      Citizen #${formatCitizenNumber(
        citizenNumber
      )}
    </h2>

    <p>${message}</p>
  `;
}


// -------------------------------------
// 이벤트 연결
// -------------------------------------

enterBtn.addEventListener(
  "click",
  startScreening
);

nextBtn.addEventListener(
  "click",
  goToNextQuestion
);


// -------------------------------------
// 페이지가 열릴 때 Citizen 데이터 표시
// -------------------------------------

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