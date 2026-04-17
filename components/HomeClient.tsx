"use client"

import { Campaign } from "@/lib/types";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  stats: { campaigns: number, chapters: number, dungeons: number }
  campaigns: Campaign[]
}

export default function HomeClient({ campaigns, stats }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
   const router = useRouter()
  const statsList = [
    { label: "Campaigns", value: stats.campaigns },
    { label: "Chapters", value: stats.chapters },
    { label: "Dungeons", value: stats.dungeons },
  ]

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>

      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, rgba(139, 69, 19, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(101, 48, 8, 0.12) 0%, transparent 50%)
        `,
        pointerEvents: "none",
      }} />

      {/* Hero */}
      <header style={{
        textAlign: "center",
        padding: "72px 40px 48px",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "var(--color-gold-dark)",
          marginBottom: "16px",
        }}>
          ✦ Campaign Manager ✦
        </p>
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          lineHeight: 1.1,
          fontWeight: "normal",
          color: "var(--color-text)",
          margin: "0 0 20px",
          textShadow: "0 2px 20px rgba(201, 168, 76, 0.3)",
        }}>
          Your Legend<br />
          <em style={{ color: "var(--color-gold)" }}>Awaits</em>
        </h1>
        <p style={{
          fontSize: "16px",
          color: "var(--color-text-muted)",
          maxWidth: "440px",
          margin: "0 auto 40px",
          lineHeight: 1.8,
        }}>
          Forge your campaigns, catalogue your beasts, and command every encounter with the precision of a seasoned Dungeon Master.
        </p>
        <button style={{
          background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
          border: "1px solid var(--color-gold)",
          color: "var(--color-gold)",
          padding: "14px 36px",
          fontSize: "13px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
          onClick={() => router.push('/campaigns/new')}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.2)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(139,26,26,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          + Begin New Campaign
        </button>
      </header>

      {/* Stats bar */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        maxWidth: "500px",
        margin: "0 auto 64px",
        border: "1px solid var(--color-border)",
        position: "relative", zIndex: 1,
      }}>
        {statsList.map((s, i) => (
          <div key={s.label} style={{
            flex: 1,
            textAlign: "center",
            padding: "20px",
            borderRight: i < statsList.length - 1 ? "1px solid var(--color-border)" : "none",
          }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--color-gold)" }}>{s.value}</div>
            <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaign cards */}
      <main style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 40px 80px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontSize: "12px",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--color-text-dim)",
            margin: 0,
          }}>
            ✦ Active Campaigns
          </h2>
          <div style={{ height: "1px", flex: 1, margin: "0 16px", background: "var(--color-border)" }} />
          <a href={`/campaigns`}  style={{ fontSize: "12px", color: "var(--color-text-dim)", textDecoration: "none", letterSpacing: "0.1em" }}>View all →</a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {campaigns.map(c => (
            <div key={c.id}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`campaigns/${c.id.toLowerCase()}`)}
              style={{
                background: hovered === c.id ? "var(--color-card-hover)" : "var(--color-card)",
                border: `1px solid ${hovered === c.id ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                padding: "28px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: "10px" }}>
                {c.setting}
              </div>
              <h3 style={{ margin: "0 0 20px", fontSize: "22px", fontWeight: "normal", color: "var(--color-text)" }}>
                {c.name}
              </h3>
              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "18px", color: "var(--color-gold)" }}>{c.chapterCount}</div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>Chapters</div>
                </div>
              </div>
            </div>
          ))}

          {/* New campaign card */}
          <div style={{
            border: "1px dashed var(--color-border)",
            padding: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            color: "var(--color-text-dim)",
            transition: "all 0.2s",
            fontSize: "14px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
            onClick={() => router.push('/campaigns/new')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.color = "var(--color-gold-dark)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-dim)"; }}
          >
            <span style={{ fontSize: "20px" }}>+</span> New Campaign
          </div>
        </div>
      </main>
    </div>
  );
}
