import { createDuckPreview } from "/shared/duckPreview.js";

const form = document.getElementById("duck-form");
const statusText = document.getElementById("form-status");
const dateInput = form.elements.namedItem("date");
const previewContainer = document.getElementById("duck-preview");
const colorFieldNames = ["head", "front1", "front2", "back1", "back2"];
const derpyInput = form.elements.namedItem("derpy");

dateInput.value = new Date().toISOString().slice(0, 10);

function readBodyColors(source) {
  return {
    head: String(source.get("head") || "#f0d35f"),
    front1: String(source.get("front1") || "#e9bc4f"),
    front2: String(source.get("front2") || "#d88f3d"),
    back1: String(source.get("back1") || "#9f6f2b"),
    back2: String(source.get("back2") || "#6f4b1f"),
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
  statusText.className = "muted";
  statusText.textContent = "Submitting...";

  const data = new FormData(form);
  const adjectivesRaw = String(data.get("adjectives") || "");

  const payload = {
    name: String(data.get("name") || "").trim(),
    assember: String(data.get("assember") || "").trim(),
    adjectives: adjectivesRaw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    body: {
      ...readBodyColors(data),
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
      throw new Error("Request failed.");
    }

    form.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    previewHandle?.updateColors(readBodyColors(new FormData(form)));
    previewHandle?.updateDerpy(Boolean(derpyInput?.checked));
    statusText.className = "ok";
    statusText.textContent = "Duck request sent. Waiting for admin approval.";
  } catch (error) {
    statusText.className = "error";
    statusText.textContent = "Could not submit request. Check fields and try again.";
  }
});
