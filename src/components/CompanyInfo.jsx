import React from 'react'
import './CompanyInfo.css'

function CompanyInfo({ partyA, partyB, onUpdatePartyA, onUpdatePartyB }) {
  const updatePartyA = (field, value) => {
    onUpdatePartyA({ ...partyA, [field]: value })
  }

  const updatePartyB = (field, value) => {
    onUpdatePartyB({ ...partyB, [field]: value })
  }

  return (
    <div className="company-info">
      <h3>公司信息配置</h3>
      <div className="company-info-grid">
        <div className="company-section">
          <h4>甲方信息</h4>
          <div className="info-form">
            <div className="info-group">
              <label>发票抬头：</label>
              <input
                type="text"
                value={partyA.invoiceTitle}
                onChange={(e) => updatePartyA('invoiceTitle', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>发票内容：</label>
              <input
                type="text"
                value={partyA.invoiceContent}
                onChange={(e) => updatePartyA('invoiceContent', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>开票税务登记号：</label>
              <input
                type="text"
                value={partyA.taxRegistrationNo}
                onChange={(e) => updatePartyA('taxRegistrationNo', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>开票地址：</label>
              <input
                type="text"
                value={partyA.invoiceAddress}
                onChange={(e) => updatePartyA('invoiceAddress', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>开票基本户银行：</label>
              <input
                type="text"
                value={partyA.bankName}
                onChange={(e) => updatePartyA('bankName', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>开票基本户账号：</label>
              <input
                type="text"
                value={partyA.bankAccount}
                onChange={(e) => updatePartyA('bankAccount', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>电话：</label>
              <input
                type="text"
                value={partyA.phone}
                onChange={(e) => updatePartyA('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="company-section">
          <h4>乙方信息</h4>
          <div className="info-form">
            <div className="info-group">
              <label>公司名称：</label>
              <input
                type="text"
                value={partyB.companyName}
                onChange={(e) => updatePartyB('companyName', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>账户开户行：</label>
              <input
                type="text"
                value={partyB.bankName}
                onChange={(e) => updatePartyB('bankName', e.target.value)}
              />
            </div>
            <div className="info-group">
              <label>银行账号：</label>
              <input
                type="text"
                value={partyB.bankAccount}
                onChange={(e) => updatePartyB('bankAccount', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyInfo

