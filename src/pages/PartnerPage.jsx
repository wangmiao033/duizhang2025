import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PartnerManager from '@/components/PartnerManager.jsx'
import GamePresets from '@/components/GamePresets.jsx'
import CompanyInfo from '@/components/CompanyInfo.jsx'
import { VIEWS } from '@/app/routes.js'

function PartnerPage({ section }) {
  const { settings, showToast } = useAppState()
  const { partyA, partyB, setPartyA, setPartyB, partners, setPartners } = settings

  return (
    <PageContainer hideHeader>
      {section === VIEWS.PARTNER_CONTACTS && (
        <div className="partner-page">
          <PartnerManager
            partners={partners}
            onPartnersChange={(newPartners) => {
              setPartners(newPartners)
              showToast('客户库已更新', 'success')
            }}
          />
        </div>
      )}
      {section === VIEWS.PARTNER_GAMES && <GamePresets />}
      {section === VIEWS.PARTNER_COMPANY && (
        <CompanyInfo partyA={partyA} partyB={partyB} onUpdatePartyA={setPartyA} onUpdatePartyB={setPartyB} />
      )}
    </PageContainer>
  )
}

export default PartnerPage
