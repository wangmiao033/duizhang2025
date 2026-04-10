import fs from 'fs'
const p = 'src/components/DataTable.jsx'
let s = fs.readFileSync(p, 'utf8')
const marker = '<td>{record.game || \'-\'}</td>'
const listIdx = s.indexOf(marker)
if (listIdx < 0) {
  console.error('marker not found')
  process.exit(1)
}
const start = listIdx
const endMarker = `                        <button className="edit-btn" onClick={() => startEdit(record)}>编辑</button>
                        <button className="delete-btn" onClick={() => onDeleteRecord(record.id)}>删除</button>
                      </td>
                    </>`
const end = s.indexOf(endMarker, start)
if (end < 0) {
  console.error('end not found')
  process.exit(1)
}
const endFull = end + endMarker.length
const yen = '\uFFE5'
const repl = `<td>{record.game || '-'}</td>
                      {compact ? (
                        <>
                          <td className="amount-cell">${yen}{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td className="amount-cell settlement-amount">
                            ${yen}{parseFloat(record.settlementAmount || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="amount-cell">${yen}{parseFloat(record.gameFlow || 0).toFixed(2)}</td>
                          <td className="amount-cell">${yen}{parseFloat(record.testingFee || 0).toFixed(2)}</td>
                          <td className="amount-cell">${yen}{parseFloat(record.voucher || 0).toFixed(2)}</td>
                          <td>{record.channelFeeRate || '0'}%</td>
                          <td>{record.taxPoint || '0'}%</td>
                          <td>{record.revenueShareRatio || '0'}%</td>
                          <td>{record.discount || '0'}</td>
                          <td className="amount-cell">${yen}{parseFloat(record.refund || 0).toFixed(2)}</td>
                          <td className="amount-cell settlement-amount">
                            ${yen}{parseFloat(record.settlementAmount || 0).toFixed(2)}
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
                      </td>
                    </>`
s = s.slice(0, start) + repl + s.slice(endFull)
fs.writeFileSync(p, s)
console.log('patched')
