/**
 * PostCSS configuration for the HCBS Revenue Management System
 * 
 * This file configures CSS processing plugins to:
 * - Fix flexbox bugs in older browsers
 * - Enable nested CSS selectors (similar to Sass)
 * - Convert modern CSS features to browser-compatible code
 * - Ensure vendor prefixing for cross-browser compatibility
 * 
 * This configuration is automatically loaded by Next.js through its built-in PostCSS support,
 * processing all CSS files in the project during build time.
 */

module.exports = {
  plugins: {
    // Fix flexbox bugs in older browsers like IE10-11
    'postcss-flexbugs-fixes': {},
    
    // Convert modern CSS into something browsers understand
    'postcss-preset-env': {
      autoprefixer: {
        // Configure flexbox prefixes to exclude older syntax
        flexbox: 'no-2009',
        // Add prefixes for grid layout where needed
        grid: 'autoplace'
      },
      // Use stage 3 features (draft)
      stage: 3,
      features: {
        // Enable CSS variables
        'custom-properties': true,
        // Enable CSS nesting
        'nesting-rules': true,
        // Enable color modification functions
        'color-mod-function': true,
        'color-function': true
      }
    },
    
    // Enable nested CSS selectors like Sass
    'postcss-nested': {},
    
    // Add vendor prefixes for browser compatibility
    // Note: This is technically redundant with postcss-preset-env's built-in autoprefixer
    // but included to match exact requirements
    'autoprefixer': {
      browsers: [
        '>0.2%',
        'not dead',
        'not op_mini all',
        'last 1 chrome version',
        'last 1 firefox version',
        'last 1 safari version'
      ]
    }
  }
};