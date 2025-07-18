# BV Campaign Analytics - Internal Tool

**⚠️ PROPRIETARY SOFTWARE - BEYOND VIEWS INTERNAL USE ONLY ⚠️**

This is a private, proprietary analytics platform for Beyond Views' internal campaign tracking. Unauthorized use, distribution, or modification is strictly prohibited.

## Access Requirements

This tool is restricted to:
- Beyond Views team members
- Authorized contractors with signed NDAs
- Approved partner agencies

If you've accessed this repository without authorization, please contact pedro@beyondviews.com immediately.

## Internal Setup Guide

### Prerequisites

- Beyond Views Google Workspace account
- Access to BV's Apify team account
- Authorization from Pedro or admin team

### Installation (BV Team Only)

1. Clone using your authorized GitHub account:
   ```bash
   git clone https://github.com/pnpaiva/bv-campaign-analytics.git
   cd bv-campaign-analytics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Request `.env` file from tech lead or set up using BV's credential vault:
   ```bash
   cp .env.example .env
   # Contact tech lead for actual API keys
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## API Keys & Credentials

**Never share API keys outside the organization!**

- API keys are managed through BV's secure credential system
- Contact pedro@beyondviews.com for access
- Keys are rotated monthly
- All API usage is monitored and logged

## Platform Support

- YouTube (via official API)
- Instagram (via Apify actor)
- TikTok (via Apify actor)

## Internal Usage Guidelines

### Campaign Creation
1. Use standardized naming: `[Brand]_[Creator]_[Month]_[Year]`
2. Always include campaign brief ID
3. Tag with appropriate client category

### Data Handling
- Campaign data is confidential
- Do not share analytics outside client agreements
- Export permissions require admin approval

## Security Protocols

1. **Access Control**: 2FA required for all team members
2. **Data Protection**: All client data is confidential
3. **API Usage**: Monitor daily limits to avoid overage charges
4. **Audit Trail**: All actions are logged for compliance

## Support

**Internal Support Only:**
- Technical Issues: tech@beyondviews.com
- Access Requests: admin@beyondviews.com
- Emergency: Contact Pedro directly

## Legal Notice

This software is the exclusive property of Beyond Views. It contains proprietary information and trade secrets of Beyond Views. Any unauthorized use, reproduction, or distribution is strictly prohibited and may result in severe civil and criminal penalties.

© 2024 Beyond Views. All Rights Reserved.

---

**CONFIDENTIAL - DO NOT DISTRIBUTE**