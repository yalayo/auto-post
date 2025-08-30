# provider config
terraform {
	cloud {
		organization = "rondon-sarnik"

		workspaces {
			name = "property-management-fontend"
		}
	}

	required_providers {
		cloudflare = {
			source  = "cloudflare/cloudflare"
			version = "~> 5.3.0"
		}
	}
}

variable "cloudflare_api_token" {
	default = ""
}

variable "cloudflare_account_id" {
	default = ""
}

variable "domain_zone_id" {
	default = ""
}

provider "cloudflare" {
	api_token = var.cloudflare_api_token
}

resource "cloudflare_pages_project" "pages_project" {
	account_id = var.cloudflare_account_id
	name       = "apost-frontend"
}