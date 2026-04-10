import fs from 'fs'
const p = 'src/components/DataTable.jsx'
let s = fs.readFileSync(p, 'utf8')
const old = `                      <td>{record.game || '-'}</td>
                      <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                      <td className="amount-cell">¥{parseFloat(record.testingFee || 0).toFixed(2)}</td>
                      <td className="amount-cell">¥{parseFloat(record.voucher || 0).toFixed(2)}</td>
                      <td>{record.channelFeeRate || '0'}%</td>
                      <td>{record.taxPoint || '0'}%</td>
                      <td>{record.revenueShareRatio || '0'}%</td>
                      <td>{record.discount || '0'}</td>
                      <td className="amount-cell">¥{parseFloat(record.refund || 0).toFixed(2)}</td>
                      <td className="amount-cell settlement-�{parseFloat(record.settlementAmount || 0).toFixed(2)}
                      </td>
                      <td>
                        <StatusSelector
                          currentStatus={record.status || 'pending'}
                          onStatusChange={(newStatus) => onStatusChange && onStatusChange(record.id, newStatus)}
                        />
                      </td>
                      <td>
                        {onCopyRecord && <CopyRecord record={record} onCopy={onCopyRecord} />}
                        <button className="edit-btn" onClick={() => startEdit(record)}>编辑</button>
                        <button className="delete-btn" onClick={() => onDeleteRecord(record.id)}>删除</button>
                      </td>`
const neu = `                      <td>{record.game || '-'}</td>
                      {compact ? (
                        <>
                          <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td className="amount-cell settlement-amount">
                            ��{parseFloat(record.settlementAmount || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="amount-cell">¥{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td className="amount-cell">¥{parseFloat(record.testingFee || 0).toFixed(2)}</td>
                          <td className="amount-cell">¥{parseFloat(record.voucher || 0).toFixed(2)}</td>
                          <td>{record.channelFeeRate || '0'}%</td>
                          <td>{record.taxPoint || '0'}%</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td>{record.discount || '0'}</td>
                          <td className="amount-cell">¥{parseFloat(record.refund || 0).toFixed(2)}</td>
                          <td className="amount-cell settlement-amount">
                            ��{parseFloat(record.settlementAmount || 0).toFixed(2)}
                          </td>
                        </>
                      )}
                      <td>
                        <StatusSelector
                          currentStatus={record.status || 'pending'}
                          onStatusChange={(newStatus) => onStatusChange && onStatusChange(record.id, newStatus)}
                        />
                      </td>
                      <td>
                        {onCopyRecord && <CopyRecord record={record} onCopy={onCopyRecord} />}
                        <button type="button" className="edit-btn" onClick={() => startEdit(record)}>编辑</button>
                        <button type="button" className="delete-btn" onClick={() => onDeleteRecord(record.id)}>删除</button>
                      </td>`
if (!s.includes(old)) {
  console.error('pattern not found')
  process.exit(1)
}
s = s.replace(old, neu)
fs.writeFileSync(p, s)
console.log('ok')
