# AWS production deployment

The CloudFormation stack in `production.yaml` deploys the supported production shape: one ECS/Fargate task behind an HTTPS Application Load Balancer, encrypted EFS storage, Route 53 DNS, an ACM certificate, CloudWatch logs and alarms, optional AWS WAF managed rules, and a stop-before-start deployment policy.

## Prerequisites

- The AWS CLI v2, Docker, and Git installed locally.
- An AWS account and CLI identity authorized to manage CloudFormation, IAM, ECS, ECR, EC2, ELB, EFS, ACM, Route 53, CloudWatch, WAF, and Secrets Manager resources.
- `finnyboyfab.com` in a public Route 53 hosted zone in the target account.
- Two Secrets Manager secrets in the deployment region: one containing only the Stripe API secret key and one containing only the signing secret for `https://finnyboyfab.com/api/webhooks/stripe`.
- Docker Desktop running.

Use Stripe **test-mode** secrets for the first deployment. Create and verify the live webhook in Stripe before supplying live-mode secrets. Never put either secret in this repository, `.env`, a CloudFormation parameter value, or an image.

## First deployment

The initial deployment keeps checkout closed. Export only identifiers and ARNs, not secret values:

```bash
export AWS_REGION=us-east-1
export HOSTED_ZONE_ID=Z1234567890EXAMPLE
export STRIPE_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:finnyboyfab/stripe-key-AbCdEf
export STRIPE_WEBHOOK_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:finnyboyfab/webhook-secret-GhIjKl
./scripts/deploy-aws.sh
```

The script creates an immutable ECR repository if needed, builds for Linux/amd64, pushes the image, resolves its digest, deploys CloudFormation, and prints the stack outputs. The EFS file system and CloudWatch log group are retained if the stack is deleted.
It refuses an uncommitted working tree by default so the image can be traced to a reviewed commit.

## Test-mode checkout rehearsal

After the non-payment prerequisites in `LAUNCH_CHECKLIST.md` are complete, deploy with Stripe test-mode secrets and enable the made-to-order test checkout:

```bash
export CHECKOUT_ENABLED=true
export MADE_TO_ORDER=true
export LAUNCH_REVIEWED=false
./scripts/deploy-aws.sh
```

The app redirects from the cart to Stripe's hosted page, where the customer enters card and shipping details and Stripe Tax calculates applicable tax. Complete every test case in the launch checklist before live mode.

## Live checkout

Update the two Secrets Manager values to the live API key and the live endpoint's `whsec_...` signing secret. Then complete and record the launch checklist before deploying:

```bash
export CHECKOUT_ENABLED=true
export MADE_TO_ORDER=true
export LAUNCH_REVIEWED=true
export ALARM_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:finnyboyfab-operations
./scripts/deploy-aws.sh
```

The application refuses to start with a live Stripe key unless `LAUNCH_REVIEWED=true`. Replacing a Secrets Manager value does not update an already-running task; run the deployment again so ECS starts a new task revision.

## Emergency stop

Keep the same secret ARNs and deploy with checkout disabled:

```bash
export CHECKOUT_ENABLED=false
export MADE_TO_ORDER=true
export LAUNCH_REVIEWED=true
./scripts/deploy-aws.sh
```

This stops new Checkout Session creation without deleting EFS state or existing Stripe records.
