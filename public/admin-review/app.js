import { createDuckPreview } from "/shared/duckPreview.js";

const display = document.getElementById("pending-list");
const dropDown = document.getElementById("duck-selection");
const refreshBtn = document.getElementById("refresh");
const previewHandles = new Set();

function renderCard(duck) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = `${duck.name} by ${duck.assembler}`;

  const bio = document.createElement("p");
  bio.textContent = duck.bio;

  const meta = document.createElement("p");
  meta.className = "statline";
  meta.textContent = `Date: ${new Date(duck.date).toLocaleDateString()} | Adjectives: ${duck.adjectives.join(", ")}`;

  const stats = duck.stats || {};
  const statLine = document.createElement("p");
  statLine.className = "statline";
  statLine.textContent = `STR ${stats.strength ?? "-"} | HP ${stats.health ?? "-"} | FOC ${stats.focus ?? "-"} | INT ${stats.intelligence ?? "-"} | KND ${stats.kindness ?? "-"}`;

  const derpy = document.createElement("p");
  derpy.className = "statline";
  derpy.textContent = `Derpy: ${duck.derpy ? "Yes" : "No"}`;

  const preview = document.createElement("div");
  preview.className = "duck-preview";
  preview.setAttribute("aria-label", `${duck.name} 3D preview`);

  let previewHandle = null;
  createDuckPreview(preview, {
    colors: duck.body || {},
    derpy: Boolean(duck.derpy),
  })
    .then((handle) => {
      previewHandle = handle;
      previewHandles.add(handle);
    })
    .catch(() => {
      preview.textContent = "3D preview unavailable.";
      preview.classList.add("muted");
    });

  const actions = document.createElement("div");
  actions.className = "actions";

  const approveBtn = document.createElement("button");
  approveBtn.type = "button";
  approveBtn.textContent = "Approve";

  approveBtn.addEventListener("click", async () => {
    approveBtn.disabled = true;
    approveBtn.textContent = "Approving...";

    try {
      const response = await fetch(`/ducks/${duck._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      if (!response.ok) {
        throw new Error("Could not approve.");
      }

      if (previewHandle) {
        previewHandle.dispose();
        previewHandles.delete(previewHandle);
      }
      card.remove();
      if (!display.children.length) {
        display.innerHTML = `<div class="card"><p class="muted">No pending requests.</p></div>`;
      }
    } catch (error) {
      approveBtn.disabled = false;
      approveBtn.textContent = "Approve";
      statusEl.className = "error";
      statusEl.textContent = "Failed to approve a request.";
    }
  });

  actions.append(approveBtn);
  card.append(title, meta, bio, statLine, derpy, preview, actions);
  return card;
}

function createSelect(ducks) {
  for (let duck in ducks) {
    console.log(duck);
    opt = document.createElement("option");
  }
}

async function loadPending() {
  previewHandles.forEach((handle) => handle.dispose());
  previewHandles.clear();

  display.innerHTML = "";

  try {
    const response = await fetch("/ducks");
    if (!response.ok) {
      throw new Error("Could not load requests.");
    }

    const ducks = await response.json();
    const pending = createSelect(ducks);

    if (!pending.length) {
      display.innerHTML = `<div class="card"><p class="muted">No pending requests.</p></div>`;
    } else {
      pending.forEach((duck) => {
        display.append(renderCard(duck));
      });
    }
  } catch (error) {
    display.innerHTML = "";
  }
}

refreshBtn.addEventListener("click", loadPending);
loadPending();
