#!/usr/bin/env bash
set -Eeuo pipefail

required_commands=(aws docker git)
for command_name in "${required_commands[@]}"; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command is not installed: ${command_name}" >&2
    exit 1
  fi
done

required_variables=(AWS_REGION HOSTED_ZONE_ID STRIPE_SECRET_ARN STRIPE_WEBHOOK_SECRET_ARN)
for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Required environment variable is not set: ${variable_name}" >&2
    exit 1
  fi
done

if [[ -n "$(git status --porcelain)" && "${ALLOW_DIRTY_DEPLOY:-false}" != "true" ]]; then
  echo "Refusing to deploy an uncommitted working tree. Commit and review the release first." >&2
  exit 1
fi

stack_name="${STACK_NAME:-finnyboyfab-prod}"
repository_name="${ECR_REPOSITORY:-finnyboyfab-store}"
domain_name="${DOMAIN_NAME:-finnyboyfab.com}"
support_email="${SUPPORT_EMAIL:-finnyboyfab@gmail.com}"
checkout_enabled="${CHECKOUT_ENABLED:-false}"
made_to_order="${MADE_TO_ORDER:-false}"
launch_reviewed="${LAUNCH_REVIEWED:-false}"
enable_waf="${ENABLE_WAF:-true}"
alarm_topic_arn="${ALARM_TOPIC_ARN:-}"

if [[ "${checkout_enabled}" == "true" && "${made_to_order}" != "true" ]]; then
  echo "Checkout cannot be enabled until MADE_TO_ORDER=true." >&2
  exit 1
fi

aws_account_id="$(aws sts get-caller-identity --query Account --output text --region "${AWS_REGION}")"
repository_uri="${aws_account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com/${repository_name}"
image_tag="${IMAGE_TAG:-$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%d%H%M%S)}"

if ! aws ecr describe-repositories --repository-names "${repository_name}" --region "${AWS_REGION}" >/dev/null 2>&1; then
  aws ecr create-repository \
    --repository-name "${repository_name}" \
    --image-scanning-configuration scanOnPush=true \
    --image-tag-mutability IMMUTABLE \
    --encryption-configuration encryptionType=AES256 \
    --region "${AWS_REGION}" >/dev/null
fi

aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${aws_account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker build --pull --platform linux/amd64 -t "${repository_uri}:${image_tag}" .
docker push "${repository_uri}:${image_tag}"

image_digest="$(aws ecr describe-images \
  --repository-name "${repository_name}" \
  --image-ids imageTag="${image_tag}" \
  --query 'imageDetails[0].imageDigest' \
  --output text \
  --region "${AWS_REGION}")"

if [[ ! "${image_digest}" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo "ECR did not return a valid immutable image digest." >&2
  exit 1
fi

image_uri="${repository_uri}@${image_digest}"

aws cloudformation deploy \
  --stack-name "${stack_name}" \
  --template-file infra/aws/production.yaml \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --region "${AWS_REGION}" \
  --parameter-overrides \
    ImageUri="${image_uri}" \
    DomainName="${domain_name}" \
    HostedZoneId="${HOSTED_ZONE_ID}" \
    StripeSecretArn="${STRIPE_SECRET_ARN}" \
    StripeWebhookSecretArn="${STRIPE_WEBHOOK_SECRET_ARN}" \
    SupportEmail="${support_email}" \
    CheckoutEnabled="${checkout_enabled}" \
    MadeToOrder="${made_to_order}" \
    LaunchReviewed="${launch_reviewed}" \
    EnableWaf="${enable_waf}" \
    AlarmTopicArn="${alarm_topic_arn}"

aws cloudformation describe-stacks \
  --stack-name "${stack_name}" \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region "${AWS_REGION}"

echo "Deployed immutable image: ${image_uri}"
