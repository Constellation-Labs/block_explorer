# GitHub Actions deploys the API through OIDC: the workflow exchanges a
# short-lived GitHub token for this role's credentials. No access keys.

resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_oidc_provider ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # AWS trusts GitHub's certificate authority itself; no thumbprint pinning.
  thumbprint_list = []

  lifecycle {
    ignore_changes = [thumbprint_list]
  }
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_provider_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn

  stack_name      = "api-${var.stage}"
  function_arns   = "arn:aws:lambda:${var.region}:${var.account_id}:function:${local.stack_name}-*"
  log_group_arns  = "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/lambda/${local.stack_name}-*"
  lambda_role_arn = "arn:aws:iam::${var.account_id}:role/${local.stack_name}-${var.region}-lambdaRole"
}

# Only jobs that declare `environment: <github_environment>` in this repository
# can assume the role. The environment's deployment branch policy limits which
# branches can run those jobs.
data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:${var.github_environment}"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name                 = "${local.stack_name}-github-deploy"
  description          = "GitHub Actions deploys of the ${local.stack_name} Serverless stack from ${var.github_repository}"
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

# The stack deploys with the caller's credentials (no CloudFormation service
# role), so the role needs both the Serverless calls and the calls
# CloudFormation makes on the stack's resources. Everything is scoped to this
# stack's names except the read-only calls that take no resource.
data "aws_iam_policy_document" "deploy" {
  statement {
    sid = "Stack"
    actions = [
      "cloudformation:CreateChangeSet",
      "cloudformation:DeleteChangeSet",
      "cloudformation:DescribeChangeSet",
      "cloudformation:DescribeStackEvents",
      "cloudformation:DescribeStackResource",
      "cloudformation:DescribeStackResources",
      "cloudformation:DescribeStacks",
      "cloudformation:ExecuteChangeSet",
      "cloudformation:GetTemplate",
      "cloudformation:ListStackResources",
      "cloudformation:UpdateStack",
    ]
    resources = ["arn:aws:cloudformation:${var.region}:${var.account_id}:stack/${local.stack_name}/*"]
  }

  statement {
    sid       = "TemplateValidation"
    actions   = ["cloudformation:ValidateTemplate"]
    resources = ["*"]
  }

  statement {
    sid = "DeploymentBucket"
    actions = [
      "s3:GetBucketLocation",
      "s3:GetBucketPolicy",
      "s3:GetEncryptionConfiguration",
      "s3:ListBucket",
      "s3:PutBucketPolicy",
    ]
    resources = ["arn:aws:s3:::${var.deployment_bucket}"]
  }

  statement {
    sid       = "DeploymentArtifacts"
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::${var.deployment_bucket}/*"]
  }

  statement {
    sid = "Functions"
    actions = [
      "lambda:AddPermission",
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:GetPolicy",
      "lambda:ListTags",
      "lambda:ListVersionsByFunction",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
    ]
    resources = [local.function_arns]
  }

  statement {
    sid       = "FunctionList"
    actions   = ["lambda:ListFunctions"]
    resources = ["*"]
  }

  statement {
    sid     = "HttpApi"
    actions = ["apigateway:DELETE", "apigateway:GET", "apigateway:PATCH", "apigateway:POST", "apigateway:PUT"]
    resources = [
      "arn:aws:apigateway:${var.region}::/apis/${var.http_api_id}",
      "arn:aws:apigateway:${var.region}::/apis/${var.http_api_id}/*",
      "arn:aws:apigateway:${var.region}::/tags/*",
    ]
  }

  statement {
    sid = "LogGroups"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DeleteRetentionPolicy",
      "logs:ListTagsForResource",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
    ]
    resources = [local.log_group_arns]
  }

  statement {
    sid       = "LogGroupList"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid = "LambdaRole"
    actions = [
      "iam:DeleteRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:PutRolePolicy",
    ]
    resources = [local.lambda_role_arn]
  }

  statement {
    sid       = "PassLambdaRole"
    actions   = ["iam:PassRole"]
    resources = [local.lambda_role_arn]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com"]
    }
  }

  # Lambda checks the caller can see the VPC, subnets and security groups in
  # the functions' VPC configuration.
  statement {
    sid = "VpcLookup"
    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy-${local.stack_name}"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
