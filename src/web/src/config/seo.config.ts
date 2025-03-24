/**
 * SEO Configuration
 * 
 * This file defines the Search Engine Optimization (SEO) configuration 
 * for the HCBS Revenue Management System web application.
 */

// Application constants for SEO
export const APP_NAME = "ThinkCaring HCBS Revenue Management";
export const APP_DESCRIPTION = "Comprehensive HIPAA compliant revenue management system for Home and Community-Based Services (HCBS) providers.";
export const APP_URL = "https://app.thinkcaring.com";
export const APP_LOGO_URL = "/assets/images/logo-light.svg";

/**
 * Twitter card metadata configuration.
 */
export interface TwitterConfig {
  /**
   * Twitter card type (summary, summary_large_image, etc.)
   */
  card: string;
  
  /**
   * Twitter handle for the site
   */
  site: string;
  
  /**
   * Title for Twitter sharing
   */
  title: string;
  
  /**
   * Description for Twitter sharing
   */
  description: string;
  
  /**
   * Image URL for Twitter sharing
   */
  image: string;
}

/**
 * Open Graph metadata configuration for social media sharing.
 */
export interface OpenGraphConfig {
  /**
   * Title for Open Graph sharing
   */
  title: string;
  
  /**
   * Description for Open Graph sharing
   */
  description: string;
  
  /**
   * Type of content (website, article, etc.)
   */
  type: string;
  
  /**
   * URL for Open Graph sharing
   */
  url: string;
  
  /**
   * Image URL for Open Graph sharing
   */
  image: string;
  
  /**
   * Site name for Open Graph sharing
   */
  siteName: string;
}

/**
 * SEO configuration interface.
 */
export interface SeoConfig {
  /**
   * Page title to be displayed in browser tab and search results
   */
  title: string;
  
  /**
   * Meta description for search engine results
   */
  description: string;
  
  /**
   * Keywords for search engine indexing
   */
  keywords: string[];
  
  /**
   * Canonical URL for the page
   */
  canonical: string;
  
  /**
   * Open Graph metadata for social media sharing
   */
  openGraph: OpenGraphConfig;
  
  /**
   * Twitter card metadata for Twitter sharing
   */
  twitter: TwitterConfig;
  
  /**
   * Whether search engines should index the page
   */
  noindex: boolean;
  
  /**
   * Whether search engines should follow links on the page
   */
  nofollow: boolean;
}

/**
 * Default SEO configuration used as a base for all pages.
 */
export const defaultSeoConfig: SeoConfig = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  keywords: [
    "HCBS",
    "revenue management",
    "healthcare billing",
    "claims management",
    "Medicaid billing",
    "home care",
    "community-based services",
    "healthcare finance",
    "billing software",
    "ThinkCaring"
  ],
  canonical: APP_URL,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
    url: APP_URL,
    image: `${APP_URL}${APP_LOGO_URL}`,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    site: "@thinkcaring",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    image: `${APP_URL}${APP_LOGO_URL}`,
  },
  noindex: false,
  nofollow: false,
};

/**
 * Generates SEO configuration for a specific page by merging default settings with page-specific settings.
 * 
 * @param pageConfig - Partial SEO configuration specific to the page
 * @returns Complete SEO configuration for the page
 */
export function getSeoConfig(pageConfig: Partial<SeoConfig>): SeoConfig {
  // Start with the default config
  const mergedConfig = {
    ...defaultSeoConfig,
    ...pageConfig,
  };

  // Merge nested objects
  if (pageConfig.openGraph) {
    mergedConfig.openGraph = {
      ...defaultSeoConfig.openGraph,
      ...pageConfig.openGraph,
    };
  }

  if (pageConfig.twitter) {
    mergedConfig.twitter = {
      ...defaultSeoConfig.twitter,
      ...pageConfig.twitter,
    };
  }

  // Ensure page title includes the app name if not already present
  if (pageConfig.title && !pageConfig.title.includes(APP_NAME)) {
    mergedConfig.title = `${pageConfig.title} | ${APP_NAME}`;
    
    // Also update OpenGraph and Twitter titles if not explicitly set
    if (!pageConfig.openGraph?.title) {
      mergedConfig.openGraph.title = mergedConfig.title;
    }
    
    if (!pageConfig.twitter?.title) {
      mergedConfig.twitter.title = mergedConfig.title;
    }
  }

  // Ensure canonical URL is complete
  if (pageConfig.canonical && !pageConfig.canonical.startsWith('http')) {
    mergedConfig.canonical = `${APP_URL}${pageConfig.canonical}`;
  }

  return mergedConfig;
}