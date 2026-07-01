function WhatsAppButton() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '917280873845'
  const callNumber = import.meta.env.VITE_CALL_NUMBER || whatsappNumber
  const message = encodeURIComponent('Hello, I would like to book a consultation for CA services.')

  return (
    <div className="contact-float-stack">
      <a aria-label="Call now" className="call-float" href={`tel:+${callNumber}`}>
        <svg aria-hidden="true" className="contact-float-icon" viewBox="0 0 24 24">
          <path
            d="M20.9 16.5v3.2c0 .9-.7 1.6-1.6 1.6A16.6 16.6 0 0 1 2.7 4.7c0-.9.7-1.6 1.6-1.6h3.2c.8 0 1.4.5 1.6 1.2l.7 3c.2.7-.1 1.4-.7 1.8l-1.5 1A13.1 13.1 0 0 0 14 16.5l1-1.5c.4-.6 1.1-.9 1.8-.7l3 .7c.6.2 1.1.8 1.1 1.5Z"
            fill="currentColor"
          />
        </svg>
        <span>Call Now</span>
      </a>
      <a
        aria-label="Chat on WhatsApp"
        className="whatsapp-float"
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        rel="noreferrer"
        target="_blank"
      >
        <svg aria-hidden="true" className="contact-float-icon" viewBox="0 0 32 32">
          <path
            d="M16 3A13 13 0 0 0 4.7 22.4L3 29l6.8-1.6A13 13 0 1 0 16 3Zm0 22.4c-1.8 0-3.6-.5-5.1-1.5l-.4-.2-4 .9 1-3.9-.3-.4A9.5 9.5 0 1 1 16 25.4Zm5.4-7.1c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2l-.9 1.1c-.2.2-.4.3-.7.1-2-.8-3.3-2-4.2-3.8-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-.9-2c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.8 5.8 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.2-.1-.5-.3-.8-.4Z"
            fill="currentColor"
          />
        </svg>
        <span>WhatsApp</span>
      </a>
    </div>
  )
}

export default WhatsAppButton