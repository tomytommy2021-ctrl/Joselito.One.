class JoselitoOneTV {
    constructor() {
        this.channels = [];
        this.currentChannel = null;
        this.hls = null;
        this.init();
    }

    init() {
        this.loadSavedUrl();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('saveUrl').addEventListener('click', () => {
            this.saveM3uUrl();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.stopPlayer();
        });
    }

    loadSavedUrl() {
        const savedUrl = localStorage.getItem('joselito_m3u_url');
        if (savedUrl) {
            document.getElementById('m3uUrl').value = savedUrl;
            this.loadChannels(savedUrl);
        }
    }

    async loadChannels(url) {
        try {
            const response = await fetch(url);
            const data = await response.text();
            this.parseM3U(data);
        } catch (error) {
            alert('Error al cargar la lista M3U: ' + error.message);
        }
    }

    parseM3U(data) {
        const lines = data.split('\n');
        this.channels = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF')) {
                const nameMatch = line.match(/tvg-name="([^"]*)"/) || 
                                 line.match(/,([^,]+)$/);
                const logoMatch = line.match(/tvg-logo="([^"]*)"/);
                
                const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Canal ' + (i + 1);
                const logo = logoMatch ? logoMatch[1] : null;
                
                if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
                    const url = lines[i + 1].trim();
                    this.channels.push({ name, url, logo });
                }
            }
        }
        
        this.renderChannels();
    }

    renderChannels() {
        const container = document.getElementById('channelsList');
        container.innerHTML = '';
        
        this.channels.forEach((channel, index) => {
            const channelElement = document.createElement('div');
            channelElement.className = 'channel-item';
            channelElement.innerHTML = `
                <img class="channel-logo" src="${channel.logo || 'https://via.placeholder.com/80'}" 
                     onerror="this.src='https://via.placeholder.com/80'">
                <div class="channel-name">${channel.name}</div>
            `;
            
            channelElement.addEventListener('click', () => {
                this.playChannel(index);
            });
            
            container.appendChild(channelElement);
        });
    }

    playChannel(index) {
        this.currentChannel = this.channels[index];
        
        document.getElementById('channelsList').classList.add('hidden');
        document.getElementById('playerContainer').classList.remove('hidden');
        
        const video = document.getElementById('videoPlayer');
        
        if (this.hls) {
            this.hls.destroy();
        }
        
        if (this.currentChannel.url.includes('.m3u8')) {
            if (Hls.isSupported()) {
                this.hls = new Hls();
                this.hls.loadSource(this.currentChannel.url);
                this.hls.attachMedia(video);
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = this.currentChannel.url;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                });
            }
        } else {
            video.src = this.currentChannel.url;
            video.play();
        }
    }

    stopPlayer() {
        const video = document.getElementById('videoPlayer');
        video.pause();
        video.src = '';
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        document.getElementById('channelsList').classList.remove('hidden');
        document.getElementById('playerContainer').classList.add('hidden');
    }

    toggleSettings() {
        const settings = document.getElementById('settingsPanel');
        settings.classList.toggle('hidden');
    }

    saveM3uUrl() {
        const url = document.getElementById('m3uUrl').value;
        if (url) {
            localStorage.setItem('joselito_m3u_url', url);
            this.loadChannels(url);
            this.toggleSettings();
            alert('URL guardada correctamente');
        }
    }
}

// Cargar HLS.js desde CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
script.onload = () => {
    new JoselitoOneTV();
};
document.head.appendChild(script);