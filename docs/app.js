const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuButton && siteNav) {
  const closeMenu = (returnFocus = false) => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "Menu";
    siteNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    if (returnFocus) menuButton.focus();
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    if (!open) {
      closeMenu();
      return;
    }
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = "Close";
    siteNav.classList.add("open");
    document.body.classList.add("menu-open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("open")) closeMenu(true);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.classList.contains("open")) return;
    if (!siteNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  window.matchMedia("(min-width: 1161px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}

if (siteNav) {
  // On narrow screens the nav is a horizontal strip; fade whichever edge still has links beyond it.
  const updateNavCue = () => {
    const hiddenRight = siteNav.scrollWidth - siteNav.clientWidth - siteNav.scrollLeft;
    siteNav.classList.toggle("nav-more-left", siteNav.scrollLeft > 4);
    siteNav.classList.toggle("nav-more-right", hiddenRight > 4);
  };

  const currentLink = siteNav.querySelector('[aria-current="page"]');
  if (currentLink && siteNav.scrollWidth > siteNav.clientWidth) {
    siteNav.scrollLeft = Math.max(0, currentLink.offsetLeft - siteNav.offsetLeft - 48);
  }

  siteNav.addEventListener("scroll", updateNavCue, { passive: true });
  window.addEventListener("resize", updateNavCue);
  updateNavCue();
}

const architectForm = document.querySelector("#architect-form");

if (architectForm) {
  const controls = {
    device: document.querySelector("#sim-device"),
    workload: document.querySelector("#sim-workload"),
    bankN: document.querySelector("#sim-bank-n"),
    banks: document.querySelector("#sim-banks"),
    adcBits: document.querySelector("#sim-adc-bits"),
    variation: document.querySelector("#sim-variation"),
    wire: document.querySelector("#sim-wire"),
    mismatch: document.querySelector("#sim-mismatch"),
    adcNoise: document.querySelector("#sim-adc-noise")
  };

  const outputs = {
    banks: document.querySelector("#sim-banks-value"),
    adcBits: document.querySelector("#sim-adc-bits-value"),
    variation: document.querySelector("#sim-variation-value"),
    wire: document.querySelector("#sim-wire-value"),
    mismatch: document.querySelector("#sim-mismatch-value"),
    adcNoise: document.querySelector("#sim-adc-noise-value")
  };

  // Maximum SNDR_d (dB) for B_ADC = 2..10 at N = 64, from SNDR-sim/SNDRd-vs-BADC (paper Fig. 6c).
  const adcSweeps = {
    mram: [3.35, 5.52, 6.16, 6.22, 6.18, 6.13, 6.1, 6.08, 6.08],
    reram: [4.45, 9.5, 13.79, 16.31, 17.41, 17.68, 17.72, 17.73, 17.81],
    fefet: [4.46, 9.56, 13.95, 16.61, 17.79, 18.08, 18.07, 18.12, 18.21]
  };

  // baseSndr: SNDR_d anchors at B_ADC = 7 from the case study's ResNet-20 accuracy analysis.
  const profiles = {
    mram: {
      name: "MRAM",
      baseSndr: { 9: 13, 36: 12, 72: 11 },
      adcSweep: adcSweeps.mram
    },
    reram: {
      name: "ReRAM",
      baseSndr: { 9: 22, 36: 20, 72: 18.5 },
      adcSweep: adcSweeps.reram
    },
    fefet: {
      name: "FeFET",
      baseSndr: { 9: 20, 36: 21, 72: 19.5 },
      adcSweep: adcSweeps.fefet
    },
    custom: {
      name: "Custom eNVM",
      baseSndr: { 9: 18, 36: 17, 72: 16 },
      adcSweep: adcSweeps.reram
    }
  };

  const anchorBits = 7;
  const nominal = { variation: 4, wire: 25, mismatch: 5, adcNoise: 20 };

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  // SNDR_d lost (or gained) relative to the 7 b anchor, following the modeled ADC-precision sweep.
  const adcLoss = (sweep, bits) => sweep[anchorBits - 2] - sweep[bits - 2];

  function accuracyFromSndr(sndr) {
    if (sndr <= 8) return 10;
    if (sndr <= 13) return 10 + (sndr - 8) * 8.4;
    if (sndr <= 22) return 52 + (sndr - 13) * (32.5 / 9);
    return 84.5;
  }

  function renderBanks(physicalBanks, requiredBanks) {
    const bankGrid = document.querySelector("#sim-bank-grid");
    const visibleBanks = Math.min(24, physicalBanks);
    const activeBanks = Math.min(requiredBanks, physicalBanks);
    const activeVisible = activeBanks ? Math.max(1, Math.round(visibleBanks * activeBanks / physicalBanks)) : 0;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < visibleBanks; index += 1) {
      const bank = document.createElement("span");
      bank.className = `sim-bank${index < activeVisible ? " active" : ""}`;
      const label = document.createElement("b");
      label.textContent = `B${String(index + 1).padStart(2, "0")}`;
      bank.append(label);
      fragment.append(bank);
    }

    bankGrid.replaceChildren(fragment);
    bankGrid.setAttribute("aria-label", `${activeBanks} of ${physicalBanks} physical banks active in the current mapping wave`);
    document.querySelector("#sim-bank-caption").textContent = visibleBanks < physicalBanks
      ? `Showing ${visibleBanks} representative banks of ${physicalBanks}`
      : `Showing all ${physicalBanks} physical banks`;
  }

  function showValue(key, display, spoken = display) {
    outputs[key].textContent = display;
    controls[key].setAttribute("aria-valuetext", spoken);
  }

  function evaluateArchitecture() {
    const device = controls.device.value;
    const profile = profiles[device];
    const workload = Number(controls.workload.value);
    const bankN = Number(controls.bankN.value);
    const physicalBanks = Number(controls.banks.value);
    const adcBits = Number(controls.adcBits.value);
    const variation = Number(controls.variation.value);
    const wire = Number(controls.wire.value);
    const mismatch = Number(controls.mismatch.value);
    const adcNoise = Number(controls.adcNoise.value);

    showValue("banks", String(physicalBanks), `${physicalBanks} banks`);
    showValue("adcBits", `${adcBits} b`, `${adcBits} bits`);
    showValue("variation", `${variation}%`);
    showValue("wire", `${wire}%`);
    showValue("mismatch", `${mismatch}%`);
    showValue("adcNoise", `${adcNoise}%`);

    const penalties = {
      variation: (variation - nominal.variation) * 0.15,
      wire: (wire - nominal.wire) * 0.03,
      mismatch: (mismatch - nominal.mismatch) * 0.28,
      adcNoise: (adcNoise - nominal.adcNoise) * 0.025,
      conversion: adcLoss(profile.adcSweep, adcBits)
    };
    const totalPenalty = Object.values(penalties).reduce((total, value) => total + value, 0);
    const sndr = clamp(profile.baseSndr[bankN] - totalPenalty, 0, 22);
    const accuracy = accuracyFromSndr(sndr);
    const requiredBanks = Math.ceil(workload / bankN);
    const waves = Math.ceil(requiredBanks / physicalBanks);

    renderBanks(physicalBanks, requiredBanks);
    document.querySelector("#sim-chip-kicker").textContent = `${profile.name} · N = ${bankN}`;
    document.querySelector("#sim-sndr").textContent = `${sndr.toFixed(1)} dB`;
    document.querySelector("#sim-accuracy").textContent = `${accuracy.toFixed(1)}%`;
    document.querySelector("#sim-accuracy-label").textContent = device === "custom"
      ? "Illustrative accuracy proxy"
      : "Illustrative CIFAR-10 accuracy";
    document.querySelector("#sim-waves").textContent = String(waves);
    document.querySelector("#sim-mapping").textContent = `${workload.toLocaleString()} vector elements map to ${requiredBanks} banks of dimension ${bankN} in ${waves === 1 ? "one parallel wave" : `${waves} parallel waves`}.`;

    let status = "Below accuracy target";
    let statusClass = "status-low";
    if (sndr >= 21.5) {
      status = "Accuracy-oriented";
      statusClass = "";
    } else if (sndr >= 18) {
      status = "Accuracy-constrained";
      statusClass = "status-warn";
    }
    const statusElement = document.querySelector("#sim-status");
    statusElement.textContent = status;
    statusElement.className = statusClass;

    const positivePenalties = Object.entries(penalties).filter(([, value]) => value > 0);
    const dominant = positivePenalties.sort((left, right) => right[1] - left[1])[0]?.[0];
    const labels = {
      variation: "conductance variation",
      wire: "wire parasitics",
      mismatch: "current-mirror mismatch",
      adcNoise: "ADC noise"
    };

    let advice;
    if (sndr >= 21.5 && device === "reram" && bankN === 9) {
      advice = "This point reaches the reported accuracy-oriented ReRAM coordinate. Scale capacity by adding banks rather than increasing the local dot-product dimension.";
    } else if (sndr >= 21.5) {
      advice = "This point reaches the 22 dB accuracy-oriented reference. Scale capacity by adding banks rather than increasing the local dot-product dimension.";
    } else if (waves > 1 && sndr >= 18) {
      advice = `The local bank remains usable, but the workload needs ${waves} mapping waves. Add physical banks to improve throughput without increasing local N.`;
    } else if (dominant === "conversion") {
      advice = "The dominant adjustable limit is insufficient ADC precision. Add ADC bits before changing the local bank dimension.";
    } else if (dominant) {
      advice = `The dominant adjustable limit is ${labels[dominant]}. Reduce it before adding ADC precision or increasing the local bank dimension.`;
    } else if (device === "custom") {
      advice = "This normalized custom-device profile is illustrative. Replace its conductance, variation, parasitic, sensing, and ADC assumptions with measured values before drawing a device-specific conclusion.";
    } else if (bankN > 9) {
      advice = "The larger local bank reduces bank count but lowers the modeled accuracy point. Try N = 9 and recover capacity through parallel banks.";
    } else {
      advice = "This device remains below the 22 dB accuracy-oriented reference. Compare a lower-conductance ReRAM bank or reduce the active non-idealities.";
    }
    const lead = document.createElement("strong");
    lead.textContent = "Design reading:";
    document.querySelector("#sim-advice").replaceChildren(lead, ` ${advice}`);
  }

  architectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    evaluateArchitecture();
  });

  Object.values(controls).forEach((control) => control.addEventListener("input", evaluateArchitecture));
  evaluateArchitecture();
}

const cartoonStepper = document.querySelector("#cartoon-stepper");

if (cartoonStepper) {
  const steps = [
    {
      label: "Step 1 of 7 · Reference",
      title: "Begin with ideal current levels.",
      copy: "Each dot-product code maps to a discrete column-current level. The spacing I_step and the full-range current I_FR define the clean reference before non-idealities.",
      change: "Nothing yet. The levels are still discrete.",
      image: "assets/histogram-cartoon/step-1.png",
      alt: "Ideal discrete column-current levels separated by I step across the full-range current."
    },
    {
      label: "Step 2 of 7 · Device",
      title: "Device variation broadens every code.",
      copy: "Random off- and on-state conductance variation turns each ideal current into a distribution. Neighboring codes remain distinguishable only while their spreads stay below their spacing.",
      change: "Discrete levels become narrow distributions.",
      image: "assets/histogram-cartoon/step-2.png",
      alt: "Column-current levels broadened into narrow distributions by conductance variation."
    },
    {
      label: "Step 3 of 7 · Array",
      title: "Small parasitics shift levels without destroying separation.",
      copy: "At a smaller local dimension, parasitic conductance introduces nonlinearity, but the output levels remain narrow and separated.",
      change: "The range shifts, while code margin survives.",
      image: "assets/histogram-cartoon/step-3.png",
      alt: "Current distributions under a less-dominant parasitic-conductance regime."
    },
    {
      label: "Step 4 of 7 · Array",
      title: "Typical parasitics compress and reshape the current range.",
      copy: "Wire parasitics make the level spacing position dependent: left, middle, and right regions no longer share the same separation.",
      change: "Spacing becomes nonuniform across the range.",
      image: "assets/histogram-cartoon/step-4.png",
      alt: "Current distributions with nonuniform left, middle, and right spacing under typical parasitics."
    },
    {
      label: "Step 5 of 7 · Array limit",
      title: "Strong parasitics make neighboring distributions overlap.",
      copy: "As the equivalent conductance approaches its limiting behavior, the usable current range compresses and distinct dot-product codes become harder to resolve.",
      change: "The narrowest local spacing becomes the limit.",
      image: "assets/histogram-cartoon/step-5.png",
      alt: "Overlapping current distributions under a limiting parasitic-conductance regime."
    },
    {
      label: "Step 6 of 7 · Sensing",
      title: "Sensing mismatch adds state-dependent spread.",
      copy: "Current-mirror mismatch broadens the sensed distributions after the array. The left, middle, and right regions experience different output variance.",
      change: "Distribution width now depends on current level.",
      image: "assets/histogram-cartoon/step-6.png",
      alt: "Current distributions with different widths caused by current-mirror sensing mismatch."
    },
    {
      label: "Step 7 of 7 · Conversion",
      title: "ADC thermal noise broadens every level before quantization.",
      copy: "A fixed readout-noise floor spreads each current code at the conversion boundary, reducing the margin available to clipping and quantization.",
      change: "The final readout margin sets usable SNDR.",
      image: "assets/histogram-cartoon/step-7.png",
      alt: "Broad current-code distributions after ADC thermal noise is added before quantization."
    }
  ];

  const tabs = [...cartoonStepper.querySelectorAll("[data-cartoon-step]")];
  const panel = cartoonStepper.querySelector("#cartoon-panel");
  const image = cartoonStepper.querySelector("#cartoon-step-image");
  const count = cartoonStepper.querySelector("#cartoon-step-count");
  const title = cartoonStepper.querySelector("#cartoon-step-title");
  const copy = cartoonStepper.querySelector("#cartoon-step-copy");
  const change = cartoonStepper.querySelector("#cartoon-step-change");
  const previous = cartoonStepper.querySelector("#cartoon-prev");
  const next = cartoonStepper.querySelector("#cartoon-next");
  const play = cartoonStepper.querySelector("#cartoon-play");
  let activeStep = 0;
  let playback = null;

  steps.forEach((step) => {
    new Image().src = step.image;
  });

  // Render the current symbols I_step and I_FR with real subscripts.
  function setCopy(element, text) {
    const nodes = text.split(/(I_step|I_FR)/).map((part) => {
      const symbol = part.match(/^I_(step|FR)$/);
      if (!symbol) return document.createTextNode(part);
      const fragment = document.createDocumentFragment();
      const subscript = document.createElement("sub");
      subscript.textContent = symbol[1];
      fragment.append("I", subscript);
      return fragment;
    });
    element.replaceChildren(...nodes);
  }

  function renderCartoonStep(index, moveFocus = false) {
    activeStep = (index + steps.length) % steps.length;
    const step = steps[activeStep];
    image.src = step.image;
    image.alt = step.alt;
    count.textContent = step.label;
    title.textContent = step.title;
    setCopy(copy, step.copy);
    change.textContent = step.change;
    panel.setAttribute("aria-labelledby", tabs[activeStep].id);
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === activeStep;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    if (moveFocus) tabs[activeStep].focus();
  }

  function stopCartoonPlayback() {
    if (playback) window.clearInterval(playback);
    playback = null;
    play.textContent = "Play sequence";
  }

  function moveCartoonStep(offset) {
    stopCartoonPlayback();
    renderCartoonStep(activeStep + offset);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      stopCartoonPlayback();
      renderCartoonStep(index);
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      stopCartoonPlayback();
      let target = activeStep;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") target -= 1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target += 1;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = steps.length - 1;
      renderCartoonStep(target, true);
    });
  });

  previous.addEventListener("click", () => moveCartoonStep(-1));
  next.addEventListener("click", () => moveCartoonStep(1));
  play.addEventListener("click", () => {
    if (playback) {
      stopCartoonPlayback();
      return;
    }
    play.textContent = "Pause sequence";
    playback = window.setInterval(() => renderCartoonStep(activeStep + 1), 2200);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCartoonPlayback();
  });
  renderCartoonStep(0);
}
