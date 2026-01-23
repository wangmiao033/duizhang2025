import React, { useState, useEffect } from 'react'
import './PartnerManager.css'

function PartnerManager({ partners, onPartnersChange }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '游戏研发商',
    tag2: '',
    taxRegistrationNo: '',
    bankName: '',
    bankAccount: '',
    invoiceContent: '',
    recipient: '',
    recipientPhone: '',
    mailingAddress: ''
  })
  const [filterCategory, setFilterCategory] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['游戏研发商', '游戏发行商', '游戏渠道', '第三方供应商']

  const handleAdd = () => {
    if (!formData.name.trim()) {
      alert('请输入客户名称')
      return
    }
    
    const newPartner = {
      id: Date.now(),
      name: formData.name.trim(),
      category: formData.category,
      tag2: formData.tag2.trim(),
      taxRegistrationNo: formData.taxRegistrationNo.trim(),
      bankName: formData.bankName.trim(),
      bankAccount: formData.bankAccount.trim(),
      invoiceContent: formData.invoiceContent.trim(),
      recipient: formData.recipient.trim(),
      recipientPhone: formData.recipientPhone.trim(),
      mailingAddress: formData.mailingAddress.trim(),
      createdAt: new Date().toISOString()
    }
    
    onPartnersChange([...partners, newPartner])
    setFormData({ 
      name: '', 
      category: '游戏研发商', 
      tag2: '',
      taxRegistrationNo: '',
      bankName: '',
      bankAccount: '',
      invoiceContent: '',
      recipient: '',
      recipientPhone: '',
      mailingAddress: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (partner) => {
    setEditingId(partner.id)
    setFormData({
      name: partner.name || '',
      category: partner.category || '游戏研发商',
      tag2: partner.tag2 || '',
      taxRegistrationNo: partner.taxRegistrationNo || '',
      bankName: partner.bankName || '',
      bankAccount: partner.bankAccount || '',
      invoiceContent: partner.invoiceContent || '',
      recipient: partner.recipient || '',
      recipientPhone: partner.recipientPhone || '',
      mailingAddress: partner.mailingAddress || ''
    })
    setShowAddForm(true)
  }

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      alert('请输入客户名称')
      return
    }
    
    const updated = partners.map(p => 
      p.id === editingId 
        ? { 
            ...p, 
            name: formData.name.trim(), 
            category: formData.category, 
            tag2: formData.tag2.trim(),
            taxRegistrationNo: formData.taxRegistrationNo.trim(),
            bankName: formData.bankName.trim(),
            bankAccount: formData.bankAccount.trim(),
            invoiceContent: formData.invoiceContent.trim(),
            recipient: formData.recipient.trim(),
            recipientPhone: formData.recipientPhone.trim(),
            mailingAddress: formData.mailingAddress.trim()
          }
        : p
    )
    onPartnersChange(updated)
    setFormData({ 
      name: '', 
      category: '游戏研发商', 
      tag2: '',
      taxRegistrationNo: '',
      address: '',
      phone: '',
      bankName: '',
      bankAccount: '',
      invoiceContent: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这个客户吗？')) {
      onPartnersChange(partners.filter(p => p.id !== id))
    }
  }

  const handleCancel = () => {
    setFormData({ 
      name: '', 
      category: '游戏研发商', 
      tag2: '',
      taxRegistrationNo: '',
      bankName: '',
      bankAccount: '',
      invoiceContent: '',
      recipient: '',
      recipientPhone: '',
      mailingAddress: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const filteredPartners = partners.filter(p => {
    const matchCategory = filterCategory === '全部' || p.category === filterCategory
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="partner-manager">
      <div className="partner-header">
        <div>
          <h3>客户库管理</h3>
          <p className="partner-count">共 {partners.length} 个客户</p>
        </div>
        <button 
          className="add-partner-btn" 
          onClick={() => {
            setShowAddForm(true)
            setEditingId(null)
            setFormData({ 
              name: '', 
              category: '游戏研发商', 
              tag2: '',
              taxRegistrationNo: '',
              address: '',
              phone: '',
              bankName: '',
              bankAccount: '',
              invoiceContent: '',
              recipient: '',
              recipientPhone: '',
              mailingAddress: ''
            })
          }}
        >
          ➕ 添加客户
        </button>
      </div>

      {showAddForm && (
        <div className="partner-form-card">
          <h4>{editingId ? '编辑客户' : '添加客户'}</h4>
          <div className="partner-form-sections">
            <div className="form-section-basic">
              <h5>基本信息</h5>
              <div className="partner-form-grid">
                <div className="form-group">
                  <label>客户名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入客户名称"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>客户类型 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>备注标签</label>
                  <input
                    type="text"
                    value={formData.tag2}
                    onChange={(e) => setFormData({ ...formData, tag2: e.target.value })}
                    placeholder="可填写其他标签（选填）"
                  />
                </div>
                <div className="form-group">
                  <label>税务登记号</label>
                  <input
                    type="text"
                    value={formData.taxRegistrationNo}
                    onChange={(e) => setFormData({ ...formData, taxRegistrationNo: e.target.value })}
                    placeholder="如：91440101MA59GGLP3X"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section-bank">
              <h5>银行信息</h5>
              <div className="partner-form-grid">
                <div className="form-group full-width">
                  <label>开户行名称</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="如：中国工商银行广州天河工业园支行"
                  />
                </div>
                <div className="form-group full-width">
                  <label>银行账号</label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="银行账号"
                  />
                </div>
              </div>
            </div>

            <div className="form-section-invoice">
              <h5>开票信息</h5>
              <div className="partner-form-grid">
                <div className="form-group full-width">
                  <label>开票内容</label>
                  <input
                    type="text"
                    value={formData.invoiceContent}
                    onChange={(e) => setFormData({ ...formData, invoiceContent: e.target.value })}
                    placeholder="如：信息服务费"
                  />
                </div>
              </div>
            </div>

            <div className="form-section-recipient">
              <h5>收件信息（用于快递账单）</h5>
              <div className="partner-form-grid">
                <div className="form-group">
                  <label>收件人</label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    placeholder="收件人姓名"
                  />
                </div>
                <div className="form-group">
                  <label>收件人电话</label>
                  <input
                    type="text"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    placeholder="手机号码"
                  />
                </div>
                <div className="form-group full-width">
                  <label>邮寄地址</label>
                  <input
                    type="text"
                    value={formData.mailingAddress}
                    onChange={(e) => setFormData({ ...formData, mailingAddress: e.target.value })}
                    placeholder="详细邮寄地址"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={editingId ? handleUpdate : handleAdd}>
                {editingId ? '更新' : '添加'}
              </button>
              <button className="cancel-btn" onClick={handleCancel}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="partner-filters">
        <div className="filter-group">
          <label>类型筛选：</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="全部">全部</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>搜索：</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索客户名称..."
          />
        </div>
      </div>

      <div className="partner-list">
        {filteredPartners.length === 0 ? (
          <div className="empty-partners">
            {partners.length === 0 ? '暂无客户，点击"添加客户"开始创建' : '没有找到匹配的客户'}
          </div>
        ) : (
          <div className="partner-grid">
            {filteredPartners.map(partner => (
              <div key={partner.id} className="partner-card">
                <div className="partner-info">
                  <div className="partner-name">{partner.name}</div>
                  <div className="partner-tags">
                    <span className="tag tag-category">{partner.category}</span>
                    {partner.tag2 && (
                      <span className="tag tag-secondary">{partner.tag2}</span>
                    )}
                  </div>
                  <div className="partner-details">
                    {partner.taxRegistrationNo && (
                      <div className="detail-item">
                        <span className="detail-label">税务登记号：</span>
                        <span className="detail-value">{partner.taxRegistrationNo}</span>
                      </div>
                    )}
                    {partner.bankName && (
                      <div className="detail-item">
                        <span className="detail-label">开户行：</span>
                        <span className="detail-value">{partner.bankName}</span>
                      </div>
                    )}
                    {partner.bankAccount && (
                      <div className="detail-item">
                        <span className="detail-label">银行账号：</span>
                        <span className="detail-value">{partner.bankAccount}</span>
                      </div>
                    )}
                    {partner.invoiceContent && (
                      <div className="detail-item">
                        <span className="detail-label">开票内容：</span>
                        <span className="detail-value">{partner.invoiceContent}</span>
                      </div>
                    )}
                    {(partner.recipient || partner.recipientPhone || partner.mailingAddress) && (
                      <div className="detail-section">
                        <div className="detail-section-title">📦 收件信息</div>
                        {partner.recipient && (
                          <div className="detail-item">
                            <span className="detail-label">收件人：</span>
                            <span className="detail-value">{partner.recipient}</span>
                          </div>
                        )}
                        {partner.recipientPhone && (
                          <div className="detail-item">
                            <span className="detail-label">收件电话：</span>
                            <span className="detail-value">{partner.recipientPhone}</span>
                          </div>
                        )}
                        {partner.mailingAddress && (
                          <div className="detail-item">
                            <span className="detail-label">邮寄地址：</span>
                            <span className="detail-value">{partner.mailingAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="partner-actions">
                  <button className="edit-btn" onClick={() => handleEdit(partner)}>编辑</button>
                  <button className="delete-btn" onClick={() => handleDelete(partner.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PartnerManager
