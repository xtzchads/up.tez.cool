function updateProgressBar(totalFrozen, totalSupply, duration) {
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progressText');

    const progress = (totalFrozen / totalSupply) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress.toFixed(2)}%`;
    updateCounter(duration);

    if (progress % 5 < 0.1) {
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        progressBar.style.animation = 'pulse 0.6s';
    }
}


const totalBackgrounds = 9;
let currentBackground = Math.floor(Math.random() * (totalBackgrounds)) + 1;

let ema = 0;
let stakingRatios = [];
let cur = 0;
let initial = true;

async function fetchAndUpdateData() {
    try {
        const startTime = performance.now(); // Start measuring fetch time
        
        // Fetch Tezos staking data
        let response = await fetch("https://api.tzkt.io/v1/statistics/?sort.desc=level&limit=120");
        if (!response.ok) {
            // Retry with kukai.api.tzkt.io if fetch fails
            response = await fetch("https://kukai.api.tzkt.io/v1/statistics/?sort.desc=level&limit=120");
        }
        let data = await response.json();
        
        const fetchTime = performance.now() - startTime; // Calculate fetch time
        
        // Process Tezos data
        stakingRatios = data.map((block) => (block.totalOwnStaked + block.totalExternalStaked) / 1000000);
        ema = calculateEMA(stakingRatios, 'tezos');

        const animationDuration = Math.max(0, 30000 - fetchTime); // Adjust animation time
        
        updateProgressBar((data[0].totalOwnStaked + data[0].totalExternalStaked), data[0].totalSupply, animationDuration);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function calculateEMA(values, type) {
    if (!values.length)
        return 0;
    
    const smoothingFactor = 2 / (values.length + 1);
    let currentEma = ema;
    let isInitial = initial;
    
    if (isInitial) {
        // Initialize EMA with SMA
        const sma = values.reduce((sum, value) => sum + value, 0) / values.length;
        currentEma = sma;
            initial = false;
    }
    
    for (let i = values.length - 1; i >= 0; i--) {
        currentEma = (values[i] - currentEma) * smoothingFactor + currentEma;
    }
    
    return currentEma;
}

function updateCounter(duration) {
    const currentValue = cur;
    animateValue(currentValue, ema, duration, 'tezos');
    cur = ema;
}

function animateValue(start, end, duration, type) {
    let startTimestamp = null;
    const element = document.getElementById("realtimeData");
    
    const step = (timestamp) => {
        if (!startTimestamp)
            startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + progress * (end - start);

        // Display formatted number with tabular numerals for Tezos
        element.textContent = `Staked ꜩ: ${current.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

setInterval(fetchAndUpdateData, 30000); // Update every 30 seconds

const musicButton = document.getElementById("musicButton");
const musicIcon = document.getElementById("musicIcon");
const backgroundMusic = document.getElementById("backgroundMusic");

let currentTrack = 1;
const totalTracks = 6;

const shuffleButton = document.getElementById("shuffleButton");
const shuffleIcon = document.getElementById("shuffleIcon");

musicButton.addEventListener("click", function () {
    if (backgroundMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
});

shuffleButton.addEventListener("click", function () {
    switchTrack();
});

function playMusic() {
    backgroundMusic
    .play()
    .then(function () {
        musicIcon.src = "icons/audio.png";
        musicIcon.alt = "Pause Icon";
        musicButton.classList.add("is-playing");
    })
    .catch(function (error) {
        console.error("Failed to start audio playback:", error);
    });
}

function pauseMusic() {
    backgroundMusic.pause();
    musicIcon.src = "icons/silence.png";
    musicIcon.alt = "Audio Icon";
    musicButton.classList.remove("is-playing");
}

function switchTrack() {
    currentTrack = (currentTrack % totalTracks) + 1;
    backgroundMusic.src = `music/${currentTrack}.mp3`;
    backgroundMusic.load();
    playMusic();
}

const backgroundButton = document.getElementById("backgroundButton");
const backgroundIcon = document.getElementById("backgroundIcon");

backgroundButton.addEventListener("click", function () {
    switchBackground();
});

const preloaderVideo = document.getElementById("preloaderVideo");
const sourceElement = backgroundVideo.querySelector("source");
const preloaderSource = preloaderVideo.querySelector("source");
const overlay = document.getElementById("overlay");

async function switchBackground() {
    currentBackground = (currentBackground % totalBackgrounds) + 1;
    const videoUrl = `backgrounds/${currentBackground}.mp4`;
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    preloaderSource.src = videoUrl;
    preloaderVideo.load();
    await new Promise(resolve => {
        preloaderVideo.onloadedmetadata = resolve;
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    sourceElement.src = videoUrl;
    backgroundVideo.load();
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
    }, 100);
    preloaderVideo.onloadedmetadata = null;
}

window.onload = function () {
    switchBackground();
    fetchAndUpdateData();
    backgroundMusic.src = `music/1.mp3`;
};

// Auto-hide header on load; reveal on top-region mouse hover (desktop) or page tap (mobile)
(function initAutoHideHeader() {
    const header = document.querySelector(".header");
    if (!header) return;

    let headerHeight = header.offsetHeight || 80;
    let mobileHideTimer = null;
    const MOBILE_AUTO_HIDE_MS = 5000;

    function updateHeaderHeight() {
        const h = header.offsetHeight;
        if (h > 0) headerHeight = h;
    }

    function showHeader() {
        header.classList.remove("header-hidden");
    }

    function hideHeader() {
        if (mobileHideTimer) {
            clearTimeout(mobileHideTimer);
            mobileHideTimer = null;
        }
        header.classList.add("header-hidden");
    }

    function scheduleMobileAutoHide() {
        if (mobileHideTimer) clearTimeout(mobileHideTimer);
        mobileHideTimer = setTimeout(() => {
            header.classList.add("header-hidden");
            mobileHideTimer = null;
        }, MOBILE_AUTO_HIDE_MS);
    }

    function isMobileEnvironment() {
        return window.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)").matches;
    }

    // Slide up and hide header on app load
    function hideOnLoad() {
        updateHeaderHeight();
        setTimeout(() => {
            hideHeader();
        }, 300);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", hideOnLoad);
    } else {
        hideOnLoad();
    }

    window.addEventListener("resize", updateHeaderHeight);

    // Desktop: slide down when mouse enters the top header region, slide up when it leaves
    window.addEventListener("pointermove", (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        updateHeaderHeight();
        if (e.clientY <= headerHeight) {
            showHeader();
        } else if (!header.matches(":hover")) {
            hideHeader();
        }
    });

    header.addEventListener("mouseenter", () => {
        if (!isMobileEnvironment()) {
            showHeader();
        }
    });

    header.addEventListener("mouseleave", (e) => {
        if (!isMobileEnvironment() && e.clientY > headerHeight) {
            hideHeader();
        }
    });

    // Mobile: tap anywhere on the page to slide header down
    document.addEventListener("pointerup", (e) => {
        const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
        if (!isTouch && !isMobileEnvironment()) return;

        const clickedInsideHeader = header.contains(e.target);
        if (header.classList.contains("header-hidden")) {
            showHeader();
            scheduleMobileAutoHide();
        } else if (clickedInsideHeader) {
            scheduleMobileAutoHide();
        } else {
            const clickedControls = e.target.closest(".content");
            if (clickedControls) {
                scheduleMobileAutoHide();
            } else {
                hideHeader();
            }
        }
    });
})();
