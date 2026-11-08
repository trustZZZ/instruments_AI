(function () {
    var viewport = document.querySelector(".showcase__viewport");
    var track = document.getElementById("track");
    if (!viewport || !track) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".dot"));
    var prev = document.querySelector(".showcase__arrow--prev");
    var next = document.querySelector(".showcase__arrow--next");
    var leadTitle = document.getElementById("lead-title");
    var leadText = document.getElementById("lead-text");
    var leadCta = document.getElementById("lead-cta");
    var lead = leadTitle ? leadTitle.closest(".lead") : null;
    var barFill = document.getElementById("slide-bar");
    if (!slides.length) return;

    var REPO_URL = "https://github.com/trustZZZ/instruments_AI";

    var texts = [
        {
            title: '<span class="mark">Готовые</span> структуры<br>для Python, Web и Data',
            text: "Не нужно придумывать архитектуру с нуля. В шаблонах уже есть структура папок, документация и правила для агента.",
            cta: "Открыть библиотеку шаблонов на GitHub",
            href: REPO_URL,
            final: false
        },
        {
            title: '<span class="mark">Минимум</span> действий<br>для старта',
            text: "Шаблон уже выбран. Вам нужно только задать имя проекта и папку. Остальное система сделает сама.",
            cta: "Посмотреть код генератора на GitHub",
            href: REPO_URL,
            final: false
        },
        {
            title: '<span class="mark">Агент</span> сразу<br>берётся за задачу',
            text: "Каркас проекта готов, правила прописаны в AGENTS.md. Токены не потрачены на сборку — они пойдут только на решение вашей задачи.",
            cta: "Открыть на GitHub",
            href: REPO_URL,
            final: true
        }
    ];

    var current = 0;
    var rafId = null;
    var progressRaf = null;
    var progressStart = 0;
    var running = false;
    var DELAY = 6000;
    var DURATION = 760;

    var centers = [];
    var halves = [];
    var halfWidth = 0;
    var currentX = 0;

    function measure() {
        centers = slides.map(function (slide) {
            return slide.offsetLeft + slide.offsetWidth / 2;
        });
        halves = slides.map(function (slide) {
            return Math.max(slide.offsetWidth / 2, 1);
        });
        halfWidth = viewport.clientWidth / 2;
    }

    function paint(x) {
        currentX = x;
        track.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";

        for (var i = 0; i < slides.length; i += 1) {
            var slide = slides[i];
            var distance = Math.abs(centers[i] + x - halfWidth);
            var ratio = Math.min(distance / (halves[i] * 1.15), 1);
            var focus = 1 - ratio;

            slide.style.opacity = (0.38 + 0.62 * focus).toFixed(3);
            slide.style.transform =
                "scale(" + (0.92 + 0.08 * focus).toFixed(3) + ") translateY(" + (7 * ratio).toFixed(2) + "px)";
            slide.style.filter =
                "blur(" + (1.5 * ratio).toFixed(2) + "px) saturate(" + (0.82 + 0.18 * focus).toFixed(2) + ")";
            slide.classList.toggle("is-active", focus > 0.55);
        }
    }

    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function targetX(index) {
        return -(centers[index] - halfWidth);
    }

    function animateTo(index, instant) {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        var from = currentX;
        var to = targetX(index);

        if (instant || Math.abs(to - from) < 1) {
            paint(to);
            return;
        }

        var start = null;

        function step(now) {
            if (start === null) start = now;
            var progress = Math.min((now - start) / DURATION, 1);
            paint(from + (to - from) * easeOutExpo(progress));

            if (progress < 1) {
                rafId = window.requestAnimationFrame(step);
            } else {
                rafId = null;
                paint(to);
            }
        }

        rafId = window.requestAnimationFrame(step);
    }

    function isLast() {
        return current === slides.length - 1;
    }

    function stopProgress() {
        running = false;
        if (progressRaf) {
            window.cancelAnimationFrame(progressRaf);
            progressRaf = null;
        }
    }

    function stepProgress(now) {
        if (!running || !barFill) return;
        if (!progressStart) progressStart = now;

        var progress = Math.min((now - progressStart) / DELAY, 1);
        barFill.style.width = (progress * 100).toFixed(2) + "%";

        if (progress < 1) {
            progressRaf = window.requestAnimationFrame(stepProgress);
            return;
        }

        progressRaf = null;

        if (isLast()) {
            running = false;
            barFill.style.width = "100%";
            return;
        }

        render(current + 1);
    }

    function startProgress() {
        if (!barFill) return;

        if (isLast()) {
            stopProgress();
            barFill.style.width = "100%";
            return;
        }

        stopProgress();
        running = true;
        progressStart = 0;
        barFill.style.width = "0%";
        progressRaf = window.requestAnimationFrame(stepProgress);
    }

    function render(index, instant) {
        current = (index + slides.length) % slides.length;

        dots.forEach(function (dot, i) {
            var active = i === current;
            dot.classList.toggle("is-active", active);
            dot.setAttribute("aria-selected", active ? "true" : "false");
        });

        var text = texts[current];
        if (text) {
            if (leadTitle && leadTitle.innerHTML !== text.title) leadTitle.innerHTML = text.title;
            if (leadText) leadText.textContent = text.text;
            if (leadCta) {
                leadCta.textContent = text.cta;
                leadCta.href = text.href;
                leadCta.classList.toggle("btn--hero", !!text.final);
            }
            if (lead && !instant) {
                lead.classList.remove("is-in");
                void lead.offsetWidth;
                lead.classList.add("is-in");
            }
        }

        animateTo(current, instant);
        startProgress();
    }

    function shift(step) {
        render(current + step);
    }

    if (prev) prev.addEventListener("click", function () { shift(-1); });
    if (next) next.addEventListener("click", function () { shift(1); });

    dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
            render(i);
        });
    });

    viewport.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            shift(-1);
            event.preventDefault();
        }
        if (event.key === "ArrowRight") {
            shift(1);
            event.preventDefault();
        }
    });

    viewport.addEventListener("pointerenter", stopProgress);
    viewport.addEventListener("pointerleave", startProgress);
    viewport.addEventListener("focusin", stopProgress);
    viewport.addEventListener("focusout", startProgress);

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stopProgress();
        } else {
            startProgress();
        }
    });

    window.addEventListener("resize", function () {
        measure();
        animateTo(current, true);
    });

    measure();
    render(0, true);
})();
