# Terraform

AWS resources the block explorer API needs outside its Serverless stack, in protocol-mainnet (996912279182).

- `github-deploy-role.tf`: the GitHub OIDC provider and the role `api-mainnet-postgres-github-deploy`, which the "Deploy postgress app" workflow assumes. Only jobs in the `mainnet-postgres` GitHub environment can assume it, and that environment only deploys `release/mainnet` and `release/mainnet-postgres`.

State is in `s3://constellationlabs-terraform-mainnet/block-explorer-api/terraform.tfstate`.

Apply with admin credentials for protocol-mainnet:

```bash
cd terraform
terraform init
terraform plan -out tf.tfplan
terraform apply tf.tfplan
```

Then set the `deploy_role_arn` output as the `AWS_DEPLOY_ROLE_ARN` variable on the `mainnet-postgres` environment.
