# HIGAET Blog Automation — Daily Queue (Dry-Run)
# Completed: t_1ec42740 (Generative AI Engineering) — PUBLISH_VERIFIED
# Constraint: No publish until APPROVE <ARTICLE_ID> command received.
# OpenClaw: NOT used. Credentials: NOT exposed.
# Queue path: .hermes/kanban/blog-queue/daily-queue-20260930.yaml
# Max per day: 10

approval_command_format: "APPROVE <ARTICLE_ID>"
scheduler_status: idle — awaiting first APPROVE
pipeline: IDEA -> RESEARCH -> WRITE -> AUDIT -> HUMAN_APPROVAL_REQUIRED -> APPROVED -> PUBLISH -> VERIFY
