class ColorPaletteGenerator {
    constructor() {
        this.colors = [];
        this.paletteGrid = document.getElementById('paletteGrid');
        this.previewSection = document.getElementById('previewSection');
        this.previewContainer = document.getElementById('previewContainer');
        this.generateBtn = document.getElementById('generateBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        this.colorPicker = document.getElementById('colorPicker');
        this.hexInput = document.getElementById('hexInput');
        this.copyColorBtn = document.getElementById('copyColorBtn');
        this.shareColorBtn = document.getElementById('shareColorBtn');
        
        this.init();
    }

    init() {
        this.generateBtn.addEventListener('click', () => this.generatePalette());
        this.shareBtn.addEventListener('click', () => this.copyShareableLink());
        
        // Load palette from URL or generate random
        this.loadFromURL();
        
        // Listen for popstate events (back/forward buttons)
        window.addEventListener('popstate', () => this.loadFromURL());
        
        // Sync color picker and hex input
        this.colorPicker.addEventListener('input', (e) => {
            this.hexInput.value = e.target.value;
            // Optionally: updatePalette(e.target.value);
        });
        this.hexInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                this.colorPicker.value = val;
                // Optionally: updatePalette(val);
            }
        });
        
        // Copy hex code
        this.copyColorBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(this.hexInput.value);
            this.showToast('Color copied!');
        });
        
        // Share color link
        this.shareColorBtn.addEventListener('click', () => {
            const url = `${window.location.origin}${window.location.pathname}?color=${encodeURIComponent(this.hexInput.value)}`;
            navigator.clipboard.writeText(url);
            this.showToast('Shareable link copied!');
        });
    }

    generateRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
        const lightness = Math.floor(Math.random() * 40) + 30; // 30-70%
        return this.hslToHex(hue, saturation, lightness);
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;
        
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    getContrastColor(hex) {
        const luminance = this.getLuminance(hex);
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    getColorName(hex) {
        // Simple color name generator based on hue
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 'Unknown';
        
        const { r, g, b } = rgb;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        if (max - min < 30) {
            if (max < 100) return 'Dark Gray';
            if (max > 200) return 'Light Gray';
            return 'Gray';
        }
        
        if (r > g && r > b) return g > b ? 'Orange' : 'Red';
        if (g > r && g > b) return r > b ? 'Yellow' : 'Green';
        if (b > r && b > g) return r > g ? 'Purple' : 'Blue';
        
        return 'Mixed';
    }

    generatePalette() {
        this.colors = [];
        for (let i = 0; i < 5; i++) {
            this.colors.push(this.generateRandomColor());
        }
        
        this.updateURL();
        this.renderPalette();
        this.renderPreview();
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const colorsParam = urlParams.get('colors');
        
        if (colorsParam) {
            const colors = colorsParam.split('-').map(color => 
                color.startsWith('#') ? color : `#${color}`
            );
            
            if (colors.length === 5 && colors.every(color => /^#[0-9A-F]{6}$/i.test(color))) {
                this.colors = colors;
                this.renderPalette();
                this.renderPreview();
                return;
            }
        }
        
        this.generatePalette();
    }

    updateURL() {
        const colorsParam = this.colors.map(color => color.replace('#', '')).join('-');
        const newURL = `${window.location.origin}${window.location.pathname}?colors=${colorsParam}`;
        window.history.pushState({ colors: this.colors }, '', newURL);
    }

    renderPalette() {
        this.paletteGrid.classList.add('updating');
        this.paletteGrid.innerHTML = '';
        
        this.colors.forEach((color, index) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = color;
            colorBox.style.animationDelay = `${index * 0.1}s`;
            
            colorBox.innerHTML = `
                <div class="color-info">
                    <div class="color-hex">${color}</div>
                    <div class="color-name">${this.getColorName(color)}</div>
                    <div class="copy-hint">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Click to copy
                    </div>
                </div>
            `;
            
            colorBox.addEventListener('click', () => this.copyColor(color));
            this.paletteGrid.appendChild(colorBox);
        });
        
        setTimeout(() => {
            this.paletteGrid.classList.remove('updating');
        }, 600);
    }

    renderPreview() {
        const [bg, primary, card, text, accent] = this.colors;
        
        const bgText = this.getContrastColor(bg);
        const primaryText = this.getContrastColor(primary);
        const cardText = this.getContrastColor(card);
        const accentText = this.getContrastColor(accent);
        
        this.previewContainer.innerHTML = `
            <div class="preview-content" style="background: ${bg}; color: ${bgText};">
                <div class="preview-header-content">
                    <h1 class="preview-title" style="color: ${text};">Welcome to Our Platform</h1>
                    <p class="preview-text" style="color: ${bgText}; opacity: 0.8;">
                        Experience the perfect harmony of colors in modern design. This preview shows how your 
                        palette creates a cohesive and professional user interface.
                    </p>
                </div>
                
                <div class="preview-actions">
                    <button class="preview-btn" style="background: ${primary}; color: ${primaryText};">
                        Get Started
                    </button>
                    <button class="preview-btn" style="background: ${accent}; color: ${accentText};">
                        Learn More
                    </button>
                </div>
                
                <div class="preview-card" style="background: ${card}; color: ${cardText};">
                    <h3>Feature Highlight</h3>
                    <p>This card demonstrates how your color palette works together to create 
                    readable, accessible, and visually appealing content sections.</p>
                </div>
            </div>
        `;
        
        // Show preview section with animation
        this.previewSection.classList.add('visible');
    }

    copyColor(color) {
        navigator.clipboard.writeText(color).then(() => {
            this.showToast(`Color ${color} copied to clipboard!`);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = color;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast(`Color ${color} copied to clipboard!`);
        });
    }

    copyShareableLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Shareable link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Shareable link copied to clipboard!');
        });
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorPaletteGenerator();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        document.getElementById('generateBtn').click();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('shareBtn').click();
    }
});

// Add subtle parallax effect to background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('body::before');
    if (parallax) {
        const speed = scrolled * 0.5;
        document.body.style.transform = `translateY(${speed}px)`;
    }
});

// Enhance mobile touch interactions
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
        const target = e.target.closest('.color-box, .btn, .preview-btn');
        if (target) {
            target.style.transform = 'scale(0.95)';
        }
    });
    
    document.addEventListener('touchend', (e) => {
        const target = e.target.closest('.color-box, .btn, .preview-btn');
                if (target) {
                    setTimeout(() => {
                        target.style.transform = '';
                    }, 150);
                }
            });
        }