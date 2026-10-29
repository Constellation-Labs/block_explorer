terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State lives in this project's own versioned bucket (state-bucket.tf).
  # S3-native locking (use_lockfile) needs Terraform 1.10 or later.
  backend "s3" {
    bucket       = "block-explorer-api-tfstate-996912279182"
    key          = "terraform.tfstate"
    region       = "us-west-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region              = var.region
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = "block-explorer-api"
      ManagedBy = "terraform"
      Source    = "github.com/Constellation-Labs/block_explorer/terraform"
    }
  }
}
