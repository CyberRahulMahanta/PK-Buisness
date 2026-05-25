import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AdminIcon from '../admin/AdminIcon.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import api, { extractApiError } from '../../lib/api.js'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

function GetInTouchModal() {
  const { loading, user, token } = useAuth()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading || token || user || dismissed) {
      setVisible(false)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setVisible(true)
    }, 10000)

    return () => window.clearTimeout(timer)
  }, [dismissed, loading, token, user])

  useEffect(() => {
    setStatus({ type: '', message: '' })
  }, [location.pathname])

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const closeModal = () => {
    setVisible(false)
    setDismissed(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      await api.post('/api/contact', {
        ...form,
        source: 'popup',
        pageUrl: `${window.location.pathname}${window.location.search}`,
      })
      setForm(initialForm)
      setStatus({ type: 'success', message: 'Thank you. We will contact you soon.' })
      window.setTimeout(closeModal, 1200)
    } catch (error) {
      setStatus({ type: 'error', message: extractApiError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="get-in-touch-backdrop" role="presentation">
      <section aria-labelledby="get-in-touch-title" aria-modal="true" className="get-in-touch-modal" role="dialog">
        <button aria-label="Close get in touch form" className="modal-icon-button" onClick={closeModal} type="button">
          <AdminIcon name="close" size={18} />
        </button>

        <div className="get-in-touch-head">
          <span className="eyebrow">Get in touch</span>
          <h2 id="get-in-touch-title">Need help with tax, GST, or business paperwork?</h2>
          <p>Share your details and the PK Business team will call you back.</p>
        </div>

        <form className="get-in-touch-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Name
              <input name="name" onChange={handleChange} required type="text" value={form.name} />
            </label>
            <label>
              Phone
              <input name="phone" onChange={handleChange} required type="tel" value={form.phone} />
            </label>
            <label className="full-width">
              Email
              <input name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>
            <label className="full-width">
              Other details
              <textarea
                name="message"
                onChange={handleChange}
                placeholder="Tell us what you need help with"
                rows="4"
                value={form.message}
              />
            </label>
          </div>

          {status.message ? <p className={`form-message ${status.type}`}>{status.message}</p> : null}

          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default GetInTouchModal
