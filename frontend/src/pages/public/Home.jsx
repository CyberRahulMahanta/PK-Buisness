import { Link } from 'react-router-dom'
import bannerOne from '../../assets/Banner1.jpeg'
import bannerTwo from '../../assets/Banner2.jpeg'
import bannerThree from '../../assets/Banner3.jpeg'
import homeHeroProfile from '../../assets/home-hero-profile.jpg'
import { serviceCatalog, testimonials } from '../../data/siteData.js'

const homeBanners = [
  { src: bannerOne, alt: 'PK Business service banner one' },
  { src: bannerTwo, alt: 'PK Business service banner two' },
  { src: bannerThree, alt: 'PK Business service banner three' },
]

function Home() {
  return (
    <div className="page-stack">
      <section className="hero-section home-hero-section container">
        <div className="hero-copy home-hero-copy">
          <span className="eyebrow">Professional business support</span>
          <h1>Welcome to P.K Business Solution</h1>
          <img
            alt="PK Business professional reviewing business documents"
            className="home-hero-inline-image"
            src={homeHeroProfile}
          />
          <p>
            We help professionals, families, and growing businesses handle tax filing,
            registrations, and ongoing compliance with a more organized and dependable process.
          </p>
        </div>

        <div className="home-hero-media">
          <div className="home-banner-showcase" aria-label="PK Business featured services">
            {homeBanners.map((banner, index) => (
              <img
                alt={banner.alt}
                className="home-banner-slide"
                key={banner.src}
                src={banner.src}
                style={{ '--banner-index': index }}
              />
            ))}
          </div>

          <div className="home-hero-bottom">
            <div className="hero-actions">
              <Link className="button button-primary" to="/contact">
                Book Consultation
              </Link>
              <Link className="button button-ghost" to="/services">
                Explore Services
              </Link>
            </div>
            <div className="hero-service-strip">
              <span>ITR Filing</span>
              <span>GST Registration</span>
              <span>Udyam Support</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Core Services</span>
            <h2>Built for individuals, founders, and finance teams.</h2>
          </div>
          <Link className="text-link" to="/services">
            View all services
          </Link>
        </div>

        <div className="card-grid three-up">
          {serviceCatalog.slice(0, 3).map((service) => (
            <article className="info-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <ul className="bullet-list">
                {service.deliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="button button-primary button-compact service-book-button" to="/login">
                Book Now
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="cta-banner">
          <div>
            <span className="eyebrow">Need expert guidance?</span>
            <h2>Book a consultation and get a practical action plan for your next compliance step.</h2>
          </div>
          <Link className="button button-secondary" to="/contact">
            Book Consultation
          </Link>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Client Feedback</span>
            <h2>Trusted by growing businesses and busy professionals.</h2>
          </div>
        </div>

        <div className="card-grid three-up">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <p>"{testimonial.quote}"</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.company}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
