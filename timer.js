/* ============================================================
   PLANORA – TIMER.JS | Pomodoro Study Timer Logic
   ============================================================ */
'use strict';

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let currentTimerSubjectId = null;
let currentTimerDuration = 25;

function startStudyTimer(subjectId, subjectName, durationMinutes = 25) {
  currentTimerSubjectId = subjectId;
  currentTimerDuration = durationMinutes;
  timerSeconds = durationMinutes * 60;
  isTimerRunning = true;

  const timerOverlay = document.getElementById('timerOverlay');
  const subjectEl = document.getElementById('timerSubjectName');
  const displayEl = document.getElementById('timerDisplay');
  const toggleBtn = document.getElementById('timerToggleBtn');
  const doneBtn = document.getElementById('timerDoneBtn');

  if (timerOverlay) timerOverlay.style.display = 'flex';
  if (subjectEl) subjectEl.textContent = subjectName;
  if (doneBtn) doneBtn.style.display = 'none';
  if (toggleBtn) toggleBtn.textContent = 'Pause';

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (isTimerRunning) {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        onTimerComplete();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const displayEl = document.getElementById('timerDisplay');
  if (!displayEl) return;

  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  displayEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleTimer() {
  const btn = document.getElementById('timerToggleBtn');
  isTimerRunning = !isTimerRunning;
  if (btn) btn.textContent = isTimerRunning ? 'Pause' : 'Resume';
}

function closeTimer() {
  clearInterval(timerInterval);
  const timerOverlay = document.getElementById('timerOverlay');
  if (timerOverlay) {
    timerOverlay.style.display = 'none';
    timerOverlay.classList.remove('focus-active');
  }
  isTimerRunning = false;
}

function toggleFocusMode() {
  const overlay = document.getElementById('timerOverlay');
  if (overlay) overlay.classList.toggle('focus-active');
}

function onTimerComplete() {
  isTimerRunning = false;
  const toggleBtn = document.getElementById('timerToggleBtn');
  const doneBtn = document.getElementById('timerDoneBtn');
  if (toggleBtn) toggleBtn.style.display = 'none';
  if (doneBtn) doneBtn.style.display = 'block';

  showToast('Time is up! Great session.', 'success');
}

function finishTimer() {
  // Use the actual duration of the session for XP awards
  const leveledUp = saveStudySession(currentTimerSubjectId, currentTimerDuration);
  closeTimer();

  // Refresh dashboard if it's the dashboard page
  if (typeof refreshDashboard === 'function') refreshDashboard();

  if (leveledUp) {
    showToast('🎊 LEVEL UP! You are becoming a master scholar.', 'success');
  } else {
    showToast('Session saved to your progress!', 'success');
  }
}

/* ══════════════════════════════════════════════
   INLINE TIMER (DASHBOARD WIDGET)
   ══════════════════════════════════════════════ */
let twInterval = null;
let twSeconds = 25 * 60;
let isTwRunning = false;

function initInlineTimer() {
  const select = document.getElementById('twSubjectId');
  if (!select) return;
  
  const tasks = getTasks().filter(t => !t.completed);
  const currentVal = select.value;
  select.innerHTML = '<option value="">General Study</option>';
  tasks.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${escHtml(t.subject)}</option>`;
  });
  select.value = currentVal;
  
  updateTwDisplay();
}

function onTwSubjectChange() {
  const select = document.getElementById('twSubjectId');
  const input = document.getElementById('twCustomMinutes');
  if (!select || !input) return;
  
  const subjectId = select.value;
  if (!subjectId) {
    // Reset to generic 25
    input.value = 25;
  } else {
    // Get recommended time from planner
    const tasks = getTasks();
    const task = tasks.find(t => t.id === subjectId);
    if (task) {
      if (typeof calculateDailyStudy === 'function') {
        let mins = Math.round(calculateDailyStudy(task) * 60);
        // Round to nearest 5
        mins = Math.max(5, Math.round(mins / 5) * 5);
        input.value = mins;
      }
    }
  }
  onTwCustomTimeChange();
}

function onTwCustomTimeChange() {
  const input = document.getElementById('twCustomMinutes');
  if (!input) return;
  
  let mins = parseInt(input.value) || 25;
  if (mins < 1) mins = 1;
  if (mins > 300) mins = 300;
  
  twSeconds = mins * 60;
  updateTwDisplay();
}

function updateTwDisplay() {
  const el = document.getElementById('twDisplay');
  if (!el) return;
  const m = Math.floor(twSeconds / 60);
  const s = twSeconds % 60;
  el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleInlineTimer() {
  const btn = document.getElementById('twStartBtn');
  const status = document.getElementById('twStatus');
  
  if (isTwRunning) {
    clearInterval(twInterval);
    isTwRunning = false;
    if (btn) btn.textContent = 'Resume';
    if (status) status.textContent = 'Paused';
  } else {
    isTwRunning = true;
    if (btn) btn.textContent = 'Pause';
    if (status) status.textContent = 'Studying...';
    
    twInterval = setInterval(() => {
      twSeconds--;
      updateTwDisplay();
      if (twSeconds <= 0) {
        clearInterval(twInterval);
        onTwComplete();
      }
    }, 1000);
  }
}

function resetInlineTimer() {
  clearInterval(twInterval);
  isTwRunning = false;
  twSeconds = 25 * 60;
  
  const btn = document.getElementById('twStartBtn');
  const status = document.getElementById('twStatus');
  const doneBtn = document.getElementById('twDoneBtn');
  
  if (btn) btn.textContent = 'Start';
  if (status) status.textContent = 'Ready';
  if (doneBtn) doneBtn.style.display = 'none';
  
  updateTwDisplay();
}

function onTwComplete() {
  isTwRunning = false;
  const status = document.getElementById('twStatus');
  const doneBtn = document.getElementById('twDoneBtn');
  const startBtn = document.getElementById('twStartBtn');
  
  if (status) status.textContent = 'Session Complete!';
  if (doneBtn) doneBtn.style.display = 'block';
  if (startBtn) startBtn.style.display = 'none';
  
  showToast('Quick session complete! Claim your XP.', 'success');
}

function finishInlineTimer() {
  const subjectId = document.getElementById('twSubjectId')?.value || 'general';
  const input = document.getElementById('twCustomMinutes');
  const durationMins = parseInt(input?.value) || 25;

  const leveledUp = saveStudySession(subjectId, durationMins);
  
  resetInlineTimer();
  const startBtn = document.getElementById('twStartBtn');
  if (startBtn) startBtn.style.display = 'inline-block';

  if (typeof refreshDashboard === 'function') refreshDashboard();

  if (leveledUp) {
    showToast('🎊 LEVEL UP! Your focus is incredible.', 'success');
  } else {
    showToast('Quick session saved!', 'success');
  }
}
