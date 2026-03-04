import { createDuckPreview } from "/shared/duckPreview.js";

const listEl = document.getElementById("pending-list");
const statusEl = document.getElementById("admin-status");
const refreshBtn = document.getElementById("refresh");
const previewHandles = new Set();

function renderCard(duck) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = `${duck.name} by ${duck.assember}`;

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
  createDuckPreview(preview, { colors: duck.body || {}, derpy: Boolean(duck.derpy) })
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
      if (!listEl.children.length) {
        listEl.innerHTML = `<div class="card"><p class="muted">No pending requests.</p></div>`;
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

async function loadPending() {
  previewHandles.forEach((handle) => handle.dispose());
  previewHandles.clear();

  statusEl.className = "muted";
  statusEl.textContent = "Loading...";
  listEl.innerHTML = "";

  try {
    const response = await fetch("/ducks");
    if (!response.ok) {
      throw new Error("Could not load requests.");
    }

    const ducks = await response.json();
    const pending = ducks.filter((duck) => !duck.approved);

    if (!pending.length) {
      listEl.innerHTML = `<div class="card"><p class="muted">No pending requests.</p></div>`;
    } else {
      pending.forEach((duck) => {
        listEl.append(renderCard(duck));
      });
    }

    statusEl.className = "ok";
    statusEl.textContent = `Showing ${pending.length} pending request(s).`;
  } catch (error) {
    statusEl.className = "error";
    statusEl.textContent = "Could not load duck requests.";
    listEl.innerHTML = "";
  }
}

refreshBtn.addEventListener("click", loadPending);
loadPending();
