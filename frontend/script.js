// ===== CONFIG =====
const API_URL = "http://127.0.0.1:8000/predict";

// ===== PAGE SWITCHING =====
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
  // Show selected page
  document.getElementById("page-" + pageName).classList.add("active");

  // Update bottom nav highlight
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });
  document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add("active");
}

// ===== IMAGE UPLOAD PREVIEW =====
const fileInput = document.getElementById("fileInput");
const commonProblemsSection = document.getElementById("commonProblemsSection");
const previewImg = document.getElementById("previewImg");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultCard = document.getElementById("resultCard");

let selectedFile = null;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile = file;

  // Show preview, hide placeholder
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImg.src = event.target.result;
    previewImg.hidden = false;
    uploadPlaceholder.hidden = true;
    analyzeBtn.hidden = false;
    resultCard.hidden = true; // hide old result if any
    commonProblemsSection.hidden = true;
  };
  reader.readAsDataURL(file);
});

// ===== ANALYZE (CALL BACKEND) =====
async function analyzeImage() {
  if (!selectedFile) return;

  analyzeBtn.textContent = "Analyzing...";
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    const data = await response.json();
    showResult(data);

  } catch (err) {
    alert("Could not connect to backend. Make sure the FastAPI server is running.\n\n" + err.message);
  } finally {
    analyzeBtn.textContent = "Analyze Leaf";
    analyzeBtn.disabled = false;
  }
}

// ===== SHOW RESULT =====
function showResult(data) {
  const diseaseName = data.disease.replace(/_/g, " ");
  const confidence = data.confidence;
  const isHealthy = diseaseName.toLowerCase().includes("healthy");

  document.getElementById("resultIcon").textContent = isHealthy ? "✅" : "⚠️";
  document.getElementById("resultDisease").textContent = diseaseName;
  document.getElementById("resultConfidence").textContent = `Confidence: ${confidence}%`;
  document.getElementById("confidenceBarFill").style.width = confidence + "%";

  resultCard.hidden = false;
  analyzeBtn.hidden = true; // hide analyze button once result is shown
}

// ===== RESET FOR NEW SCAN =====
function resetDiagnose() {
  selectedFile = null;
  fileInput.value = "";
  previewImg.hidden = true;
  uploadPlaceholder.hidden = false;
  analyzeBtn.hidden = true;
  resultCard.hidden = true;
  commonProblemsSection.hidden = false;
}

// ===== CAMERA SCANNER =====
const scannerOverlay = document.getElementById("scannerOverlay");
const cameraFeed = document.getElementById("cameraFeed");
const captureCanvas = document.getElementById("captureCanvas");
let cameraStream = null;

async function openScanner() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" } // back camera on mobile
    });
    cameraFeed.srcObject = cameraStream;
    scannerOverlay.hidden = false;
  } catch (err) {
    alert("Could not access camera. Please allow camera permission, or use Upload Photo instead.\n\n" + err.message);
  }
}

function closeScanner() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  scannerOverlay.hidden = true;
}

function capturePhoto() {
  const context = captureCanvas.getContext("2d");
  captureCanvas.width = cameraFeed.videoWidth;
  captureCanvas.height = cameraFeed.videoHeight;
  context.drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);

  captureCanvas.toBlob((blob) => {
    selectedFile = new File([blob], "scan.jpg", { type: "image/jpeg" });

    const imageUrl = URL.createObjectURL(blob);
    previewImg.src = imageUrl;
    previewImg.hidden = false;
    uploadPlaceholder.hidden = true;
    analyzeBtn.hidden = false;
    resultCard.hidden = true;
    commonProblemsSection.hidden = true;
    closeScanner();
  }, "image/jpeg", 0.9);
}

// ===== CHATBOT (connects to backend /chat -> OpenRouter) =====
const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("chatInput");
const CHAT_API_URL = "http://127.0.0.1:8000/chat";

function addBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function askBot(question) {
  addBubble(question, "user");
  addBubble("Typing...", "bot");

  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question }),
    });
    const data = await response.json();

    chatWindow.removeChild(chatWindow.lastChild);
    addBubble(data.reply, "bot");
  } catch (err) {
    chatWindow.removeChild(chatWindow.lastChild);
    addBubble("Could not connect to the assistant. Please try again.", "bot");
  }
}

function sendChat() {
  const question = chatInput.value.trim();
  if (!question) return;
  askBot(question);
  chatInput.value = "";
}

// ===== EXPLORE SEARCH FILTER =====
function filterExplore() {
  const query = document.getElementById("cropSearch").value.toLowerCase().trim();

  document.querySelectorAll("#cropGrid .category-card").forEach(card => {
    const name = card.getAttribute("data-name");
    card.style.display = name.includes(query) ? "flex" : "none";
  });

  document.querySelectorAll("#diseaseList .disease-row").forEach(row => {
    const name = row.getAttribute("data-name");
    row.style.display = name.includes(query) ? "flex" : "none";
  });
}

// ===== LIVE CLOCK (status bar) =====
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  document.getElementById("liveTime").textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000 * 30); // update every 30 seconds

// ===== DISEASE DETAIL MODAL =====
const diseaseDetails = {
  "bacterial spot": { icon: "🍅", desc: "Small, dark, water-soaked spots on leaves and fruit. Spreads in warm, wet conditions. Treat with copper-based bactericides and avoid overhead watering." },
  "early blight": { icon: "🍂", desc: "Brown spots with concentric rings, usually on older leaves first. Remove affected leaves and apply fungicide." },
  "late blight": { icon: "🥀", desc: "Dark, water-soaked lesions that spread quickly in cool, wet weather. Remove infected leaves immediately and apply copper fungicide." },
  "leaf mold": { icon: "🍄", desc: "Yellow spots on top of leaves with olive-green mold underneath. Common in humid greenhouses — improve ventilation." },
  "septoria leaf spot": { icon: "🌿", desc: "Small circular spots with dark borders and gray centers. Remove infected leaves and avoid wetting foliage." },
  "spider mites": { icon: "🕸️", desc: "Stippled, discolored leaves with fine webbing. Spray with water or use insecticidal soap." },
  "target spot": { icon: "🎯", desc: "Brown lesions with concentric rings resembling a target. Apply fungicide and improve air circulation." },
  "yellow leaf curl virus": { icon: "🍋", desc: "Upward curling, yellowing leaves spread by whiteflies. Control whiteflies and remove infected plants." },
  "mosaic virus": { icon: "🧩", desc: "Mottled yellow-green patterns on leaves with stunted growth. No cure — remove infected plants and control aphids." }
};

function openDiseaseModal(key) {
  const info = diseaseDetails[key];
  if (!info) return;

  document.getElementById("modalIcon").textContent = info.icon;
  document.getElementById("modalName").textContent = key.replace(/\b\w/g, c => c.toUpperCase());
  document.getElementById("modalDesc").textContent = info.desc;
  document.getElementById("diseaseModal").hidden = false;
}

function closeDiseaseModal() {
  document.getElementById("diseaseModal").hidden = true;
}