const SUPABASE_URL = "https://qmijwpakcexboqnfsgzw.supabase.co";
const SUPABASE_KEY = "sb_publishable_OjCVGUz4jcvGZOTrA3TqOw_sZhAFR3x";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const enterBtn = document.getElementById("enterBtn");
const result = document.getElementById("result");
const countEl = document.getElementById("count");
const citizenList = document.getElementById("citizenList");

async function loadCitizens() {
  // 전체 시민 수 가져오기
  const { count, error: countError } = await db
    .from("citizens")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Count Error:", countError);
    return;
  }

  countEl.textContent = count;

  // 최근 20명 가져오기
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
    .map(
      c => `<div>Citizen #${String(c.citizen_number).padStart(5, "0")}</div>`
    )
    .join("");
}

async function registerCitizen() {
  const existingCitizen = localStorage.getItem("citizen_number");

  if (existingCitizen) {
    showCitizen(existingCitizen);
    return;
  }

  const { data: allCitizens, error: countError } = await db
    .from("citizens")
    .select("citizen_number");

  if (countError) {
    console.error(countError);
    return;
  }

  const newNumber = allCitizens.length + 1;

  const { error } = await db
    .from("citizens")
    .insert({
      citizen_number: newNumber
    });

  if (error) {
    console.error(error);
    result.classList.remove("hidden");
    result.textContent = "Registration failed.";
    return;
  }

  localStorage.setItem("citizen_number", newNumber);
  showCitizen(newNumber);
  loadCitizens();
}

function showCitizen(number) {
  result.classList.remove("hidden");
  result.innerHTML = `
    Citizen #${String(number).padStart(5, "0")}<br/>
    You are now a citizen of Cyclopia.
  `;
}

enterBtn.addEventListener("click", registerCitizen);

loadCitizens();