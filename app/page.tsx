"use client";

import { AtlasPulse } from "@/components/dashboard/AtlasPulse";
import { ScreenshotStream } from "@/components/dashboard/ScreenshotStream";
import { LedgerFeed } from "@/components/dashboard/LedgerFeed";
import { FieldNotes } from "@/components/dashboard/FieldNotes";
import { EcosystemMap } from "@/components/dashboard/EcosystemMap";
import { TaskWidget } from "@/components/dashboard/TaskWidget";

/**
 * Atlas Cockpit Dashboard
 * 
 * LAYOUT:
 * - Mobile: Single column, vertical scroll
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * 
 * All widgets are cards that can be tapped to expand (future).
 * No horizontal carousel - vertical scroll everywhere.
 */
export default function Home() {
  return (
    <div className="dashboard-container">
      {/* Dashboard Grid - responsive columns */}
      <main className="dashboard-grid">
        {/* Pulse - Primary status widget */}
        <section className="dashboard-card-wrapper pulse-card">
          <AtlasPulse />
        </section>
        
        {/* Screenshots */}
        <section className="dashboard-card-wrapper">
          <ScreenshotStream />
        </section>

        {/* Ledger */}
        <section className="dashboard-card-wrapper">
          <LedgerFeed />
        </section>

        {/* Ecosystem */}
        <section className="dashboard-card-wrapper">
          <EcosystemMap />
        </section>

        {/* Notes */}
        <section className="dashboard-card-wrapper">
          <FieldNotes />
        </section>

        {/* Tasks - links to /tasks for full management */}
        <section className="dashboard-card-wrapper">
          <TaskWidget isActive={false} />
        </section>
      </main>
    </div>
  );
}
