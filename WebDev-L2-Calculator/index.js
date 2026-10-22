// Synthesized Audio Feedback
class SoundFX {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq = 600, duration = 0.05, type = "sine") {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio playback issue", e);
        }
    }
}

const sfx = new SoundFX();

// Interactive Gold Dust Particle Background
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.8 + 0.8,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    alpha: Math.random() * 0.6 + 0.2,
}));

let mouse = { x: width / 2, y: height / 2 };
window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function animateParticles() {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.body.getAttribute("data-theme") !== "light";
    const particleColor = isDark ? "212, 175, 55" : "180, 135, 25";

    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Gentle mouse force interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
            p.x += (dx / dist) * 0.6;
            p.y += (dy / dist) * 0.6;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
        ctx.fill();
    });

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Calculator Logic & Controller
class Calculator {
    constructor() {
        this.displayEl = document.getElementById("display");
        this.expressionEl = document.getElementById("expression");
        this.historyListEl = document.getElementById("historyList");

        this.currentInput = "0";
        this.expression = "";
        this.history = [];
        this.isEvaluated = false;

        this.initEventListeners();
    }

    updateDisplay() {
        this.displayEl.value = this.currentInput;
        this.expressionEl.innerText = this.expression;
    }

    appendChar(char) {
        if (this.isEvaluated) {
            if ("0123456789.".includes(char)) {
                this.currentInput = char === "." ? "0." : char;
                this.expression = "";
            } else {
                this.expression = this.currentInput + " " + char + " ";
                this.currentInput = "0";
            }
            this.isEvaluated = false;
            return;
        }

        if ("0123456789".includes(char)) {
            if (this.currentInput === "0") {
                this.currentInput = char;
            } else {
                this.currentInput += char;
            }
        } else if (char === ".") {
            if (!this.currentInput.includes(".")) {
                this.currentInput += ".";
            }
        } else if ("+-*/%".includes(char)) {
            this.expression += this.currentInput + " " + char + " ";
            this.currentInput = "0";
        }
    }

    clear() {
        this.currentInput = "0";
        this.expression = "";
        this.isEvaluated = false;
    }

    backspace() {
        if (this.isEvaluated) {
            this.clear();
            return;
        }
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = "0";
        }
    }

    calculate() {
        try {
            const fullExpr = this.expression + this.currentInput;
            if (!fullExpr) return;

            let sanitized = fullExpr
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-");

            sanitized = sanitized.replace(/(\d+(\.\d+)?)\%/g, "($1/100)");

            const result = Function(`"use strict"; return (${sanitized})`)();

            if (isNaN(result) || !isFinite(result)) {
                throw new Error("Invalid");
            }

            const formattedResult = Number.isInteger(result)
                ? result.toString()
                : parseFloat(result.toFixed(8)).toString();

            this.addHistory(fullExpr, formattedResult);

            this.expression = fullExpr + " =";
            this.currentInput = formattedResult;
            this.isEvaluated = true;

            // Trigger Golden Display Pulse
            this.displayEl.classList.remove("pulse-result");
            void this.displayEl.offsetWidth;
            this.displayEl.classList.add("pulse-result");

            sfx.playTone(880, 0.08, "triangle");
        } catch (err) {
            this.currentInput = "Error";
            this.isEvaluated = true;
            sfx.playTone(220, 0.15, "sawtooth");
        }
    }

    addHistory(expr, result) {
        this.history.unshift({ expr, result });
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyListEl.innerHTML = '<div class="text-center text-muted my-4">No history yet</div>';
            return;
        }

        this.historyListEl.innerHTML = this.history
            .map(
                (item, idx) => `
              <div class="history-item" data-idx="${idx}">
                <div class="history-expr">${item.expr}</div>
                <div class="history-res">= ${item.result}</div>
              </div>`
            )
            .join("");

        document.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = el.getAttribute("data-idx");
                const item = this.history[idx];
                this.currentInput = item.result;
                this.expression = "";
                this.isEvaluated = true;
                this.updateDisplay();
                sfx.playTone(650, 0.05);
            });
        });
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
    }

    initEventListeners() {
        document.querySelectorAll(".calc-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                this.createRipple(e, btn);

                const val = btn.getAttribute("data-value");
                if (val) {
                    this.appendChar(val);
                    sfx.playTone(580, 0.04);
                } else if (btn.id === "clearBtn") {
                    this.clear();
                    sfx.playTone(380, 0.06);
                } else if (btn.id === "backBtn") {
                    this.backspace();
                    sfx.playTone(480, 0.04);
                } else if (btn.id === "equalBtn") {
                    this.calculate();
                }

                this.updateDisplay();
            });
        });

        // Keyboard Shortcuts
        window.addEventListener("keydown", (e) => {
            let key = e.key;

            if ("0123456789./*-+%".includes(key)) {
                this.appendChar(key);
                this.animateBtnPress(key);
                sfx.playTone(580, 0.04);
            } else if (key === "Enter" || key === "=") {
                e.preventDefault();
                this.calculate();
                this.animateBtnPress("=");
            } else if (key === "Backspace") {
                this.backspace();
                this.animateBtnPress("back");
                sfx.playTone(480, 0.04);
            } else if (key === "Escape" || key.toLowerCase() === "c") {
                this.clear();
                this.animateBtnPress("clear");
                sfx.playTone(380, 0.06);
            }

            this.updateDisplay();
        });

        document.getElementById("clearHistory").addEventListener("click", () => {
            this.clearHistory();
            sfx.playTone(320, 0.08);
        });
    }

    createRipple(event, button) {
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        const ripple = button.getElementsByClassName("ripple")[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    animateBtnPress(key) {
        let btn;
        if (key === "back") btn = document.getElementById("backBtn");
        else if (key === "clear") btn = document.getElementById("clearBtn");
        else if (key === "=") btn = document.getElementById("equalBtn");
        else btn = document.querySelector(`[data-value="${key}"]`);

        if (btn) {
            btn.classList.add("pressed");
            setTimeout(() => btn.classList.remove("pressed"), 150);
        }
    }
}

const calc = new Calculator();

// Theme Switcher Controller
const themeBtn = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");
let currentTheme = "dark";

themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", currentTheme);
    themeIcon.className = currentTheme === "dark" ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
    sfx.playTone(720, 0.05);
});

// Sound Switcher Controller
const soundBtn = document.getElementById("soundBtn");
const soundIcon = document.getElementById("soundIcon");

soundBtn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    soundIcon.className = sfx.enabled ? "bi bi-volume-up-fill" : "bi bi-volume-mute-fill";
    if (sfx.enabled) sfx.playTone(600, 0.05);
});
