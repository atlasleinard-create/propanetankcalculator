(function () {
  var STORAGE_KEY = "propaneToolState";
  var GALLONS_PER_POUND = 4.7 / 20;
  var KG_PER_POUND = 0.45359237;
  var L_PER_GALLON = 3.785411784;
  var USAGE_RATES = {
    low: 0.4,
    medium: 0.7,
    high: 1.2,
  };

  var tankTypeEl = document.getElementById("tankType");
  var customCapacityWrapEl = document.getElementById("customCapacityWrap");
  var customCapacityEl = document.getElementById("customCapacity");
  var tareWeightEl = document.getElementById("tareWeight");
  var currentWeightEl = document.getElementById("currentWeight");
  var usageLevelEl = document.getElementById("usageLevel");
  var unitSystemEl = document.getElementById("unitSystem");
  var calculateBtnEl = document.getElementById("calculateBtn");
  var resetBtnEl = document.getElementById("resetBtn");
  var shareResultBtnEl = document.getElementById("shareResultBtn");
  var shareStatusEl = document.getElementById("shareStatus");

  var remainingOutEl = document.getElementById("remainingOut");
  var percentOutEl = document.getElementById("percentOut");
  var gallonsOutEl = document.getElementById("gallonsOut");
  var massUnitOutEl = document.getElementById("massUnitOut");
  var volumeUnitOutEl = document.getElementById("volumeUnitOut");
  var remainingSecondaryOutEl = document.getElementById("remainingSecondaryOut");
  var volumeSecondaryOutEl = document.getElementById("volumeSecondaryOut");
  var runtimeOutEl = document.getElementById("runtimeOut");
  var capNoteEl = document.getElementById("capNote");
  var tareNoteEl = document.getElementById("tareNote");

  var formErrorEl = document.getElementById("formError");
  var customCapacityErrorEl = document.getElementById("customCapacityError");
  var tareWeightErrorEl = document.getElementById("tareWeightError");
  var currentWeightErrorEl = document.getElementById("currentWeightError");
  var customCapacityLabelEl = document.getElementById("customCapacityLabel");
  var lastUnitSystem = "imperial";
  var tareWeightLabelEl = document.getElementById("tareWeightLabel");
  var currentWeightLabelEl = document.getElementById("currentWeightLabel");

  function parseNum(value) {
    if (value === "" || value == null) {
      return NaN;
    }
    return Number(value);
  }


  function toPounds(value, unitSystem) {
    return unitSystem === "metric" ? value / KG_PER_POUND : value;
  }

  function fromPounds(value, unitSystem) {
    return unitSystem === "metric" ? value * KG_PER_POUND : value;
  }


  function convertInputFields(nextUnit) {
    var prevUnit = lastUnitSystem || "imperial";
    if (prevUnit === nextUnit) return;

    [customCapacityEl, tareWeightEl, currentWeightEl].forEach(function (el) {
      var raw = parseNum(el.value);
      if (!isFinite(raw)) return;
      var pounds = toPounds(raw, prevUnit);
      var converted = nextUnit === "metric" ? fromPounds(pounds, "metric") : pounds;
      el.value = formatFixed(converted, nextUnit === "metric" ? 2 : 1);
    });

    lastUnitSystem = nextUnit;
  }

  function updateInputUnits() {
    var unitSystem = unitSystemEl.value || "imperial";
    var isMetric = unitSystem === "metric";

    customCapacityLabelEl.textContent = "Tank capacity (" + (isMetric ? "kg" : "lb") + ")";
    tareWeightLabelEl.textContent = "Tare Weight (TW) (" + (isMetric ? "kg" : "lb") + ")";
    currentWeightLabelEl.textContent = "Current weight (" + (isMetric ? "kg" : "lb") + ")";

    customCapacityEl.placeholder = isMetric ? "e.g. 9.1" : "e.g. 20";
    tareWeightEl.placeholder = isMetric ? "e.g. 11.3" : "e.g. 25.0";
    currentWeightEl.placeholder = isMetric ? "e.g. 16.8" : "e.g. 37.0";
  }

  function getCapacity() {
    if (tankTypeEl.value === "custom") {
      var customValue = parseNum(customCapacityEl.value);
      return toPounds(customValue, unitSystemEl.value || "imperial");
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

  function getUsageLabel(level) {
    if (level === "low") {
      return "Low";
    }
    if (level === "high") {
      return "High";
    }
    return "Medium";
  }

  function updateRuntime(gallons) {
    var usageLevel = usageLevelEl.value || "medium";
    var burnRate = USAGE_RATES[usageLevel] || USAGE_RATES.medium;
    var hours = burnRate > 0 ? gallons / burnRate : 0;
    runtimeOutEl.textContent = "Estimated runtime: " + formatFixed(hours, 1) + " hours at " + getUsageLabel(usageLevel) + " use.";
  }

  function getShareText() {
    var remaining = remainingOutEl.textContent || "0.0";
    var percent = percentOutEl.textContent || "0";
    var gallons = gallonsOutEl.textContent || "0.00";
    var massUnit = massUnitOutEl.textContent || "lb";
    var volumeUnit = volumeUnitOutEl.textContent || "gal";
    var usage = getUsageLabel(usageLevelEl.value || "medium");
    var runtime = runtimeOutEl.textContent.replace("Estimated runtime: ", "") || "0.0 hours";

    return (
      "Propane update: ~" +
      remaining +
      " " +
      massUnit +
      " left (" +
      percent +
      "% full, ~" +
      gallons +
      " " +
      volumeUnit +
      "). Runtime estimate: " +
      runtime +
      " at " +
      usage +
      " use."
    );
  }

  function setShareStatus(message) {
    shareStatusEl.textContent = message || "";
    shareStatusEl.classList.toggle("hidden", !message);
  }

  function saveState() {
    var state = {
      tankType: tankTypeEl.value,
      customCapacity: customCapacityEl.value,
      tareWeight: tareWeightEl.value,
      currentWeight: currentWeightEl.value,
      usageLevel: usageLevelEl.value,
      unitSystem: unitSystemEl.value,
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
      usageLevelEl.value = state.usageLevel || "medium";
      unitSystemEl.value = state.unitSystem || "imperial";
      lastUnitSystem = unitSystemEl.value || "imperial";
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
    massUnitOutEl.textContent = "lb";
    volumeUnitOutEl.textContent = "gal";
    remainingSecondaryOutEl.textContent = "0.00 kg";
    volumeSecondaryOutEl.textContent = "0.00 L";
      updateRuntime(0);
      setNotes(false, false);
      return;
    }

    var capacity = getCapacity();
    var unitSystem = unitSystemEl.value || "imperial";
    var tare = parseNum(tareWeightEl.value);
    var current = parseNum(currentWeightEl.value);
    var tareLb = toPounds(tare, unitSystem);
    var currentLb = toPounds(current, unitSystem);

    var rawRemaining = currentLb - tareLb;
    var remaining = Math.max(0, rawRemaining);
    var showCapNote = false;

    if (isFinite(capacity) && capacity > 0 && remaining > capacity) {
      remaining = capacity;
      showCapNote = true;
    }

    var percent = Math.round((remaining / capacity) * 100);
    var gallons = remaining * GALLONS_PER_POUND;

    var remainingKg = remaining * KG_PER_POUND;
    var liters = gallons * L_PER_GALLON;

    if (unitSystem === "metric") {
      remainingOutEl.textContent = formatFixed(remainingKg, 2);
      massUnitOutEl.textContent = "kg";
      remainingSecondaryOutEl.textContent = formatFixed(remaining, 1) + " lb";

      gallonsOutEl.textContent = formatFixed(liters, 2);
      volumeUnitOutEl.textContent = "L";
      volumeSecondaryOutEl.textContent = formatFixed(gallons, 2) + " gal";
    } else {
      remainingOutEl.textContent = formatFixed(remaining, 1);
      massUnitOutEl.textContent = "lb";
      remainingSecondaryOutEl.textContent = formatFixed(remainingKg, 2) + " kg";

      gallonsOutEl.textContent = formatFixed(gallons, 2);
      volumeUnitOutEl.textContent = "gal";
      volumeSecondaryOutEl.textContent = formatFixed(liters, 2) + " L";
    }

    percentOutEl.textContent = String(percent);
    updateRuntime(gallons);

    var showTareNote = currentLb < tareLb;
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
    usageLevelEl.value = "medium";
    unitSystemEl.value = "imperial";
    lastUnitSystem = "imperial";
    showCustomCapacity();
    updateInputUnits();

    setFieldError(customCapacityEl, customCapacityErrorEl, "");
    setFieldError(tareWeightEl, tareWeightErrorEl, "");
    setFieldError(currentWeightEl, currentWeightErrorEl, "");
    setFormError("");

    saveState();
    remainingOutEl.textContent = "0.0";
    percentOutEl.textContent = "0";
    gallonsOutEl.textContent = "0.00";
    massUnitOutEl.textContent = "lb";
    volumeUnitOutEl.textContent = "gal";
    remainingSecondaryOutEl.textContent = "0.00 kg";
    volumeSecondaryOutEl.textContent = "0.00 L";
    updateRuntime(0);
    setNotes(false, false);
  }

  function onInputChanged() {
    var nextUnit = unitSystemEl.value || "imperial";
    convertInputFields(nextUnit);
    showCustomCapacity();
    updateInputUnits();
    saveState();
    calculate("input");
  }

  [tankTypeEl, customCapacityEl, tareWeightEl, currentWeightEl, usageLevelEl, unitSystemEl].forEach(function (el) {
    el.addEventListener("input", onInputChanged);
    el.addEventListener("change", onInputChanged);
  });

  Array.prototype.slice.call(document.querySelectorAll(".preset-btn")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var preset = btn.getAttribute("data-preset");
      if (!preset) {
        return;
      }
      tankTypeEl.value = preset;
      showCustomCapacity();
      saveState();
      calculate("preset");
    });
  });

  calculateBtnEl.addEventListener("click", function () {
    calculate("button");
  });

  resetBtnEl.addEventListener("click", function () {
    resetAll();
    setShareStatus("");
  });

  if (shareResultBtnEl) {
    shareResultBtnEl.addEventListener("click", function () {
      var text = getShareText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(function () {
            setShareStatus("Share text copied.");
          })
          .catch(function () {
            setShareStatus("Copy failed. You can copy manually from the results.");
          });
      } else {
        setShareStatus("Clipboard unavailable on this device/browser.");
      }
    });
  }

  loadState();
  lastUnitSystem = unitSystemEl.value || "imperial";
  showCustomCapacity();
  updateInputUnits();
  calculate("init");
})();
