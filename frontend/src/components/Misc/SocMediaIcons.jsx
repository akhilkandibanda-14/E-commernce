const SOCIAL_LINKS = [
  { href: "https://instagram.com/giftingwellness", label: "Instagram", icon: "fa-instagram" },
  { href: "https://facebook.com/giftingwellness", label: "Facebook", icon: "fa-facebook-f" },
  { href: "https://linkedin.com/company/giftingwellness", label: "LinkedIn", icon: "fa-linkedin-in" },
  { href: "https://wa.me/919121299914", label: "WhatsApp Support", icon: "fa-whatsapp" },
];

const SocMediaIcons = () => {
  return (
    <div>
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.label}
          target="_blank"
          rel="noreferrer"
          href={s.href}
          aria-label={`${s.label} (opens in a new tab)`}
          className="soc-icon-link"
        >
          <i className={`fa-brands ${s.icon} fa-lg`} aria-hidden="true"></i>
        </a>
      ))}
    </div>
  );
};

export default SocMediaIcons;
