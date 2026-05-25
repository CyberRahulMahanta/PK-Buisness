import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import AdminIcon from '../../components/admin/AdminIcon.jsx'
import api, { extractApiError } from '../../lib/api.js'
import { formatDateTime } from '../../lib/formatters.js'

function sourceLabel(source = 'contact') {
  return source === 'popup' ? 'Popup' : 'Contact Page'
}

function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [summary, setSummary] = useState({ total: 0, popupLeads: 0, contactPage: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    api.get('/api/admin/contact-messages')
      .then(({ data }) => {
        setMessages(data.messages || [])
        setSummary(data.summary || { total: 0, popupLeads: 0, contactPage: 0 })
      })
      .catch((error) => {
        setStatus({ type: 'error', message: extractApiError(error) })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return messages.filter((message) => {
      const matchesSource = sourceFilter === 'all' || message.source === sourceFilter
      const matchesQuery =
        !query ||
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.phone.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query)

      return matchesSource && matchesQuery
    })
  }, [messages, searchTerm, sourceFilter])

  if (loading) {
    return <Loader message="Loading inquiries..." />
  }

  return (
    <div className="page-stack admin-page-stack">
      <PageHeader
        description="Review all callback requests submitted from the public website and timed get-in-touch popup."
        eyebrow="Lead Inbox"
        title="Website Inquiries"
      />

      <section className="admin-kpi-grid admin-kpi-grid-three">
        <article className="admin-kpi-card">
          <div className="admin-kpi-icon">
            <AdminIcon name="message" size={18} />
          </div>
          <span>Total Inquiries</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="admin-kpi-card">
          <div className="admin-kpi-icon">
            <AdminIcon name="phone" size={18} />
          </div>
          <span>Popup Leads</span>
          <strong>{summary.popupLeads}</strong>
        </article>
        <article className="admin-kpi-card">
          <div className="admin-kpi-icon">
            <AdminIcon name="email" size={18} />
          </div>
          <span>Contact Page</span>
          <strong>{summary.contactPage}</strong>
        </article>
      </section>

      {status.message ? <p className={`form-message ${status.type}`}>{status.message}</p> : null}

      <section className="panel admin-table-surface">
        <div className="admin-table-head">
          <div>
            <span className="admin-surface-eyebrow">Requests</span>
            <h3>Get in touch submissions</h3>
            <p>Name, phone, email, page source, and customer details are saved here.</p>
          </div>

          <div className="admin-table-controls">
            <label className="admin-search-field">
              <AdminIcon name="search" size={16} />
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search inquiries"
                type="text"
                value={searchTerm}
              />
            </label>
            <select onChange={(event) => setSourceFilter(event.target.value)} value={sourceFilter}>
              <option value="all">All Sources</option>
              <option value="popup">Popup</option>
              <option value="contact">Contact Page</option>
            </select>
          </div>
        </div>

        {filteredMessages.length ? (
          <div className="admin-inquiry-list">
            {filteredMessages.map((message) => (
              <article className="admin-inquiry-card" key={message._id}>
                <div className="admin-inquiry-main">
                  <div>
                    <span className="admin-message-type">{sourceLabel(message.source)}</span>
                    <h4>{message.name}</h4>
                    <p>{message.message}</p>
                  </div>
                  <small>{formatDateTime(message.createdAt)}</small>
                </div>

                <div className="admin-inquiry-meta">
                  <a href={`tel:${message.phone}`}>
                    <AdminIcon name="phone" size={15} />
                    {message.phone}
                  </a>
                  <a href={`mailto:${message.email}`}>
                    <AdminIcon name="email" size={15} />
                    {message.email}
                  </a>
                  {message.pageUrl ? <span>Page: {message.pageUrl}</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState description="Try changing the search term or source filter." title="No inquiries found" />
        )}
      </section>
    </div>
  )
}

export default ContactMessages
