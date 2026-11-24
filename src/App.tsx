import {useEffect, useState} from 'react';
import {ActionHubsSection} from './components/ActionHubsSection';
import {Footer} from './components/Footer';
import {GlobalTelemetrySection} from './components/GlobalTelemetrySection';
import {Header} from './components/Header';
import {HeroObservatory} from './components/HeroObservatory';
import {LocalClimateExplorer} from './components/LocalClimateExplorer';
import {RegisterHubModal} from './components/RegisterHubModal';
import {ScienceBriefsSection} from './components/ScienceBriefsSection';
import type {
  ClimateInitiative,
  FactCheckEntry,
  GlobalClimatePayload,
  ScienceBrief,
  ScienceLibraryPayload,
} from './types/climate';

export default function App() {
  const [globalData, setGlobalData] = useState<GlobalClimatePayload | null>(null);
  const [globalLoading, setGlobalLoading] = useState(true);

  const [briefs, setBriefs] = useState<ScienceBrief[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheckEntry[]>([]);
  const [scienceLoading, setScienceLoading] = useState(true);

  const [initiatives, setInitiatives] = useState<ClimateInitiative[]>([]);
  const [initiativesLoading, setInitiativesLoading] = useState(true);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [globalRes, scienceRes, hubsRes] = await Promise.all([
          fetch('/api/climate/global'),
          fetch('/api/science/briefs'),
          fetch('/api/initiatives'),
        ]);

        if (active && globalRes.ok) {
          const json = (await globalRes.json()) as GlobalClimatePayload;
          setGlobalData(json);
        }
        if (active && scienceRes.ok) {
          const json = (await scienceRes.json()) as ScienceLibraryPayload;
          setBriefs(json.briefs || []);
          setFactChecks(json.factChecks || []);
        }
        if (active && hubsRes.ok) {
          const json = (await hubsRes.json()) as {initiatives: ClimateInitiative[]};
          setInitiatives(json.initiatives || []);
        }
      } catch {
        // Individual sections handle empty/fallback states cleanly
      } finally {
        if (active) {
          setGlobalLoading(false);
          setScienceLoading(false);
          setInitiativesLoading(false);
        }
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  async function handleJoinInitiative(id: string) {
    const res = await fetch(`/api/initiatives/${encodeURIComponent(id)}/join`, {
      method: 'POST',
    });
    if (!res.ok) return;
    const json = (await res.json()) as {initiative: ClimateInitiative};
    setInitiatives((prev) =>
      prev.map((item) => (item.id === json.initiative.id ? json.initiative : item)),
    );
  }

  function handleInitiativeCreated(created: ClimateInitiative) {
    setInitiatives((prev) => [created, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900">
      <Header onOpenRegisterModal={() => setRegisterModalOpen(true)} />

      <main>
        <HeroObservatory globalData={globalData} loading={globalLoading} />
        <GlobalTelemetrySection globalData={globalData} loading={globalLoading} />
        <LocalClimateExplorer />
        <ScienceBriefsSection
          briefs={briefs}
          factChecks={factChecks}
          loading={scienceLoading}
        />
        <ActionHubsSection
          initiatives={initiatives}
          loading={initiativesLoading}
          onJoinInitiative={handleJoinInitiative}
          onOpenRegisterModal={() => setRegisterModalOpen(true)}
        />
      </main>

      <Footer />

      <RegisterHubModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onCreated={handleInitiativeCreated}
      />
    </div>
  );
}
