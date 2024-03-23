module "examplesite" {
    source = "../modules/cloudflare"
    cloudflare_project_name = "r15-papercss-hugo-theme"
    top_level_domain = "r15cookie.com"
    subdomain = "r15-papercss-hugo"
}