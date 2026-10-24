import StarRating from "./Reviews/StarRating";

// Placeholder copy until real client testimonials are supplied; labelled "Sample" on the page.
const SAMPLE_TESTIMONIALS = [
  {
    id: 1,
    name: "Ritu Sengupta",
    location: "Bengaluru",
    role: "VP Human Resources, Fintech Solutions",
    rating: 5,
    title: "Flawless Branding & Fast Delivery for 450 Employee Kits",
    comment:
      "We ordered 450 custom welcome kits with ceramic cork mugs and hardbound bamboo notebooks for our annual company offsite. Every single piece had our logo engraved with crisp perfection. Delivery was 2 days ahead of schedule!",
    item: "Executive Cork Ceramic Mug & Notebook Set",
  },
  {
    id: 2,
    name: "Vikramaditya Singhania",
    location: "Mumbai",
    role: "Managing Director, Apex Capital",
    rating: 5,
    title: "Diwali Hampers That Truly Impressed Our Top Tier Clients",
    comment:
      "Our C-suite banking partners were thrilled with the presentation of the Royal Brass Diya and gourmet dry fruit gift boxes. Elegant, rich, and zero hassle with individual multi-city dispatches.",
    item: "Royal Artisanal Diwali Gourmet Hamper",
  },
  {
    id: 3,
    name: "Neha Deshmukh",
    location: "Hyderabad",
    role: "Head of Procurement, CloudTech Global",
    rating: 5,
    title: "Exceptional Quality on 800+ Smart Temperature Bottles",
    comment:
      "From receiving digital sample proofs in 24 hours to getting official GST invoices for tax credit, the entire procurement process was seamless. The smart temperature LED display is a huge hit among our developers.",
    item: "Smart Temp Vacuum Insulated Flask 500ml",
  },
];

const CustomerTestimonials = () => {
  return (
    <section className="testimonials-editorial-section" aria-labelledby="testimonials-title">
      <div className="container">
        <div className="section-header-editorial">
          <h2 id="testimonials-title" className="section-title-editorial title">What clients say</h2>
          <p className="section-subtitle-editorial">
            The kind of orders we handle for HR, procurement and leadership teams.
          </p>
        </div>

        <div className="testimonials-editorial-grid">
          {SAMPLE_TESTIMONIALS.map((t) => (
            <article key={t.id} className="testimonial-card-editorial">
              <div className="testimonial-rating-row">
                <StarRating rating={t.rating} />
                <span className="testimonial-sample-tag">Sample</span>
              </div>

              <h3 className="testimonial-headline">{t.title}</h3>
              <p className="testimonial-body">{t.comment}</p>

              <div className="testimonial-footer">
                <div className="testimonial-author-block">
                  <span className="author-name">{t.name}</span>
                  <span className="author-location">{t.role} · {t.location}</span>
                </div>
                <span className="testimonial-item-tag">
                  <i className="fa-solid fa-gift" style={{ marginRight: "4px", color: "var(--ribbon)" }} aria-hidden="true"></i>
                  {t.item}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerTestimonials;
