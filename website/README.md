# SolarBot.io Website

This is the official website for SolarBot.io, a Solana arbitrage trading bot with Telegram integration.

## Overview

SolarBot.io is a professional website for marketing and managing subscriptions to the Solana arbitrage trading bot. The website includes:

- Landing page with product information
- Features page detailing bot capabilities
- Pricing page with subscription tiers
- Documentation for setup and usage
- User authentication system
- Dashboard for subscribers
- Contact and support pages

## Structure

```
website/
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── auth.css            # Authentication pages styles
│   └── dashboard.css       # Dashboard styles
├── js/
│   ├── script.js           # Main JavaScript file
│   ├── auth.js             # Authentication logic
│   └── documentation.js    # Documentation page functionality
├── images/                 # Image assets
├── index.html              # Homepage
├── features.html           # Features page
├── pricing.html            # Pricing page
├── documentation.html      # Documentation page
├── contact.html            # Contact page
├── login.html              # Login page
├── signup.html             # Signup page
├── dashboard.html          # User dashboard
└── README.md               # This file
```

## Subscription Tiers

The website offers the following subscription tiers:

1. **Basic Plan ($29/month)**
   - Simulation mode only
   - Basic arbitrage detection
   - Telegram notifications
   - Limited token pairs (5-10)
   - Daily summary reports
   - Basic dashboard access
   - Email support

2. **Advanced Plan ($79/month)**
   - Everything in Basic tier
   - Live trading mode
   - Advanced arbitrage strategies
   - All token pairs
   - Customizable profit thresholds
   - Detailed analytics
   - Priority email support
   - Custom risk management settings

3. **Professional Plan ($199/month)**
   - Everything in Advanced tier
   - Multi-wallet support
   - Advanced risk management
   - API access
   - Custom token pairs
   - Performance optimization
   - Priority 24/7 support
   - Strategy customization
   - VPS setup assistance

4. **Enterprise Plan (Custom Pricing)**
   - Everything in Professional tier
   - Dedicated VPS
   - Custom development
   - Multiple exchange support
   - Advanced reporting
   - Direct developer access
   - Custom integration options
   - On-demand strategy development

## Development

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- Web server for local development (e.g., Live Server extension for VS Code)

### Local Development

1. Clone the repository
2. Open the project in your code editor
3. Start a local web server to view the website
4. Make changes as needed

### Deployment

The website can be deployed to any standard web hosting service:

1. Upload all files to your web hosting service
2. Configure domain settings to point to solarbot.io
3. Set up SSL certificate for secure connections

## Integration with Bot

The website is designed to work with the Solana arbitrage trading bot. Users who subscribe through the website will receive access to the bot based on their subscription tier.

## Future Enhancements

Planned enhancements for the website include:

- Payment processing integration (Stripe, PayPal, Solana Pay)
- Real-time bot status monitoring
- Performance analytics dashboard
- User management system for admins
- Blog section for updates and educational content
- Community forum

## License

All rights reserved. This code is proprietary and not for public distribution.

## Contact

For questions or support, contact support@solarbot.io
