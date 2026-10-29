import { useEffect, useId, useRef, useState } from "react";
import { useSiteContent } from "../../context/SiteContentContext";
import { HOME_PAGE_DEFAULTS, HOME_SECTIONS } from "../../data/homePageDefaults";
import ImageField from "./ImageField";

// Field types: text, long (textarea), image, link, strings (one per line), bool, rating,
// or { list: [...fields] } for repeatable items. Keep in sync with backend/src/data/homePageSchema.js.
const EDITORS = [
  {
    key: "heroCarousel",
    title: "Hero Carousel (Banner Slider)",
    help: "The top rotating hero banner. Upload images directly from your device, customize titles, badges, and action buttons. Reorder slides using the arrows.",
    fields: [
      { name: "autoplay", label: "Autoplay slides automatically", type: "bool" },
      { name: "interval", label: "Autoplay rotation interval (in seconds, e.g. 5)", type: "number" },
      {
        name: "slides",
        label: "Carousel Slides",
        type: {
          list: [
            { name: "badge", label: "Top category/badge text (e.g. Luxury Corporate Gifting)", type: "text" },
            { name: "title", label: "Slide Headline", type: "text" },
            { name: "subtitle", label: "Intro text / subtitle", type: "long" },
            { name: "primaryCtaText", label: "Primary button label", type: "text" },
            { name: "primaryCtaLink", label: "Primary button link", type: "link" },
            { name: "secondaryCtaText", label: "Secondary button label (e.g. Send Order Enquiry)", type: "text" },
            { name: "secondaryCtaLink", label: "Secondary button link", type: "link" },
            { name: "image", label: "Banner Image (Upload high-res photo from device or paste URL)", type: "image" },
            { name: "imageAlt", label: "Image description (for screen readers)", type: "text" },
            { name: "tagTitle", label: "Badge card headline (e.g. Free Digital Mockup)", type: "text" },
            { name: "tagText", label: "Badge card description (e.g. Samples before dispatch)", type: "text" },
            { name: "isActive", label: "Display this slide on live site", type: "bool" },
          ],
        },
        itemLabel: "slide",
      },
    ],
  },
  {
    key: "hero",
    title: "Static Hero banner (Fallback)",
    help: "Static single banner shown if Carousel is hidden or empty.",
    fields: [
      { name: "title", label: "Headline", type: "text" },
      { name: "lead", label: "Intro text", type: "long" },
      { name: "primaryCtaText", label: "Main button text", type: "text" },
      { name: "primaryCtaLink", label: "Main button link", type: "link" },
      { name: "secondaryCtaText", label: "Second button text (opens the bulk quote form)", type: "text" },
      { name: "image", label: "Hero image", type: "image" },
      { name: "imageAlt", label: "Image description (for screen readers)", type: "text" },
      { name: "tagTitle", label: "Image tag heading", type: "text" },
      { name: "tagText", label: "Image tag text", type: "text" },
      { name: "promises", label: "Ticked points under the buttons (one per line)", type: "strings" },
    ],
  },
  {
    key: "trustStrip",
    title: "Trust strip",
    help: "The row of benefits under the hero.",
    fields: [
      {
        name: "items",
        label: "Benefits",
        type: { list: [
          { name: "icon", label: "Icon (Font Awesome class, e.g. fa-solid fa-truck-fast)", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "long" },
        ] },
        itemLabel: "benefit",
      },
    ],
  },
  {
    key: "featuredCollections",
    title: "Featured collections",
    help: "Picture tiles linking to parts of the catalogue. The first tile is shown large.",
    fields: [
      { name: "title", label: "Section heading", type: "text" },
      { name: "subtitle", label: "Section intro", type: "long" },
      {
        name: "items",
        label: "Collections",
        type: { list: [
          { name: "title", label: "Title", type: "text" },
          { name: "tag", label: "Small label", type: "text" },
          { name: "description", label: "Description", type: "long" },
          { name: "image", label: "Image", type: "image" },
          { name: "link", label: "Link (e.g. /products?search=Mug)", type: "link" },
        ] },
        itemLabel: "collection",
      },
    ],
  },
  {
    key: "bestSellers",
    title: "Best sellers heading",
    help: "Products marked as best sellers in the catalogue appear under this heading.",
    fields: [
      { name: "title", label: "Heading", type: "text" },
      { name: "subtitle", label: "Intro", type: "long" },
    ],
  },
  {
    key: "newArrivals",
    title: "New arrivals heading",
    help: "Products marked as new in the catalogue appear under this heading.",
    fields: [
      { name: "title", label: "Heading", type: "text" },
      { name: "subtitle", label: "Intro", type: "long" },
    ],
  },
  {
    key: "promoBanner",
    title: "Promotional banner",
    help: "The wide campaign banner, e.g. for Diwali or New Year.",
    fields: [
      { name: "kicker", label: "Small label above the heading", type: "text" },
      { name: "title", label: "Heading", type: "text" },
      { name: "text", label: "Text", type: "long" },
      { name: "ctaText", label: "Button text", type: "text" },
      { name: "ctaLink", label: "Button link", type: "link" },
      { name: "note", label: "Note under the button", type: "text" },
      { name: "image", label: "Banner image", type: "image" },
      { name: "imageAlt", label: "Image description (for screen readers)", type: "text" },
    ],
  },
  {
    key: "reassurance",
    title: "How we work",
    help: "Cards explaining samples, invoicing, delivery and support.",
    fields: [
      { name: "title", label: "Section heading", type: "text" },
      { name: "subtitle", label: "Section intro", type: "long" },
      {
        name: "items",
        label: "Cards",
        type: { list: [
          { name: "icon", label: "Icon (Font Awesome class)", type: "text" },
          { name: "badge", label: "Badge", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "detail", label: "Text", type: "long" },
          { name: "actionText", label: "Link text", type: "text" },
          { name: "link", label: "Link", type: "link" },
        ] },
        itemLabel: "card",
      },
    ],
  },
  {
    key: "testimonials",
    title: "Testimonials",
    help: "Only publish real client quotes you have permission to use. Untick “Sample” once they are real.",
    fields: [
      { name: "title", label: "Section heading", type: "text" },
      { name: "subtitle", label: "Section intro", type: "long" },
      { name: "isSample", label: "These are sample testimonials (shows a “Sample” label)", type: "bool" },
      {
        name: "items",
        label: "Testimonials",
        type: { list: [
          { name: "name", label: "Client name", type: "text" },
          { name: "role", label: "Role and company", type: "text" },
          { name: "location", label: "City", type: "text" },
          { name: "rating", label: "Rating (0–5)", type: "rating" },
          { name: "title", label: "Headline", type: "text" },
          { name: "comment", label: "Quote", type: "long" },
          { name: "item", label: "Product they ordered", type: "text" },
        ] },
        itemLabel: "testimonial",
      },
    ],
  },
  {
    key: "newsletter",
    title: "Catalogue request",
    help: "The email form near the bottom of the page. Requests arrive in Quotes & Leads.",
    fields: [
      { name: "title", label: "Heading", type: "text" },
      { name: "text", label: "Text", type: "long" },
      { name: "buttonText", label: "Button text", type: "text" },
    ],
  },
];

