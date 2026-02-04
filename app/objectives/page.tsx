'use client';

import { AtlasLayout } from '@/components/layout/AtlasLayout';
import { ObjectivesView } from '@/components/views/ObjectivesView';

export default function ObjectivesPage() {
  return (
    <AtlasLayout currentView="objectives">
      <div className="w-full h-full">
        <ObjectivesView />
      </div>
    </AtlasLayout>
  );
}