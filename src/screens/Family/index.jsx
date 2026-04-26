import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, X, UserPlus, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { relativeTime } from '../../lib/dates.js'
import { ROLES } from '../../config/navigation.js'
import appConfig from '../../config/app.config.js'

// ── Helpers ───────────────────────────────────────────────────────

function initials(name, email) {
  const src = name || email || '?'
  return src.trim()[0].toUpperCase()
}

function RoleBadge({ role, t }) {
  const styles = {
    owner:  { background: 'var(--sage-700)', color: 'white' },
    family: { background: 'var(--sage-100)',  color: 'var(--sage-700)' },
    viewer: { background: 'var(--linen-200)', color: 'var(--ink-600)' },
  }
  return (
    <span style={{
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 6, letterSpacing: '0.02em',
      flexShrink: 0,
      ...styles[role],
    }}>
      {t(`family.roles.${role}`)}
    </span>
  )
}

// ── Member row ────────────────────────────────────────────────────

function MemberRow({ member, isYou, canManage, onChangeRole, onRemove, t, i18n }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rolePickerOpen, setRolePickerOpen] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleChangeRole = (newRole) => {
    onChangeRole(member.id, newRole)
    setRolePickerOpen(false)
    setMenuOpen(false)
  }

  const handleRemove = () => {
    setMenuOpen(false)
    onRemove(member.id)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: 'var(--linen-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
        color: 'var(--ink-600)',
      }}>
        {initials(member.display_name, member.email)}
      </div>

      {/* Name + last active */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            color: 'var(--ink-900)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {member.display_name || member.email}
          </p>
          {isYou && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              color: 'var(--ink-400)', letterSpacing: '0.04em',
            }}>
              ({t('family.you')})
            </span>
          )}
        </div>
        {member.last_active_at && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-400)', margin: '2px 0 0' }}>
            {t('family.last_active', { time: relativeTime(member.last_active_at, i18n.language) })}
          </p>
        )}
      </div>

      <RoleBadge role={member.role} t={t} />

      {/* Overflow menu — owners can manage family/viewer members */}
      {canManage && !isYou && member.role !== ROLES.OWNER && (
        <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(o => !o); setRolePickerOpen(false) }}
            aria-label="More options"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: menuOpen ? 'var(--linen-200)' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background var(--duration-fast) var(--ease-default)',
            }}
          >
            <MoreHorizontal size={18} color="var(--ink-400)" />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--linen-50)',
              border: '1px solid var(--linen-200)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              minWidth: 160,
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {!rolePickerOpen ? (
                <>
                  <MenuButton onClick={() => setRolePickerOpen(true)}>
                    {t('family.change_role')}
                  </MenuButton>
                  <div style={{ borderTop: '1px solid var(--linen-200)' }} />
                  <MenuButton onClick={handleRemove} danger>
                    {t('family.remove')}
                  </MenuButton>
                </>
              ) : (
                <div style={{ padding: '8px' }}>
                  {[ROLES.FAMILY, ROLES.VIEWER].map(role => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(role)}
                      style={{
                        width: '100%', padding: '9px 10px', borderRadius: 8,
                        textAlign: 'left',
                        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                        background: member.role === role ? 'var(--sage-100)' : 'transparent',
                        color: member.role === role ? 'var(--sage-700)' : 'var(--ink-600)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}
                    >
                      {t(`family.roles.${role}`)}
                      {member.role === role && <Check size={13} strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MenuButton({ onClick, danger, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '11px 14px', textAlign: 'left',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
        color: danger ? 'var(--clay)' : 'var(--ink-900)',
        background: hovered ? 'var(--linen-100)' : 'transparent',
        border: 'none', cursor: 'pointer', display: 'block',
        transition: 'background var(--duration-fast) var(--ease-default)',
      }}
    >
      {children}
    </button>
  )
}

// ── Pending invite row ────────────────────────────────────────────

function PendingRow({ invite, onResend, onCancel, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: 'var(--linen-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700,
        color: 'var(--ink-400)',
      }}>
        …
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          color: 'var(--ink-600)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {invite.email}
        </p>
        <RoleBadge role={invite.role} t={t} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          className="ls-btn-ghost"
          onClick={() => onResend(invite)}
          style={{ height: 32, padding: '0 10px', fontSize: 12 }}
        >
          {t('family.pending.resend')}
        </button>
        <button
          onClick={() => onCancel(invite.id)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--linen-200)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} color="var(--ink-400)" />
        </button>
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────

export default function FamilyScreen() {
  const { t, i18n } = useTranslation()
  const { session, supabase } = useAuth()
  const { isNative } = usePlatform()

  const [members, setMembers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'family' })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase.from('babies').select('id').eq('owner_id', session.user.id).single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      const [{ data: profiles }, { data: invites }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('baby_id', babyId),
        supabase.from('invitations').select('*').eq('baby_id', babyId).eq('status', 'pending'),
      ])
      setMembers(profiles || [])
      setPendingInvites(invites || [])
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session, getBabyId])

  useEffect(() => { load() }, [load])

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await supabase.from('user_profiles').update({ role: newRole }).eq('id', memberId)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    } catch { /* tolerated */ }
  }

  const handleRemove = async (memberId) => {
    try {
      await supabase.from('user_profiles').delete().eq('id', memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch { /* tolerated */ }
  }

  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!inviteForm.email.trim()) return
    setInviteSending(true)
    try {
      const babyId = await getBabyId()
      await supabase.functions.invoke('invite-user', {
        body: { email: inviteForm.email.trim(), role: inviteForm.role, babyId },
      }).catch(() => null)

      // Optimistic pending entry
      setPendingInvites(prev => [
        { id: `temp-${Date.now()}`, email: inviteForm.email.trim(), role: inviteForm.role },
        ...prev,
      ])
      setInviteSent(true)
      setInviteForm({ email: '', role: 'family' })
      setTimeout(() => { setInviteSent(false); setInviteOpen(false) }, 2000)
    } catch { /* tolerated */ } finally {
      setInviteSending(false)
    }
  }

  const handleResend = async (invite) => {
    await supabase.functions.invoke('invite-user', {
      body: { email: invite.email, role: invite.role },
    }).catch(() => null)
  }

  const handleCancelInvite = async (inviteId) => {
    try {
      if (!String(inviteId).startsWith('temp-')) {
        await supabase.from('invitations').delete().eq('id', inviteId)
      }
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch { /* tolerated */ }
  }

  // Sort: owner → family → viewer
  const roleOrder = { owner: 0, family: 1, viewer: 2 }
  const sorted = [...members].sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3))

  const currentUserProfile = members.find(m => m.id === session?.user?.id)
  const canManage = currentUserProfile?.role === ROLES.OWNER

  return (
    <div style={{
      padding: isNative ? '20px 16px 32px' : '28px 32px',
      maxWidth: 640,
      margin: '0 auto',
    }}>
      {/* Header */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: isNative ? 24 : 28,
        fontWeight: 700,
        color: 'var(--ink-900)',
        margin: '0 0 6px',
        fontOpticalSizing: 'auto',
        fontVariationSettings: '"opsz" 48, "SOFT" 50',
      }}>
        {appConfig.family.name}
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-600)', margin: '0 0 28px' }}>
        {t('family.subtitle', { name: appConfig.baby.nickname })}
      </p>

      {/* Members card */}
      <div className="ls-card" style={{ marginBottom: 14, overflow: 'visible' }}>
        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
            {t('common.loading')}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
            —
          </div>
        ) : (
          sorted.map((member, i) => (
            <div key={member.id}>
              <MemberRow
                member={member}
                isYou={member.id === session?.user?.id}
                canManage={canManage}
                onChangeRole={handleChangeRole}
                onRemove={handleRemove}
                t={t}
                i18n={i18n}
              />
              {i < sorted.length - 1 && (
                <div style={{ borderTop: '1px solid var(--linen-200)', margin: '0 16px' }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Invite button / form */}
      {!inviteOpen ? (
        <button
          onClick={() => setInviteOpen(true)}
          style={{
            width: '100%', height: 52, borderRadius: 20,
            border: '1.5px dashed var(--sage-300)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            color: 'var(--sage-700)', cursor: 'pointer',
            marginBottom: 28,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sage-50)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <UserPlus size={17} />
          {t('family.invite.button')}
        </button>
      ) : (
        <form
          onSubmit={handleSendInvite}
          className="ls-card"
          style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}
        >
          <div>
            <label className="ls-label">{t('family.invite.email_label')}</label>
            <input
              autoFocus
              type="email"
              className="ls-input"
              value={inviteForm.email}
              onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              placeholder={t('family.invite.email_placeholder')}
              required
            />
          </div>

          <div>
            <label className="ls-label">{t('family.invite.role_label')}</label>
            <div className="ls-seg" style={{ width: '100%', display: 'flex' }}>
              {[ROLES.FAMILY, ROLES.VIEWER].map(role => (
                <button
                  key={role}
                  type="button"
                  className={inviteForm.role === role ? 'on' : ''}
                  onClick={() => setInviteForm(f => ({ ...f, role }))}
                  style={{ flex: 1 }}
                >
                  {t(`family.roles.${role}`)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="ls-btn-ghost"
              onClick={() => { setInviteOpen(false); setInviteForm({ email: '', role: 'family' }); setInviteSent(false) }}
              style={{ flex: 1 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="ls-btn-primary lg"
              disabled={inviteSending || !inviteForm.email.trim() || inviteSent}
              style={{
                flex: 2,
                opacity: !inviteForm.email.trim() ? 0.5 : 1,
                background: inviteSent ? 'var(--sage-500)' : undefined,
                transition: 'background 300ms',
              }}
            >
              {inviteSent
                ? t('family.invite.sent')
                : inviteSending
                  ? t('common.loading')
                  : t('family.invite.send')}
            </button>
          </div>
        </form>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-micro)',
            fontWeight: 700, color: 'var(--ink-400)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            margin: '0 0 10px',
          }}>
            {t('family.pending.title')}
          </p>
          <div className="ls-card" style={{ overflow: 'visible' }}>
            {pendingInvites.map((invite, i) => (
              <div key={invite.id}>
                <PendingRow
                  invite={invite}
                  onResend={handleResend}
                  onCancel={handleCancelInvite}
                  t={t}
                />
                {i < pendingInvites.length - 1 && (
                  <div style={{ borderTop: '1px solid var(--linen-200)', margin: '0 16px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
