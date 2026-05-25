function WhatsAppButton() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '917280873845'
  const message = encodeURIComponent('Hello, I would like to book a consultation for CA services.')

  return (
    <a
      aria-label="Chat on WhatsApp"
      className="whatsapp-float"
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      rel="noreferrer"
      target="_blank"
    >
      WhatsApp
    </a>
  )
}

export default WhatsAppButton
