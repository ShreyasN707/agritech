class I18nService {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.availableLanguages = [
            { code: 'en', name: 'English' },
            { code: 'hi', name: 'हिंदी' },
            { code: 'mr', name: 'मराठी' },
            { code: 'kn', name: 'ಕನ್ನಡ' }
        ];
        
        // Initialize with empty translations to avoid null reference errors
        this.translations = {
            app: { title: 'CropSense', tagline: 'Loading...' },
            forecast: {},
            simulator: {},
            common: {}
        };
        
        // Create language selector
        this.createLanguageSelector();
    }
    
    createLanguageSelector() {
        // Create or update language selector
        let selector = document.getElementById('language-selector');
        
        if (!selector) {
            const container = document.createElement('div');
            container.className = 'language-selector';
            container.innerHTML = `
                <select id="language-selector" aria-label="Select language">
                    ${this.availableLanguages.map(lang => 
                        `<option value="${lang.code}">${lang.name}</option>`
                    ).join('')}
                </select>
            `;
            
            // Add to header or body if header not found
            const header = document.querySelector('header') || document.body;
            header.insertBefore(container, header.firstChild);
            
            selector = container.querySelector('select');
            selector.addEventListener('change', (e) => this.setLanguage(e.target.value));
        }
        
        // Update options
        selector.innerHTML = this.availableLanguages.map(lang => 
            `<option value="${lang.code}" ${this.currentLanguage === lang.code ? 'selected' : ''}>
                ${lang.name}
            </option>`
        ).join('');
    }
    
    async init() {
        // Load saved language or default to browser language
        const savedLanguage = localStorage.getItem('preferredLanguage');
        const browserLanguage = navigator.language.split('-')[0];
        const defaultLanguage = this.availableLanguages.some(lang => lang.code === browserLanguage) 
            ? browserLanguage 
            : 'en';
            
        await this.setLanguage(savedLanguage || defaultLanguage);
        
        // Update language selector
        this.createLanguageSelector();
        
        return this;
    }
    
    async setLanguage(lang) {
        if (!this.availableLanguages.some(l => l.code === lang)) {
            console.warn(`Language '${lang}' is not supported`);
            return;
        }
        
        try {
            // Load translation file from the correct path
            const response = await fetch(`/locales/${lang}/translation.json`);
            if (!response.ok) throw new Error(`Translation file not found for ${lang}`);
            
            this.translations = await response.json();
            this.currentLanguage = lang;
            
            // Save preference
            localStorage.setItem('preferredLanguage', lang);
            
            // Update UI
            document.documentElement.lang = lang;
            document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
            
            // Update language selector
            const selector = document.getElementById('language-selector');
            if (selector) {
                selector.value = lang;
            }
            
            // Dispatch language change event
            const event = new CustomEvent('languageChanged', { 
                detail: { 
                    language: lang,
                    translations: this.translations
                } 
            });
            document.dispatchEvent(event);
            
            console.log(`Language changed to ${lang}`);
        } catch (error) {
            console.error('Error loading language:', error);
            // Fallback to English if selected language fails to load
            if (lang !== 'en') {
                await this.setLanguage('en');
            }
        }
    }
    
    t(key, params = {}) {
        if (!key) return '';
        
        try {
            // Navigate the translations object using dot notation
            const value = key.split('.').reduce((obj, k) => {
                return (obj && obj[k] !== undefined) ? obj[k] : undefined;
            }, this.translations);
            
            // Return key if translation not found
            if (value === undefined) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Translation not found for key: ${key}`);
                }
                return key;
            }
            
            // Handle nested objects (for complex translations)
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return value;
            }
            
            // Replace placeholders if any
            return typeof value === 'string' 
                ? this.replacePlaceholders(value, params)
                : value.toString();
        } catch (error) {
            console.error(`Error in translation for key '${key}':`, error);
            return key;
        }
    }
    
    replacePlaceholders(str, params = {}) {
        if (typeof str !== 'string') return str;
        
        return Object.keys(params).reduce((result, key) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            return result.replace(regex, params[key]);
        }, str);
    }
    
    // Get current language code
    getLanguage() {
        return this.currentLanguage;
    }
    
    // Get available languages
    getAvailableLanguages() {
        return [...this.availableLanguages];
    }
    
    // Format number according to locale
    formatNumber(number, options = {}) {
        return new Intl.NumberFormat(this.currentLanguage, options).format(number);
    }
    
    // Format date according to locale
    formatDate(date, options = {}) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
    }
}

// Create singleton instance
const i18n = new I18nService();

// Helper function for HTML templates
const t = (key, params = {}) => i18n.t(key, params);

// Initialize i18n when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    i18n.init().catch(error => {
        console.error('Failed to initialize i18n:', error);
    });
});

// Export for ES modules
export { i18n, t };

// Also make available globally for non-module scripts
window.i18n = i18n;
window.t = t;
