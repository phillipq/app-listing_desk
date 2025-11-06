// App configuration for Realtor AI Assistant
export const APP_CONFIG = {
  APP_NAME: process.env.APP_NAME || "Realtor AI Assistant",
  APP_DOMAIN: process.env.APP_DOMAIN || "localhost:3014",
  
  // App-specific branding
  BRANDING: {
    PRIMARY_COLOR: process.env.PRIMARY_COLOR || "blue",
    LOGO_URL: process.env.LOGO_URL || "/logo.png",
    FAVICON_URL: process.env.FAVICON_URL || "/favicon.ico",
  }
}

