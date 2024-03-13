data "cloudflare_accounts" "account" {
  # For Looking up account ID info
}


resource "cloudflare_pages_project" "staticsite" {
  account_id        = data.cloudflare_accounts.account.accounts[0].id
  name              = var.cloudflare_project_name
  production_branch = "main"
}

resource "cloudflare_pages_domain" "my-domain" {
  account_id   = data.cloudflare_accounts.account.accounts[0].id
  project_name = var.cloudflare_project_name
  domain       = "${var.subdomain}.${var.top_level_domain}"
}

data "cloudflare_zone" "top_domain" {
  name = var.top_level_domain
}

resource "cloudflare_record" "staticdomain" {
  zone_id = data.cloudflare_zone.top_domain.id
  name    = var.subdomain
  value   = cloudflare_pages_project.staticsite.subdomain
  type    = "CNAME"
  proxied = true
}