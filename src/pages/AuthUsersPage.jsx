import React, { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { createAuthUser, listAuthUsers, resetAuthUserPassword, setAuthUserStatus } from '@/features/auth/api'
import { useAuth } from '@/features/auth/AuthContext.jsx'
import { useAppState } from '@/app/AppStateContext.jsx'

function AuthUsersPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useAppState()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', displayName: '', role: 'user', password: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await listAuthUsers()
      setRows(res.items || [])
    } catch (err) {
      console.error(err)
      showToast('加载账号失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  if (!isAdmin) {
    return <div className="admin-workspace__card">仅管理员可访问账号管理。</div>
  }

  return (
    <div className="admin-workspace-stack">
      <div className="admin-workspace__card">
        <h3 style={{ marginTop: 0 }}>新增账号</h3>
        <div className="form-row">
          <div className="form-group">
            <label>邮箱</label>
            <input className="admin-input" value={form.email} onChange={(e) => setForm((x) => ({ ...x, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>显示名</label>
            <input className="admin-input" value={form.displayName} onChange={(e) => setForm((x) => ({ ...x, displayName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>角色</label>
            <select className="admin-input" value={form.role} onChange={(e) => setForm((x) => ({ ...x, role: e.target.value }))}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>初始密码（可选）</label>
            <input className="admin-input" type="password" value={form.password} onChange={(e) => setForm((x) => ({ ...x, password: e.target.value }))} />
          </div>
        </div>
        <button
          className="rec-btn rec-btn--primary"
          type="button"
          onClick={async () => {
            if (!form.email.trim()) return
            try {
              await createAuthUser(form)
              setForm({ email: '', displayName: '', role: 'user', password: '' })
              showToast('账号创建成功', 'success')
              await load()
            } catch (err) {
              if (err instanceof ApiError) showToast(`创建失败：${err.message}`, 'error')
              else showToast('创建失败', 'error')
            }
          }}
        >
          创建账号
        </button>
      </div>

      <div className="admin-workspace__card">
        <h3 style={{ marginTop: 0 }}>账号列表</h3>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>邮箱</th>
                <th>显示名</th>
                <th>角色</th>
                <th>状态</th>
                <th>失败次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{r.display_name || '-'}</td>
                  <td>{r.role}</td>
                  <td>{r.is_active ? '启用' : '禁用'}</td>
                  <td>{r.failed_login_count}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="rec-btn rec-btn--ghost"
                      onClick={async () => {
                        try {
                          await setAuthUserStatus(r.id, !r.is_active)
                          showToast('状态已更新', 'success')
                          await load()
                        } catch (err) {
                          if (err instanceof ApiError) showToast(`更新失败：${err.message}`, 'error')
                          else showToast('更新失败', 'error')
                        }
                      }}
                    >
                      {r.is_active ? '禁用' : '启用'}
                    </button>
                    <button
                      type="button"
                      className="rec-btn rec-btn--ghost"
                      onClick={async () => {
                        const pwd = window.prompt(`为 ${r.email} 输入新密码（至少6位）`)
                        if (!pwd || pwd.trim().length < 6) return
                        try {
                          await resetAuthUserPassword(r.id, pwd.trim())
                          showToast('密码已重置', 'success')
                        } catch (err) {
                          if (err instanceof ApiError) showToast(`重置失败：${err.message}`, 'error')
                          else showToast('重置失败', 'error')
                        }
                      }}
                    >
                      重置密码
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AuthUsersPage
