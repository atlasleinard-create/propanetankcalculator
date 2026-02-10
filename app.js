(function () {
  var STORAGE_KEY = "propaneToolState";
  var GALLONS_PER_POUND = 4.7 / 20;

  var tankTypeEl = document.getElementById("tankType");
  var customCapacityWrapEl = document.getElementById("customCapacityWrap");
  var customCapacityEl = document.getElementById("customCapacity");
  var tareWeightEl = document.getElementById("tareWeight");
  var currentWeightEl = document.getElementById("currentWeight");
  var calculateBtnEl = document.getElementById("calculateBtn");
  var resetBtnEl = document.getElementById("resetBtn");

  var remainingOutEl = document.getElementById("remainingOut");
  var percentOutEl = document.getElementById("percentOut");
  var gallonsOutEl = document.getElementById("gallonsOut");
  var capNoteEl = document.getElementById("capNote");
  var tareNoteEl = document.getElementById("tareNote");

  function parseNum(value) {
    if (value === "" || value == null) {
      return NaN;
    }
    return Number(value);
  }

  function getCapacity() {
    if (tankTypeEl.value === "custom") {
      return parseNum(customCapacityEl.value);
    }
    return Number(tankTypeEl.value);
  }

  function formatFixed(value, digits) {
    if (!isFinite(value)) {
      return "0" + (digits > 0 ? "." + "0".repeat(digits) : "");
    }
    return value.toFixed(digits);
  }

  function showCustomCapacity() {
    var isCustom = tankTypeEl.value === "custom";
    customCapacityWrapEl.classList.toggle("hidden", !isCustom);
  }

  function saveState() {
    var state = {
      tankType: tankTypeEl.value,
      customCapacity: customCapacityEl.value,
      tareWeight: tareWeightEl.value,
      currentWeight: currentWeightEl.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      var state = JSON.parse(raw);
      tankTypeEl.value = state.tankType || "20";
      customCapacityEl.value = state.customCapacity || "";
      tareWeightEl.value = state.tareWeight || "";
      currentWeightEl.value = state.currentWeight || "";
    } catch (_err) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function setNotes(showCapNote, showTareNote) {
    capNoteEl.classList.toggle("hidden", !showCapNote);
    tareNoteEl.classList.toggle("hidden", !showTareNote);
  }

  function calculate() {
    var capacity = getCapacity();
    var tare = parseNum(tareWeightEl.value);
    var current = parseNum(currentWeightEl.value);

    var rawRemaining = current - tare;
    var hasCurrentAndTare = isFinite(current) && isFinite(tare);

    var remaining = hasCurrentAndTare ? Math.max(0, rawRemaining) : 0;
    var showCapNote = false;

    if (isFinite(capacity) && capacity > 0 && remaining > capacity) {
      remaining = capacity;
      showCapNote = true;
    }

    var percent = isFinite(capacity) && capacity > 0 ? Math.round((remaining / capacity) * 100) : 0;
    var gallons = remaining * GALLONS_PER_POUND;

    remainingOutEl.textContent = formatFixed(remaining, 1);
    percentOutEl.textContent = String(percent);
    gallonsOutEl.textContent = formatFixed(gallons, 2);

    var showTareNote = hasCurrentAndTare && current < tare;
    setNotes(showCapNote, showTareNote);
  }

  function resetAll() {
    tankTypeEl.value = "20";
    customCapacityEl.value = "";
    tareWeightEl.value = "";
    currentWeightEl.value = "";
    showCustomCapacity();
    saveState();
    calculate();
  }

  function onInputChanged() {
    showCustomCapacity();
    saveState();
    calculate();
  }

  [tankTypeEl, customCapacityEl, tareWeightEl, currentWeightEl].forEach(function (el) {
    el.addEventListener("input", onInputChanged);
    el.addEventListener("change", onInputChanged);
  });

  calculateBtnEl.addEventListener("click", function () {
    calculate();
  });

  resetBtnEl.addEventListener("click", function () {
    resetAll();
  });

  loadState();
  showCustomCapacity();
  calculate();
})();
