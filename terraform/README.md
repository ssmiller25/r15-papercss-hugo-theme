# Terraform config for r15-papercss-hugo-theme

Supporting terraform to assist in deploying a themed site with this hugo template.

## Structure

- `modules/` - generic module(s) to deploy the site via a variety of platforms
  - `cloudflare/` - Cloudflaire for DNS/static pages.  Note...will assume static pages are pushed through the CI piepline, NOT with Cloudflaire integration
- `exampleSite` - Implementation code for deploying the examplesite within this repository