import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import api, { extractApiError } from '../../lib/api.js'
import { formatDateTime } from '../../lib/formatters.js'
import { serviceCatalog } from '../../data/siteData.js'

const serviceOptions = ['General consultation', ...serviceCatalog.map((service) => service.title)]
const activeAppointmentStatuses = ['pending', 'approved', 'rescheduled', 'confirmed', 'scheduled']

const timeSlots = (() => {
  const slots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let min of [0, 30]) {
      if (hour === 18 && min === 30) break
      const h = hour % 12 === 0 ? 12 : hour % 12
      const ampm = hour < 12 ? 'AM' : 'PM'
      const label = `${h}:${min === 0 ? '00' : min} ${ampm}`
      const value = `${String(hour).padStart(2, '0')}:${min === 0 ? '00' : '30'}`
      slots.push({ label, value })
    }
  }
  return slots
})()

const initialForm = {
  scheduledDate: '',
  scheduledTime: '',
  serviceType: serviceOptions[0],
  notes: '',
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

function combineDatetime(date, time) {
  if (!date || !time) return ''
  return new Date(`${date}T${time}:00`).toISOString()
}

function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const summary = useMemo(() => ({
    total: appointments.length,
    active: appointments.filter((a) => activeAppointmentStatuses.includes(a.status)).length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  }), [appointments])

  const loadAppointments = async () => {
    const { data } = await api.get('/api/appointments')
    setAppointments(data.appointments || [])
  }

  useEffect(() => {
    loadAppointments()
      .catch((error) => setStatus({ type: 'error', message: extractApiError(error) }))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    if (!form.scheduledDate) { setStatus({ type: 'error', message: 'Please select a date.' }); return }
    if (!form.scheduledTime) { setStatus({ type: 'error', message: 'Please select a time slot.' }); return }
    setSubmitting(true)
    try {
      const scheduledFor = combineDatetime(form.scheduledDate, form.scheduledTime)
      await api.post('/api/appointments', { scheduledFor, serviceType: form.serviceType, notes: form.notes })
      setForm(initialForm)
      await loadAppointments()
      setStatus({ type: 'success', message: 'Appointment booked successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: extractApiError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader message="Loading appointments..." />

  return (
    <div className="page-stack">
      <PageHeader
        description="Request a consultation, select the service you need help with, and track approval, reschedule, or completion updates."
        eyebrow="Appointments"
        title="Consultation Booking"
      />

      <section className="card-grid two-up">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h3>Book a consultation</h3>
          <label>
            Selected service
            <select name="serviceType" onChange={handleChange} value={form.serviceType}>
              {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="appointment-datetime-group">
            <label>
              Preferred date
              <input min={getTodayString()} name="scheduledDate" onChange={handleChange} required type="date" value={form.scheduledDate} />
            </label>
            <label>
              Preferred time
              <select name="scheduledTime" onChange={handleChange} required value={form.scheduledTime}>
                <option value="">Select a slot</option>
                {timeSlots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
              </select>
            </label>
          </div>
          {form.scheduledDate && form.scheduledTime ? (
            <p className="appointment-datetime-preview">
              Scheduled for <strong>{new Date(`${form.scheduledDate}T${form.scheduledTime}`).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</strong>
            </p>
          ) : null}
          <label>
            Message
            <textarea name="notes" onChange={handleChange} placeholder="Add context for the discussion" rows="4" value={form.notes} />
          </label>
          {status.message ? <p className={`form-message ${status.type}`}>{status.message}</p> : null}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? 'Booking...' : 'Book Consultation'}
          </button>
        </form>

        <article className="panel document-summary-panel">
          <h3>Appointment summary</h3>
          <div className="document-summary-grid">
            <div className="document-stat-tile"><strong>{summary.total}</strong><span>Total</span></div>
            <div className="document-stat-tile"><strong>{summary.active}</strong><span>Active</span></div>
            <div className="document-stat-tile"><strong>{summary.completed}</strong><span>Completed</span></div>
          </div>
          <ul className="bullet-list">
            <li>New bookings go to admin for review and approval.</li>
            <li>Reschedule, rejection, and admin notes appear in your history below.</li>
          </ul>
        </article>
      </section>

      {appointments.length ? (
        <div className="appt-list">
          {appointments.map((appt) => (
            <article className="appt-row" key={appt._id}>
              <div className="appt-row-left">
                <span className="appt-row-dot" />
              </div>
              <div className="appt-row-body">
                <div className="appt-row-top">
                  <div className="appt-row-info">
                    <strong className="appt-row-datetime">{formatDateTime(appt.scheduledFor)}</strong>
                    <span className="appt-row-service">{appt.serviceType || 'General consultation'}</span>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                {appt.notes ? <p className="appt-row-notes">{appt.notes}</p> : null}
                {appt.rejectionReason ? (
                  <div className="appt-row-tag appt-row-tag-danger">
                    <span>⚠</span> {appt.rejectionReason}
                  </div>
                ) : null}
                {appt.adminNotes ? (
                  <div className="appt-row-tag appt-row-tag-info">
                    <span>💬</span> {appt.adminNotes}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState description="Your booked consultations will show up here." title="No appointments yet" />
      )}
    </div>
  )
}

export default Appointments