const blankItem = (fields) =>
  Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.name === "isActive" ? true : f.type === "rating" ? 5 : f.type === "bool" ? false : ""
    ])
  );

const FieldInput = ({ field, value, onChange }) => {
  const id = useId();
  if (field.type === "image") {
    return <ImageField label={field.label} value={value} onChange={onChange} />;
  }
  if (field.type === "bool") {
    return (
      <label className="gw-check" htmlFor={id}>
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {field.label}
      </label>
      {field.type === "long" || field.type === "strings" ? (
        <textarea
          id={id}
          className="form-input"
          rows={field.type === "strings" ? 4 : 3}
          value={field.type === "strings" ? (value || []).join("\n") : value || ""}
          onChange={(e) =>
            onChange(field.type === "strings" ? e.target.value.split("\n") : e.target.value)
          }
        />
      ) : (
        <input
          id={id}
          className="form-input"
          type={field.type === "rating" ? "number" : "text"}
          min={field.type === "rating" ? 0 : undefined}
          max={field.type === "rating" ? 5 : undefined}
          step={field.type === "rating" ? 0.5 : undefined}
          placeholder={field.type === "link" ? "/products or https://…" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange(field.type === "rating" ? Number(e.target.value) : e.target.value)}
        />
      )}
    </div>
  );
};

const ListEditor = ({ field, items, onChange }) => {
  const fields = field.type.list;
  const update = (i, name, v) => onChange(items.map((it, j) => (j === i ? { ...it, [name]: v } : it)));
  const move = (i, dir) => {
    const next = [...items];
    const [it] = next.splice(i, 1);
    next.splice(i + dir, 0, it);
    onChange(next);
  };
  return (
    <fieldset className="gw-list-editor">
      <legend className="form-label">{field.label}</legend>
      {items.map((item, i) => (
        <div key={i} className={`gw-list-item ${item.isActive === false ? "gw-list-item-inactive" : ""}`}>
          <div className="gw-list-item-head">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  style={{
                    width: "42px",
                    height: "42px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.04)",
                    borderRadius: "6px",
                    color: "#888",
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-regular fa-image" style={{ fontSize: "16px" }}></i>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {field.itemLabel} {i + 1}
                  {item.title || item.name ? `: ${item.title || item.name}` : ""}
                </strong>
                {item.badge && (
                  <span style={{ fontSize: "11px", color: "var(--forest, #2d4a3e)", fontWeight: 600 }}>
                    {item.badge}
                  </span>
                )}
              </div>
              {item.isActive !== undefined && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: 600,
                    marginLeft: "4px",
                    backgroundColor: item.isActive !== false ? "rgba(45, 74, 62, 0.1)" : "rgba(220, 53, 69, 0.1)",
                    color: item.isActive !== false ? "var(--forest, #2d4a3e)" : "#dc3545",
                  }}
                >
                  {item.isActive !== false ? "Active" : "Hidden"}
                </span>
              )}
            </div>
            <div className="gw-list-item-actions">
              <button type="button" className="btn-admin-outline" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${field.itemLabel} ${i + 1} up`}>
                <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn-admin-outline" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${field.itemLabel} ${i + 1} down`}>
                <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn-admin-outline gw-danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          </div>
          <div className="gw-list-item-fields">
            {fields.map((f) => (
              <FieldInput key={f.name} field={f} value={item[f.name]} onChange={(v) => update(i, f.name, v)} />
            ))}
          </div>
        </div>
      ))}
      {items.length < 12 && (
        <button type="button" className="btn-admin-outline" onClick={() => onChange([...items, blankItem(fields)])}>
          <i className="fa-solid fa-plus" aria-hidden="true"></i> Add {field.itemLabel}
        </button>
      )}
    </fieldset>
  );
};

