import React, { useState, useEffect } from 'react'
import './DeliveryCenter.css'

function DeliveryCenter({ deliveries, onDeliveriesChange, partners = [] }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    trackingNumber: '',
    courierCompany: '',
    recipient: '',
    recipientPhone: '',
    address: '',
    partnerId: '',
    status: '待寄出',
    sendDate: '',
    expectedDate: '',
    remark: ''
  })
  const [filterStatus, setFilterStatus] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')

  const courierCompanies = ['顺丰', '圆通', '中通', '申通', '韵达', 'EMS', '京东物流', '其他']
  const statuses = ['待寄出', '已寄出', '运输中', '已送达', '已签收', '异常']

  const handleAdd = () => {
    if (!formData.trackingNumber.trim() && formData.status !== '待寄出') {
      alert('已寄出的快递需要填写快递单号')
      return
    }
    
    const newDelivery = {
      id: Date.now(),
      trackingNumber: formData.trackingNumber.trim(),
      courierCompany: formData.courierCompany || '其他',
      recipient: formData.recipient.trim(),
      recipientPhone: formData.recipientPhone.trim(),
      address: formData.address.trim(),
      partnerId: formData.partnerId || null,
      partnerName: formData.partnerId ? partners.find(p => p.id === parseInt(formData.partnerId))?.name : '',
      status: formData.status,
      sendDate: formData.sendDate || '',
      expectedDate: formData.expectedDate || '',
      remark: formData.remark.trim(),
      createdAt: new Date().toISOString()
    }
    
    onDeliveriesChange([...deliveries, newDelivery])
    resetForm()
    setShowAddForm(false)
  }

  const handleEdit = (delivery) => {
    setEditingId(delivery.id)
    setFormData({
      trackingNumber: delivery.trackingNumber || '',
      courierCompany: delivery.courierCompany || '',
      recipient: delivery.recipient || '',
      recipientPhone: delivery.recipientPhone || '',
      address: delivery.address || '',
      partnerId: delivery.partnerId ? String(delivery.partnerId) : '',
      status: delivery.status || '待寄出',
      sendDate: delivery.sendDate || '',
      expectedDate: delivery.expectedDate || '',
      remark: delivery.remark || ''
    })
    setShowAddForm(true)
  }

  const handleUpdate = () => {
    if (!formData.trackingNumber.trim() && formData.status !== '待寄出') {
      alert('已寄出的快递需要填写快递单号')
      return
    }
    
    const updated = deliveries.map(d => 
      d.id === editingId 
        ? { 
            ...d,
            trackingNumber: formData.trackingNumber.trim(),
            courierCompany: formData.courierCompany || '其他',
            recipient: formData.recipient.trim(),
            recipientPhone: formData.recipientPhone.trim(),
            address: formData.address.trim(),
            partnerId: formData.partnerId ? parseInt(formData.partnerId) : null,
            partnerName: formData.partnerId ? partners.find(p => p.id === parseInt(formData.partnerId))?.name : '',
            status: formData.status,
            sendDate: formData.sendDate || '',
            expectedDate: formData.expectedDate || '',
            remark: formData.remark.trim()
          }
        : d
    )
    onDeliveriesChange(updated)
    resetForm()
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这条快递记录吗？')) {
      onDeliveriesChange(deliveries.filter(d => d.id !== id))
    }
  }

  const handleCancel = () => {
    resetForm()
    setEditingId(null)
    setShowAddForm(false)
  }

  const resetForm = () => {
    setFormData({
      trackingNumber: '',
      courierCompany: '',
      recipient: '',
      recipientPhone: '',
      address: '',
      partnerId: '',
      status: '待寄出',
      sendDate: '',
      expectedDate: '',
      remark: ''
    })
  }

  const filteredDeliveries = deliveries.filter(d => {
    const matchStatus = filterStatus === '全部' || d.status === filterStatus
    const matchSearch = !searchTerm || 
      d.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.address?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStatus && matchSearch
  })

  const getStatusClass = (status) => {
    const statusMap = {
      '待寄出': 'pending',
      '已寄出': 'sent',
      '运输中': 'transit',
      '已送达': 'delivered',
      '已签收': 'received',
      '异常': 'error'
    }
    return statusMap[status] || 'pending'
  }

  return (
    <div className="delivery-center">
      <div className="delivery-header">
        <div>
          <h3>快递中心</h3>
          <p className="delivery-count">共 {deliveries.length} 条快递记录</p>
        </div>
        <button 
          className="add-delivery-btn" 
          onClick={() => {
            setShowAddForm(true)
            setEditingId(null)
            resetForm()
          }}
        >
          ➕ 添加快递
        </button>
      </div>

      {showAddForm && (
        <div className="delivery-form-card">
          <h4>{editingId ? '编辑快递' : '添加快递'}</h4>
          <div className="delivery-form-sections">
            <div className="form-section-basic">
              <h5>基本信息</h5>
              <div className="delivery-form-grid">
                <div className="form-group">
                  <label>快递单号</label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="快递单号（待寄出可留空）"
                  />
                </div>
                <div className="form-group">
                  <label>快递公司 *</label>
                  <select
                    value={formData.courierCompany}
                    onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {courierCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>状态 *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>关联客户</label>
                  <select
                    value={formData.partnerId}
                    onChange={(e) => {
                      const selectedPartner = partners.find(p => p.id === parseInt(e.target.value))
                      setFormData({ 
                        ...formData, 
                        partnerId: e.target.value,
                        recipient: selectedPartner ? (selectedPartner.recipient || '') : formData.recipient,
                        recipientPhone: selectedPartner ? (selectedPartner.recipientPhone || '') : formData.recipientPhone,
                        address: selectedPartner ? (selectedPartner.mailingAddress || '') : formData.address
                      })
                    }}
                  >
                    <option value="">不关联</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section-recipient">
              <h5>收件信息</h5>
              <div className="delivery-form-grid">
                <div className="form-group">
                  <label>收件人 *</label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    placeholder="收件人姓名"
                  />
                </div>
                <div className="form-group">
                  <label>收件人电话 *</label>
                  <input
                    type="text"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    placeholder="联系电话"
                  />
                </div>
                <div className="form-group full-width">
                  <label>收件地址 *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="详细地址"
                  />
                </div>
              </div>
            </div>

            <div className="form-section-date">
              <h5>时间信息</h5>
              <div className="delivery-form-grid">
                <div className="form-group">
                  <label>寄出日期</label>
                  <input
                    type="date"
                    value={formData.sendDate}
                    onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>预计送达</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section-remark">
              <h5>备注</h5>
              <div className="delivery-form-grid">
                <div className="form-group full-width">
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="备注信息（选填）"
                    rows="3"
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

      <div className="delivery-filters">
        <div className="filter-group">
          <label>状态筛选：</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="全部">全部</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>搜索：</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索单号、收件人、客户..."
          />
        </div>
      </div>

      <div className="delivery-list">
        {filteredDeliveries.length === 0 ? (
          <div className="empty-deliveries">
            {deliveries.length === 0 ? '暂无快递记录，点击"添加快递"开始创建' : '没有找到匹配的快递记录'}
          </div>
        ) : (
          <div className="delivery-table-wrapper">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>快递单号</th>
                  <th>快递公司</th>
                  <th>收件人</th>
                  <th>收件地址</th>
                  <th>关联客户</th>
                  <th>状态</th>
                  <th>寄出日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map(delivery => (
                  <tr key={delivery.id}>
                    <td>{delivery.trackingNumber || '-'}</td>
                    <td>{delivery.courierCompany || '-'}</td>
                    <td>
                      <div>{delivery.recipient}</div>
                      {delivery.recipientPhone && (
                        <div className="phone-text">{delivery.recipientPhone}</div>
                      )}
                    </td>
                    <td className="address-cell">{delivery.address || '-'}</td>
                    <td>{delivery.partnerName || '-'}</td>
                    <td>
                      <span className={`status-badge status-${getStatusClass(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.sendDate || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(delivery)}>编辑</button>
                        <button className="delete-btn" onClick={() => handleDelete(delivery.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryCenter
