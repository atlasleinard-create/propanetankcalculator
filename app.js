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

  var formErrorEl = document.getElementById("formError");
  var customCapacityErrorEl = document.getElementById("customCapacityError");
  var tareWeightErrorEl = document.getElementById("tareWeightError");
  var currentWeightErrorEl = document.getElementById("currentWeightError");

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

  function setFieldError(inputEl, errorEl, message) {
    var hasError = Boolean(message);
    inputEl.classList.toggle("input-error", hasError);
    inputEl.setAttribute("aria-invalid", hasError ? "true" : "false");
    errorEl.textContent = message || "";
    errorEl.classList.toggle("hidden", !hasError);
  }

  function setFormError(message) {
    formErrorEl.textContent = message || "";
    formErrorEl.classList.toggle("hidden", !message);
  }

  function validateInputs() {
    var errors = {
      customCapacity: "",
      tareWeight: "",
      currentWeight: "",
      summary: "",
    };

    var tare = parseNum(tareWeightEl.value);
    var current = parseNum(currentWeightEl.value);

    if (tareWeightEl.value.trim() === "") {
      errors.tareWeight = "Enter tare weight.";
    } else if (!isFinite(tare)) {
      errors.tareWeight = "Tare weight must be a valid number.";
    } else if (tare < 0) {
      errors.tareWeight = "Tare weight cannot be negative.";
    }

    if (currentWeightEl.value.trim() === "") {
      errors.currentWeight = "Enter current weight.";
    } else if (!isFinite(current)) {
      errors.currentWeight = "Current weight must be a valid number.";
    } else if (current < 0) {
      errors.currentWeight = "Current weight cannot be negative.";
    }

    if (tankTypeEl.value === "custom") {
      var capacity = parseNum(customCapacityEl.value);
      if (customCapacityEl.value.trim() === "") {
        errors.customCapacity = "Enter tank capacity for custom tank.";
      } else if (!isFinite(capacity)) {
        errors.customCapacity = "Tank capacity must be a valid number.";
      } else if (capacity <= 0) {
        errors.customCapacity = "Tank capacity must be greater than 0.";
      }
    }

    var hasError = Boolean(errors.customCapacity || errors.tareWeight || errors.currentWeight);
    if (hasError) {
      errors.summary = "Please fix the highlighted fields to calculate.";
    }

    return errors;
  }

  function updateValidationUI(errors) {
    setFieldError(customCapacityEl, customCapacityErrorEl, errors.customCapacity);
    setFieldError(tareWeightEl, tareWeightErrorEl, errors.tareWeight);
    setFieldError(currentWeightEl, currentWeightErrorEl, errors.currentWeight);
    setFormError(errors.summary);
  }

  function trackEvent(name, payload) {
    var data = payload || {};

    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      window.plausible(name, { props: data });
      return;
    }

    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[analytics]", name, data);
    }
  }

  function calculate(trigger) {
    if (trigger === "button") {
      trackEvent("calculation_started", {
        tankType: tankTypeEl.value,
      });
    }

    var errors = validateInputs();
    updateValidationUI(errors);

    if (errors.summary) {
      trackEvent("validation_error", {
        trigger: trigger || "unknown",
        tankType: tankTypeEl.value,
        hasCustomCapacityError: Boolean(errors.customCapacity),
        hasTareWeightError: Boolean(errors.tareWeight),
        hasCurrentWeightError: Boolean(errors.currentWeight),
      });

      remainingOutEl.textContent = "0.0";
      percentOutEl.textContent = "0";
      gallonsOutEl.textContent = "0.00";
      setNotes(false, false);
      return;
    }

    var capacity = getCapacity();
    var tare = parseNum(tareWeightEl.value);
    var current = parseNum(currentWeightEl.value);

    var rawRemaining = current - tare;
    var remaining = Math.max(0, rawRemaining);
    var showCapNote = false;

    if (isFinite(capacity) && capacity > 0 && remaining > capacity) {
      remaining = capacity;
      showCapNote = true;
    }

    var percent = Math.round((remaining / capacity) * 100);
    var gallons = remaining * GALLONS_PER_POUND;

    remainingOutEl.textContent = formatFixed(remaining, 1);
    percentOutEl.textContent = String(percent);
    gallonsOutEl.textContent = formatFixed(gallons, 2);

    var showTareNote = current < tare;
    setNotes(showCapNote, showTareNote);

    trackEvent("calculation_success", {
      trigger: trigger || "unknown",
      tankType: tankTypeEl.value,
      usedCustomCapacity: tankTypeEl.value === "custom",
    });
  }

  function resetAll() {
    tankTypeEl.value = "20";
    customCapacityEl.value = "";
    tareWeightEl.value = "";
    currentWeightEl.value = "";
    showCustomCapacity();

    setFieldError(customCapacityEl, customCapacityErrorEl, "");
    setFieldError(tareWeightEl, tareWeightErrorEl, "");
    setFieldError(currentWeightEl, currentWeightErrorEl, "");
    setFormError("");

    saveState();
    remainingOutEl.textContent = "0.0";
    percentOutEl.textContent = "0";
    gallonsOutEl.textContent = "0.00";
    setNotes(false, false);
  }

  function onInputChanged() {
    showCustomCapacity();
    saveState();
    calculate("input");
  }

  [tankTypeEl, customCapacityEl, tareWeightEl, currentWeightEl].forEach(function (el) {
    el.addEventListener("input", onInputChanged);
    el.addEventListener("change", onInputChanged);
  });

  calculateBtnEl.addEventListener("click", function () {
    calculate("button");
  });

  resetBtnEl.addEventListener("click", function () {
    resetAll();
  });

  loadState();
  showCustomCapacity();
  calculate("init");
})();