const SectionEditor = ({ editor, saved, onSave }) => {
  const [form, setForm] = useState(saved);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const savedJson = JSON.stringify(saved);
  const lastSaved = useRef(savedJson);

  // Site content refreshes every few seconds. Follow real changes (e.g. another admin saved),
  // but never overwrite edits that haven't been saved yet.
  useEffect(() => {
    if (savedJson === lastSaved.current) return;
    setForm((current) => (JSON.stringify(current) === lastSaved.current ? JSON.parse(savedJson) : current));
    lastSaved.current = savedJson;
  }, [savedJson]);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const save = async (data) => {
    setStatus({ state: "saving", message: "" });
    try {
      await onSave({ [editor.key]: data });
      setStatus({ state: "saved", message: "Saved. The live site is updated." });
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  };

  return (
    <details className="gw-section-editor">
      <summary>
        <span className="gw-section-editor-title">{editor.title}</span>
        {dirty && <span className="gw-unsaved">Unsaved changes</span>}
      </summary>
      <p className="gw-section-help">{editor.help}</p>
      <div className="gw-section-fields">
        {editor.fields.map((field) =>
          typeof field.type === "object" ? (
            <ListEditor
              key={field.name}
              field={field}
              items={form[field.name] || []}
              onChange={(v) => setForm({ ...form, [field.name]: v })}
            />
          ) : (
            <FieldInput
              key={field.name}
              field={field}
              value={form[field.name]}
              onChange={(v) => setForm({ ...form, [field.name]: v })}
            />
          )
        )}
      </div>
      <div className="gw-section-footer">
        <button
          type="button"
          className="btn-admin-cta"
          disabled={!dirty || status.state === "saving"}
          onClick={() => save(form)}
        >
          {status.state === "saving" ? "Saving…" : `Save ${editor.title.toLowerCase()}`}
        </button>
        <button
          type="button"
          className="btn-admin-outline"
          disabled={status.state === "saving"}
          onClick={() => {
            if (window.confirm(`Restore the original ${editor.title.toLowerCase()} content?`)) {
              save(HOME_PAGE_DEFAULTS[editor.key]);
            }
          }}
        >
          Restore default
        </button>
        {status.message && (
          <p className={status.state === "error" ? "form-error" : "gw-save-ok"} role={status.state === "error" ? "alert" : "status"}>
            {status.message}
          </p>
        )}
      </div>
    </details>
  );
};

const ManageHomePage = () => {
  const { homePage, updateHomePage } = useSiteContent();
  const [visibilityStatus, setVisibilityStatus] = useState("");
  // Switches flip immediately; they roll back if the save fails.
  const [sections, setSections] = useState(homePage.sections);
  const savedSectionsJson = JSON.stringify(homePage.sections);
  useEffect(() => setSections(JSON.parse(savedSectionsJson)), [savedSectionsJson]);

  const toggleSection = async (key, on) => {
    const previous = sections;
    const next = { ...sections, [key]: on };
    setSections(next);
    setVisibilityStatus("");
    try {
      await updateHomePage({ sections: next });
      setVisibilityStatus(`${HOME_SECTIONS.find((s) => s.key === key)?.label} is now ${on ? "shown" : "hidden"}.`);
    } catch (err) {
      setSections(previous);
      setVisibilityStatus(`Couldn't change visibility: ${err.message}`);
    }
  };

  return (
    <div className="gw-home-editor">
      <div className="gw-home-editor-intro">
        <h2>Home page</h2>
        <p>
          Change the text, images and sections on the home page. Services, brands and the brand story
          are edited in their own tabs. Changes go live as soon as you save.
        </p>
        <a href="/" target="_blank" rel="noreferrer" className="btn-admin-outline">
          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Open home page
        </a>
      </div>

      <fieldset className="gw-visibility">
        <legend>Sections shown on the home page</legend>
        <div className="gw-visibility-grid">
          {HOME_SECTIONS.map((s) => (
            <label key={s.key} className="gw-check">
              <input
                type="checkbox"
                checked={sections?.[s.key] !== false}
                onChange={(e) => toggleSection(s.key, e.target.checked)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
        {visibilityStatus && <p className="gw-save-ok" role="status">{visibilityStatus}</p>}
      </fieldset>

      {EDITORS.map((editor) => (
        <SectionEditor
          key={editor.key}
          editor={editor}
          saved={homePage[editor.key]}
          onSave={updateHomePage}
        />
      ))}
    </div>
  );
};

export default ManageHomePage;
