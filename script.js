/* ===========================
   Global Variables
=========================== */
window.selectedColor = "#FF0000";
window.starStates = [];

/* ===========================
   Rank Computation
=========================== */
function computeRank(totalStars) {
  if (totalStars >= 76) return 'S';
  if (totalStars >= 61) return 'A';
  if (totalStars >= 46) return 'B';
  if (totalStars >= 31) return 'C';
  if (totalStars >= 16) return 'D';
  return 'E';
}

/* ===========================
   Star Creation & Rendering
=========================== */
function createStar(filled = false) {
  const svgNS = "http://www.w3.org/2000/svg";
  const star = document.createElementNS(svgNS, "svg");
  star.setAttribute("viewBox", "0 0 24 24");
  const color = filled ? window.selectedColor : 'white';
  star.innerHTML = `<polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="${color}"/>`;
  return star;
}

function initializeStarStates() {
  const starLines = document.querySelectorAll('.star-line');
  window.starStates = [];
  starLines.forEach(() => window.starStates.push(0));
}

function renderAllStars(readOnly = false) {
  const starLines = document.querySelectorAll('.star-line');
  
  starLines.forEach((line, lineIndex) => {
    const starsContainer = line.querySelector('.stars');
    const clearBtn = line.querySelector('.clear-btn');
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
      const isFilled = i < window.starStates[lineIndex];
      const star = createStar(isFilled);
      star.dataset.index = i;
      starsContainer.appendChild(star);
    }
    
    const starSpans = starsContainer.querySelectorAll('svg');
    
    if (!readOnly) {
      starSpans.forEach(span => {
        span.addEventListener('mouseenter', () => {
          const index = parseInt(span.dataset.index);
          starSpans.forEach((s, i) => s.classList.toggle('hover', i <= index));
        });
        span.addEventListener('mouseleave', () => {
          starSpans.forEach(s => s.classList.remove('hover'));
        });
        span.addEventListener('click', () => {
          const index = parseInt(span.dataset.index);
          window.starStates[lineIndex] = index + 1;
          renderAllStars();
          updateRank();
        });
      });

      clearBtn.onclick = () => {
        window.starStates[lineIndex] = 0;
        renderAllStars();
        updateRank();
      };
    } else {
      clearBtn.style.display = 'none';
    }
  });
}

/* ===========================
   Update Rank
=========================== */
function updateRank() {
  const total = window.starStates.reduce((sum, count) => sum + count, 0);
  const rankDisplay = document.getElementById('rank-display');
  if (rankDisplay) {
    rankDisplay.innerText = computeRank(total);
    rankDisplay.style.color = window.selectedColor;
  }
}

/* ===========================
   Initialize Page
=========================== */
function initialize() {
  // Color palette
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.selectedColor = btn.dataset.color;
      renderAllStars();
      updateRank();
    });
  });

  // Panel page initialization
  if (document.getElementById('panel-wrapper')) {
    initializeStarStates();
    renderAllStars();
    updateRank();

    const clearAllBtn = document.getElementById('clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        window.starStates = window.starStates.map(() => 0);
        renderAllStars();
        updateRank();
      });
    }

    // Download screenshot
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const panel = document.getElementById('panel-wrapper');
        const sidebar = document.getElementById('top-sidebar');
        const clearButtons = panel.querySelectorAll('.clear-btn');
        sidebar.style.display = 'none';
        clearButtons.forEach(btn => btn.style.display = 'none');

        const input = document.getElementById('player-name-input');
        const tempSpan = document.createElement('span');
        tempSpan.innerText = input.value || 'player';
        tempSpan.style.fontSize = getComputedStyle(input).fontSize;
        tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
        tempSpan.style.color = getComputedStyle(input).color;
        tempSpan.style.marginLeft = input.style.marginLeft;
        input.style.display = 'none';
        input.parentNode.appendChild(tempSpan);

        html2canvas(panel, { backgroundColor: '#ffffff', scrollY: -window.scrollY, scrollX: -window.scrollX })
          .then(canvas => {
            const link = document.createElement('a');
            link.download = `${tempSpan.innerText}的面板.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();

            // Restore
            input.style.display = '';
            tempSpan.remove();
            sidebar.style.display = '';
            clearButtons.forEach(btn => btn.style.display = '');
          });
      });
    }
  }

  // Data page initialization
  if (document.getElementById('player-list')) {
    fetch('data/players.tsv')
      .then(response => response.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split('\t');
        const players = lines.slice(1).map(line => {
          const fields = line.split('\t');
          const obj = {};
          headers.forEach((h, i) => obj[h] = fields[i]);
          return obj;
        });

        const listEl = document.getElementById('player-list');
        players.forEach((p, idx) => {
          const li = document.createElement('li');
          li.textContent = p.name;
          li.style.cursor = 'pointer';
          li.addEventListener('click', () => renderPlayerPanel(p));
          listEl.appendChild(li);
        });
      });
  }
}

/* ===========================
   Render Player on Data Page
=========================== */
function renderPlayerPanel(player) {
  window.selectedColor = player.color || '#FF0000';
  const panel = document.getElementById('panel-wrapper');
  panel.innerHTML = `
    <h1>${player.name}</h1>
    <div class="top-row">
      <div class="column">
        <label>玩家名</label>
        <span id="rank-display"></span>
      </div>
    </div>
    <div class="columns-container">
      <!-- Columns will be filled dynamically -->
      <div class="column-content" id="left-column"></div>
      <div class="column-content" id="right-column"></div>
    </div>
  `;

  // Fill star lines
  const leftFields = ['获胜能力','布标能力','地盘兵力运营','竞标运营','战斗将卡运营','大局观','抢七阻七','思考效率','阴谋规划','预防背刺','信用'];
  const rightFields = ['基础规则','官方变体','社区规则','娱乐玩法','高难对局场次','赛事活跃度','知名度','招新贡献','多媒体攻略分享'];

  window.starStates = [];

  function createStarLine(field) {
    const stars = Array.from({length:5}, (_,i) => i < (player[field]||0) ? 1 : 0);
    window.starStates.push(stars.filter(s=>s).length);
    const line = document.createElement('div');
    line.className = 'star-line';
    line.innerHTML = `<span class="label-text">${field}</span><span class="stars"></span><button class="clear-btn">清空</button>`;
    return line;
  }

  const leftCol = document.getElementById('left-column');
  leftFields.forEach(f => leftCol.appendChild(createStarLine(f)));

  const rightCol = document.getElementById('right-column');
  rightFields.forEach(f => rightCol.appendChild(createStarLine(f)));

  renderAllStars(true); // read-only
  updateRank();
}

/* ===========================
   Start
=========================== */
document.addEventListener('DOMContentLoaded', initialize);
