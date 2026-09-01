import { useState } from 'react';
import { AlgorithmLayout } from '../../components/AlgorithmLayout';
import { IntroductionTab } from './IntroductionTab';
import { PreSuffixTab } from './PreSuffixTab';
import { PmtTab } from './PmtTab';
import { AnimationTab } from './AnimationTab';
import './kmp.css';

const TABS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'pre-suffix', label: 'Pre / Suffix' },
  { id: 'pmt', label: 'PMT' },
  { id: 'animation', label: 'Animation' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function KmpPage() {
  const [tab, setTab] = useState<TabId>('introduction');

  return (
    <AlgorithmLayout
      title="Knuth–Morris–Pratt"
      tabs={TABS}
      activeTab={tab}
      onTabChange={(id) => setTab(id as TabId)}
    >
      {tab === 'introduction' && <IntroductionTab />}
      {tab === 'pre-suffix' && <PreSuffixTab />}
      {tab === 'pmt' && <PmtTab />}
      {tab === 'animation' && <AnimationTab />}
    </AlgorithmLayout>
  );
}
