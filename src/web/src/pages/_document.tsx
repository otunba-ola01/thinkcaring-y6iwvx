import React from 'react';
import Document, { Html, Head, Main, NextScript, DocumentProps, DocumentContext } from 'next/document'; // next/document 13.4+
import createEmotionServer from '@emotion/server/create-instance'; // @emotion/server 11.10+
import { EmotionCache } from '@emotion/cache'; // @emotion/cache 11.10+
import createEmotionCache from '@emotion/cache'; // @emotion/cache 11.10+
import theme from '../styles/theme';

// Create a server-side emotion cache
const createEmotionCache = () => {
  return createCache({ key: 'css', prepend: true });
};

// Interface for the custom document props including emotion style tags
interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: JSX.Element[];
}

export default class MyDocument extends Document<MyDocumentProps> {
  /**
   * Static method to retrieve initial props for the document
   * Extracts critical CSS for server-side rendering of Material UI with emotion
   */
  static async getInitialProps(ctx: DocumentContext) {
    // Original renderPage function
    const originalRenderPage = ctx.renderPage;
    
    // Create a new emotion cache for this request
    const cache = createEmotionCache();
    const { extractCriticalToChunks } = createEmotionServer(cache);
    
    // Render the app with emotion cache provided
    ctx.renderPage = () => 
      originalRenderPage({
        enhanceApp: (App: any) => (props) => 
          <App emotionCache={cache} {...props} />,
      });
    
    // Get initial props from the Document class
    const initialProps = await Document.getInitialProps(ctx);
    
    // Extract critical CSS
    const emotionStyles = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));
    
    return {
      ...initialProps,
      emotionStyleTags,
    };
  }
  
  /**
   * Renders the custom document structure with appropriate meta tags,
   * font loading, and emotion style tags
   */
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Responsive meta tag */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          
          {/* Theme color meta tag based on primary color */}
          <meta name="theme-color" content="#0F52BA" />
          
          {/* SEO description */}
          <meta name="description" content="HIPAA compliant and comprehensive revenue management system for Home and Community-Based Services (HCBS) providers" />
          
          {/* iOS-specific meta tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          
          {/* Icons and manifest */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/logo192.png" />
          <link rel="manifest" href="/manifest.json" />
          
          {/* Preconnect to font sources for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          
          {/* Inter font for the design system */}
          <link 
            rel="stylesheet" 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          />
          
          {/* Emotion style tags for Material UI */}
          {this.props.emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}