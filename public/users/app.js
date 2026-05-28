import { createDuckPreview } from "/shared/duckPreview.js";

const form = document.getElementById("duck-form");
const statusText = document.getElementById("form-status");
const dateInput = form.elements.namedItem("date");
const submitButton = document.getElementById("submit-button");
const previewContainer = document.getElementById("duck-preview");
const colorFieldNames = [
  "head",
  "frontLeft",
  "frontRight",
  "rearLeft",
  "rearRight",
];
const derpyInput = form.elements.namedItem("derpy");

dateInput.value = new Date().toISOString().slice(0, 10);

function readBodyColors(source) {
  return {
    head: String(source.get("head")),
    frontLeft: String(source.get("frontLeft")),
    frontRight: String(source.get("frontRight")),
    rearLeft: String(source.get("rearLeft")),
    rearRight: String(source.get("rearRight")),
  };
}

let previewHandle = null;

if (previewContainer) {
  createDuckPreview(previewContainer, {
    colors: readBodyColors(new FormData(form)),
    derpy: Boolean(derpyInput?.checked),
  })
    .then((handle) => {
      previewHandle = handle;
    })
    .catch(() => {
      previewContainer.textContent = "3D preview unavailable.";
      previewContainer.classList.add("muted");
    });

  colorFieldNames.forEach((name) => {
    const input = form.elements.namedItem(name);
    input?.addEventListener("input", () => {
      if (!previewHandle) {
        return;
      }

      previewHandle.updateColors(readBodyColors(new FormData(form)));
    });
  });

  derpyInput?.addEventListener("input", () => {
    previewHandle?.updateDerpy(Boolean(derpyInput.checked));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  statusText.className = "muted";
  statusText.textContent = "Submitting...";

  const data = new FormData(form);
  const adjectivesRaw = String(data.get("adjectives") || "");

  let number_sum = 0;
  number_sum += Number(data.get("strength"));
  number_sum += Number(data.get("health"));
  number_sum += Number(data.get("focus"));
  number_sum += Number(data.get("intelligence"));
  number_sum += Number(data.get("kindness"));
  if (number_sum > 20 || number_sum <= 0) {
    statusText.classList.remove("muted");
    statusText.classList.add("error");
    submitButton.disabled = false;
    statusText.innerHTML = "Attributes MUST be under 20.";
    return;
  }

  const payload = {
    name: String(data.get("name") || "").trim(),
    assembler: String(data.get("assembler") || "").trim(),
    adjectives: adjectivesRaw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    body: {
      // ...readBodyColors(data) - changed because we need base color strings
      // this solution is pretty bad but it gets the job done for now
      head: String(data.get("head") || "#f0d35f"),
      frontLeft: String(data.get("frontLeft") || "#e9bc4f"),
      frontRight: String(data.get("frontRight") || "#d88f3d"),
      rearLeft: String(data.get("rearLeft") || "#9f6f2b"),
      rearRight: String(data.get("rearRight") || "#6f4b1f"),
    },
    derpy: data.get("derpy") === "on",
    bio: String(data.get("bio") || "").trim(),
    date: String(data.get("date") || ""),
    approved: false,
    stats: {
      strength: Number(data.get("strength") || 1),
      health: Number(data.get("health") || 1),
      focus: Number(data.get("focus") || 1),
      intelligence: Number(data.get("intelligence") || 1),
      kindness: Number(data.get("kindness") || 1),
    },
  };

  try {
    const response = await fetch("/ducks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      submitButton.disabled = false;
      throw new Error("Request failed.");
    }

    dateInput.value = new Date().toISOString().slice(0, 10);
    previewHandle?.updateColors(readBodyColors(new FormData(form)));
    previewHandle?.updateDerpy(Boolean(derpyInput?.checked));
    statusText.className = "ok";
    statusText.textContent = "Duck request sent. Waiting for admin approval.";
    window.location.assign("/form-submitted");
  } catch (error) {
    submitButton.disabled = false;
    statusText.className = "error";
    statusText.textContent =
      "Could not submit request. Check fields and try again.";
  }
});
