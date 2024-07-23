
            const totalBackgrounds = 7;
            let currentBackground = Math.floor(Math.random() * (totalBackgrounds)) + 1;

            let ema = 0;
            let stakingRatios = [];
            let cur = 0;
            let initial = true;

            async function fetchAndUpdateData() {
                try {
                    const startTime = performance.now(); // Start measuring fetch time
                    let response = await fetch("https://api.tzkt.io/v1/statistics/?sort.desc=level&limit=60");
                    if (!response.ok) {
                        // Retry with kukai.api.tzkt.io if fetch fails
                        response = await fetch("https://kukai.api.tzkt.io/v1/statistics/?sort.desc=level&limit=60");
                    }
                    let data = await response.json();
                    const fetchTime = performance.now() - startTime; // Calculate fetch time
                    stakingRatios = data.map((block) => block.totalFrozen / 1000000);
                    ema = calculateEMA(stakingRatios);
                    const animationDuration = Math.max(0, 30000 - fetchTime); // Adjust animation time
                    updateProgressBar(data[0].totalFrozen, data[0].totalSupply, animationDuration);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }

            function calculateEMA(values) {
                if (!values.length) return 0;
                const smoothingFactor = 2 / (values.length + 1);
                if (initial) {
                    // Initialize EMA with SMA
                    const sma = values.reduce((sum, value) => sum + value, 0) / values.length;
                    ema = sma;
                    initial = false;
                }
                for (let i = values.length - 1; i >= 0; i--) {
                    ema = (values[i] - ema) * smoothingFactor + ema;
                }
                return ema;
            }

            function updateCounter(duration) {
                const currentValue = cur;
                animateValue(currentValue, ema, duration);
                cur = ema;
            }

            function animateValue(start, end, duration) {
                let startTimestamp = null;
                const element = document.getElementById("realtimeData");
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    const current = start + progress * (end - start);

                    // Display formatted number with fixed width
                    element.textContent = `Staked tez: ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                    // Adjust font size dynamically based on content length
                    const contentWidth = element.offsetWidth;
                    const elementWidth = element.clientWidth;
                    const fontSize = parseInt(window.getComputedStyle(element).fontSize);
                    if (contentWidth > elementWidth) {
                        element.style.fontSize = `${fontSize - 1}px`;
                    } else if (fontSize < 24) {
                        element.style.fontSize = "24px";
                    }

                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            }

            function updateProgressBar(totalFrozen, totalSupply, duration) {
                const progress = (totalFrozen / totalSupply) * 100;
                const progressElement = document.getElementById("progress");
                progressElement.style.width = `${progress}%`;

                const progressTextElement = document.getElementById("progressText");
                progressTextElement.textContent = `${progress.toFixed(2)}%`;

                updateCounter(duration);
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
                    })
                    .catch(function (error) {
                        console.error("Failed to start audio playback:", error);
                    });
            }

            function pauseMusic() {
                backgroundMusic.pause();
                musicIcon.src = "icons/silence.png";
                musicIcon.alt = "Audio Icon";
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

            window.onload = function() {
                switchBackground();
                fetchAndUpdateData();
                backgroundMusic.src = `music/1.mp3`;
            }
