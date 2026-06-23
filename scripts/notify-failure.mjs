#!/usr/bin/env node
// Reusable CI failure notifier. Reads a JSON payload from $PAYLOAD_FILE or
// stdin and dispatches to every webhook env var that is configured.
//
// Supported channels (skipped silently when the secret is not set):
//   SLACK_WEBHOOK_URL    — Slack incoming webhook (block kit)
//   DISCORD_WEBHOOK_URL  — Discord webhook (embeds)
//   TEAMS_WEBHOOK_URL    — Microsoft Teams MessageCard
//   GENERIC_WEBHOOK_URL  — Raw JSON POST of the payload
//
// Payload shape:
// {
//   environment, branch, commitSha, workflow, job, failedAt, runUrl,
//   artifacts: { name, url }[]
// }

import { readFileSync } from "node:fs";

function loadPayload() {
  const file = process.env.PAYLOAD_FILE;
  let raw = "";
  if (file) raw = readFileSync(file, "utf8");
  else raw = readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function fmtArtifacts(p) {
  if (!p.artifacts?.length) return "—";
  return p.artifacts.map((a) => `• <${a.url}|${a.name}>`).join("\n");
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`webhook ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
}

function slackBlocks(p) {
  return {
    text: `🚨 Launch-readiness failure: ${p.workflow} / ${p.job}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: `🚨 ${p.workflow} failed` } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Environment:*\n${p.environment}` },
          { type: "mrkdwn", text: `*Branch:*\n${p.branch}` },
          { type: "mrkdwn", text: `*Commit:*\n\`${p.commitSha?.slice(0, 12)}\`` },
          { type: "mrkdwn", text: `*Job:*\n${p.job}` },
          { type: "mrkdwn", text: `*When:*\n${p.failedAt}` },
        ],
      },
      { type: "section", text: { type: "mrkdwn", text: `*Artifacts*\n${fmtArtifacts(p)}` } },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Open workflow run" },
            url: p.runUrl,
          },
        ],
      },
    ],
  };
}

function discordEmbed(p) {
  return {
    content: `🚨 **${p.workflow}** failed on \`${p.branch}\``,
    embeds: [
      {
        title: `${p.workflow} — ${p.job}`,
        url: p.runUrl,
        color: 0xe11d48,
        fields: [
          { name: "Environment", value: p.environment, inline: true },
          { name: "Commit", value: `\`${p.commitSha?.slice(0, 12)}\``, inline: true },
          { name: "When", value: p.failedAt, inline: true },
          {
            name: "Artifacts",
            value:
              p.artifacts?.map((a) => `[${a.name}](${a.url})`).join("\n") || "—",
          },
        ],
      },
    ],
  };
}

function teamsCard(p) {
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor: "E11D48",
    summary: `${p.workflow} failed`,
    title: `🚨 ${p.workflow} failed`,
    sections: [
      {
        facts: [
          { name: "Environment", value: p.environment },
          { name: "Branch", value: p.branch },
          { name: "Commit", value: p.commitSha },
          { name: "Job", value: p.job },
          { name: "When", value: p.failedAt },
        ],
        text:
          p.artifacts?.map((a) => `- [${a.name}](${a.url})`).join("\n") || "No artifacts",
      },
    ],
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "Open workflow run",
        targets: [{ os: "default", uri: p.runUrl }],
      },
    ],
  };
}

const CHANNELS = [
  { env: "SLACK_WEBHOOK_URL", format: slackBlocks, label: "slack" },
  { env: "DISCORD_WEBHOOK_URL", format: discordEmbed, label: "discord" },
  { env: "TEAMS_WEBHOOK_URL", format: teamsCard, label: "teams" },
  { env: "GENERIC_WEBHOOK_URL", format: (p) => p, label: "generic" },
];

async function main() {
  const payload = loadPayload();
  const results = [];
  for (const ch of CHANNELS) {
    const url = process.env[ch.env];
    if (!url) {
      results.push({ channel: ch.label, status: "skipped" });
      continue;
    }
    try {
      await postJson(url, ch.format(payload));
      results.push({ channel: ch.label, status: "sent" });
    } catch (err) {
      results.push({ channel: ch.label, status: "error", error: String(err) });
    }
  }
  // Structured log to stdout for CI logs.
  process.stdout.write(JSON.stringify({ notify: results }) + "\n");
  const anyError = results.some((r) => r.status === "error");
  process.exit(anyError ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
