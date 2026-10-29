variable "account_id" {
  description = "protocol-mainnet AWS account."
  type        = string
  default     = "996912279182"
}

variable "region" {
  description = "Region the API stack is deployed to."
  type        = string
  default     = "us-west-1"
}

variable "github_repository" {
  description = "owner/name of the repository allowed to assume the deploy role."
  type        = string
  default     = "Constellation-Labs/block_explorer"
}

variable "github_environment" {
  description = "GitHub environment allowed to assume the deploy role. Its deployment branch policy decides which branches can deploy."
  type        = string
  default     = "mainnet-postgres"
}

variable "stage" {
  description = "Serverless stage the role deploys. The stack, functions and log groups are named after it."
  type        = string
  default     = "mainnet-postgres"
}

variable "http_api_id" {
  description = "ID of the stack's API Gateway HTTP API."
  type        = string
  default     = "q5z4v3dv58"
}

variable "deployment_bucket" {
  description = "Serverless deployment bucket created by the stack."
  type        = string
  default     = "api-mainnet-postgres-serverlessdeploymentbucket-exp79gw2kdof"
}

variable "create_oidc_provider" {
  description = "Create the account's GitHub OIDC provider. An account holds one per URL; set false if another project already manages it."
  type        = bool
  default     = true
}
