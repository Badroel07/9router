"use client";

import { Card, Badge } from "@/shared/components";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import {
  SKILLS,
  SKILLS_REPO_URL,
  getSkillRawUrl,
  getSkillBlobUrl,
} from "@/shared/constants/skills";

function CopyButton({ value, label = "Copy link" }) {
  const { copied, copy } = useCopyToClipboard(2000);
  return (
    <button
      onClick={() => copy(value)}
      className="px-2.5 py-1 rounded-none border border-[#2E2E33] hover:border-[#C5A880] bg-[#141416] text-[#F5F5F7] hover:text-[#E5C378] text-[11px] font-mono font-medium transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
      title={value}
    >
      <span className="material-symbols-outlined text-[13px]">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copied" : label}
    </button>
  );
}

function SkillRow({ skill }) {
  const url = getSkillRawUrl(skill.id);
  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-none border transition-colors ${
        skill.isEntry
          ? "border-[#C5A880]/50 bg-[#141416]"
          : "border-[#222226] bg-[#0F0F10] hover:bg-[#141416]/50"
      }`}
    >
      <div
        className={`size-8 rounded-none border flex items-center justify-center shrink-0 ${
          skill.isEntry
            ? "border-[#C5A880] bg-[#C5A880]/10 text-[#E5C378]"
            : "border-[#2E2E33] bg-[#141416] text-[#A1A1A6]"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{skill.icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-[#F5F5F7]">{skill.name}</h3>
          {skill.isEntry && (
            <Badge variant="primary" size="sm">START HERE</Badge>
          )}
          {skill.endpoint && (
            <Badge variant="default" size="sm">
              <code className="text-[10px]">{skill.endpoint}</code>
            </Badge>
          )}
        </div>
        <p className="text-xs text-[#A1A1A6] mt-1">{skill.description}</p>
        <a
          href={getSkillBlobUrl(skill.id)}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-mono text-[#68686E] hover:text-[#E5C378] mt-1.5 inline-flex items-center gap-1 break-all transition-colors"
        >
          {url}
          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
        </a>
      </div>

      <CopyButton value={url} />
    </div>
  );
}

export default function SkillsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none">
      <Card padding="md">
        <div className="text-xs text-[#A1A1A6] mb-2 font-mono">Paste this prompt to your AI assistant:</div>
        <div className="px-3 py-2.5 rounded-none border border-[#222226] bg-[#080808] font-mono text-xs text-[#E5C378]">
          Read this skill and use it: {getSkillRawUrl("9router")}
        </div>
      </Card>

      <div className="space-y-2">
        {SKILLS.map((skill) => (
          <SkillRow key={skill.id} skill={skill} />
        ))}
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F7]">More on GitHub</h2>
            <p className="text-xs text-[#A1A1A6] mt-0.5">
              Browse source, README, and examples.
            </p>
          </div>
          <a
            href={`${SKILLS_REPO_URL}/tree/master/skills`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono uppercase tracking-wider text-[#E5C378] hover:text-[#C5A880] inline-flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            View on GitHub
          </a>
        </div>
      </Card>
    </div>
  );
}
