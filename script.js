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