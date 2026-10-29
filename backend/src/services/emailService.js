import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || (SMTP_USER ? `Giftingwellness <${SMTP_USER}>` : "Giftingwellness <no-reply@giftingwellness.com>");
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "sales@giftingwellness.com";

let transporter = null;

const isTestEnv = process.env.NODE_ENV === "test" || process.argv.some((arg) => arg.includes("test"));

if (isTestEnv) {
  // Always run mock console mode during test runs to avoid SMTP spamming and external rate limits
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`✉️ Email service initialized with SMTP host: ${SMTP_HOST} (Sender: ${EMAIL_FROM})`);
  } catch (err) {
    console.warn("⚠️ Email service initialization warning:", err.message);
  }
} else {
  console.log("ℹ️ SMTP credentials not configured in .env. Email notifications will run in mock console mode.");
}

/**
 * Dispatch transactional email helper
 */
const sendMailSafe = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`[Email Mock Console] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Dispatch Error] To: ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send order enquiry confirmation to customer and high-priority alert to store admin
 */
export const sendOrderConfirmationEmail = async (order) => {
  if (!order) return;

  const totalUnits = order.totalQuantity || (order.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const isEnquiry = order.orderType === "order_enquiry" || order.paymentMethod?.includes("enquiry") || true;

  const itemsRows = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <strong>${it.title}</strong><br/>
          <span style="font-size: 12px; color: #64748b;">
            Size: ${it.size || "Standard"} ${it.selectedColor ? `· Color: ${it.selectedColor}` : ""}
            ${it.selectedBranding ? `· Branding: ${it.selectedBranding.toUpperCase()}` : ""}
            ${it.customLogoText ? `<br/>Custom Branding: "${it.customLogoText}"` : ""}
          </span>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 15px; color: #0d3b2e;">
          ${it.quantity} pcs
        </td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">₹${Number(it.price || 0).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700;">₹${Number(it.lineTotal || it.quantity * it.price).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const adminPortalUrl = `${process.env.ADMIN_FRONTEND_URL || "http://localhost:5174"}/admin/orders`;

  // 1. HIGH-PRIORITY HTML TEMPLATE FOR STORE ADMIN
  const adminEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
      <div style="background: #0d3b2e; padding: 24px; text-align: center; color: #ffffff;">
        <span style="background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">
          🔔 New Order Enquiry (No Payment Method)
        </span>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Order Enquiry #${order.orderId}</h1>
        <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 14px;">Total Items Requested: <strong style="color: #fef08a; font-size: 16px;">${totalUnits} pcs</strong></p>
      </div>

      <div style="padding: 24px;">
        <!-- Lead & Contact Summary Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px; color: #0d3b2e; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Customer & Delivery Details</h3>
          <table style="width: 100%; font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="width: 130px; color: #64748b; font-weight: 600;">Customer Name:</td>
              <td style="color: #0f172a; font-weight: 700;">${order.customer?.fullName || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Email:</td>
              <td><a href="mailto:${order.customer?.email}" style="color: #0d3b2e; font-weight: 600;">${order.customer?.email || "N/A"}</a></td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Phone / Mobile:</td>
              <td><a href="tel:${order.customer?.phone}" style="color: #0d3b2e; font-weight: 600;">${order.customer?.phone || "N/A"}</a></td>
            </tr>
            ${order.customer?.company ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">Company / Org:</td>
              <td style="color: #0f172a; font-weight: 600;">${order.customer.company}</td>
            </tr>` : ""}
            ${order.customer?.gstin ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">GSTIN:</td>
              <td style="color: #0f172a; font-mono: true;">${order.customer.gstin}</td>
            </tr>` : ""}
            <tr>
              <td style="color: #64748b; font-weight: 600; vertical-align: top;">Shipping Address:</td>
              <td style="color: #0f172a;">${order.customer?.address}, ${order.customer?.city} - ${order.customer?.postalCode}</td>
            </tr>
            ${(order.notes || order.customer?.notes) ? `
            <tr>
              <td style="color: #b45309; font-weight: 700; vertical-align: top;">Client Notes:</td>
              <td style="background: #fffbeb; padding: 8px 12px; border-radius: 6px; border: 1px dashed #fde68a; color: #92400e; font-style: italic;">
                "${order.notes || order.customer.notes}"
              </td>
            </tr>` : ""}
          </table>
        </div>

        <!-- Items Table -->
        <h3 style="margin: 20px 0 10px; color: #0d3b2e; font-size: 15px; text-transform: uppercase;">Requested Items Breakdown (${totalUnits} Total Items)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: left; font-size: 13px;">Item</th>
              <th style="padding: 10px; text-align: center; font-size: 13px;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 13px;">Unit Price</th>
              <th style="padding: 10px; text-align: right; font-size: 13px;">Line Value</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals & Indicative Value -->
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: right; margin-bottom: 24px;">
          <p style="margin: 4px 0; font-size: 14px;">Total Items Count: <strong style="color: #0d3b2e; font-size: 16px;">${totalUnits} Units</strong></p>
          <p style="margin: 4px 0; font-size: 14px;">Indicative Subtotal: <strong>₹${Number(order.pricing?.subtotal || 0).toFixed(2)}</strong></p>
          <h3 style="margin: 8px 0 0; color: #0d3b2e; font-size: 20px;">Estimated Order Total: ₹${Number(order.pricing?.total || 0).toFixed(2)}</h3>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">(No online payment collected. Final quote/tax invoice can be issued by sales team.)</p>
        </div>

        <!-- Admin Action CTA -->
        <div style="text-align: center; margin: 28px 0 10px;">
          <a href="${adminPortalUrl}" target="_blank" style="display: inline-block; background: #0d3b2e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(13, 59, 46, 0.25);">
            Open & Manage Enquiry in Admin Portal →
          </a>
        </div>
      </div>
    </div>
  `;

  // 2. CLIENT ACKNOWLEDGEMENT TEMPLATE
  const customerEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
      <div style="background: #0d3b2e; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Giftingwellness</h1>
        <p style="color: #cbd5e1; margin: 4px 0 0; font-size: 14px;">Thoughtfully Chosen. Meaningfully Delivered.</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #0d3b2e; margin-top: 0;">Order Enquiry Received! #${order.orderId}</h2>
        <p>Dear ${order.customer?.fullName},</p>
        <p>Thank you for your interest in Giftingwellness. We have received your order enquiry for <strong>${totalUnits} items</strong>.</p>
        <p style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 6px; color: #065f46; font-size: 14px;">
          <strong>No payment is needed right now.</strong> Our corporate concierge team is reviewing inventory, customization options, and volume discounts. We will email your official quotation within 2 business hours.
        </p>

        <h3 style="margin: 20px 0 10px; color: #0d3b2e; font-size: 15px;">Enquiry Summary (${totalUnits} Total Units)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; text-align: left; font-size: 13px;">Item</th>
              <th style="padding: 10px; text-align: center; font-size: 13px;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 13px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 20px;">
          <p style="margin: 4px 0; font-size: 14px;">Total Items: <strong>${totalUnits} pcs</strong></p>
          <h3 style="margin: 8px 0 0; color: #0d3b2e; font-size: 18px;">Estimated Total: ₹${Number(order.pricing?.total || 0).toFixed(2)}</h3>
        </div>

        <div style="background: #f8fafc; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #475569;">
          <strong>Shipping Address on file:</strong><br/>
          ${order.customer?.fullName}<br/>
          ${order.customer?.address}, ${order.customer?.city} - ${order.customer?.postalCode}<br/>
          Phone: ${order.customer?.phone || "N/A"}
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Need urgent delivery or immediate sample approval? Contact us at ${process.env.SUPPORT_PHONE || "+91 91212 99914"} or reply to this email.
        </p>
      </div>
    </div>
  `;

  // 1. Email to Customer
  if (order.customer?.email) {
    await sendMailSafe({
      to: order.customer.email,
      subject: `Order Enquiry #${order.orderId} Received (${totalUnits} items) - Giftingwellness`,
      html: customerEmailHtml,
      text: `Your Giftingwellness order enquiry #${order.orderId} for ${totalUnits} items has been received. Our sales team will follow up shortly.`,
    });
  }

  // 2. High-Priority Alert to Store Admin
  await sendMailSafe({
    to: ADMIN_ALERT_EMAIL,
    subject: `[New Order Enquiry] #${order.orderId} from ${order.customer?.fullName} (${totalUnits} items)`,
    html: adminEmailHtml,
    text: `New Order Enquiry #${order.orderId} placed by ${order.customer?.fullName} (${order.customer?.email}, ${order.customer?.phone}) for ${totalUnits} items. Estimated: ₹${order.pricing?.total}. Notes: ${order.notes || order.customer?.notes || "None"}`,
  });
};

/**
 * Send quotation notification to sales reps and acknowledgement to customer
 */
export const sendQuoteNotificationEmail = async (quote) => {
  if (!quote) return;

  const quoteHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: #0d3b2e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">New Bulk Corporate Quotation Request</h2>
      </div>
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p><strong>Quote ID:</strong> ${quote.quoteId}</p>
        <p><strong>Company:</strong> ${quote.companyName}</p>
        <p><strong>Contact:</strong> ${quote.contactName || "N/A"} (${quote.contactEmail} / ${quote.contactPhone || "N/A"})</p>
        <p><strong>Product:</strong> ${quote.productTitle} (Qty: ${quote.quantity} units)</p>
        <p><strong>Branding Option:</strong> ${quote.brandingOption}</p>
        ${quote.customText ? `<p><strong>Logo / Company Name to Print:</strong> "${quote.customText}"</p>` : ""}
        ${quote.notes ? `<p><strong>Client Notes:</strong> "${quote.notes}"</p>` : ""}
        ${quote.estimatedTotal ? `<p><strong>Estimated Order Value:</strong> ₹${Number(quote.estimatedTotal).toFixed(2)}</p>` : ""}
      </div>
    </div>
  `;

  // Alert Sales Team
  await sendMailSafe({
    to: ADMIN_ALERT_EMAIL,
    subject: `[Corporate Lead] Bulk Quote #${quote.quoteId} - ${quote.companyName} (${quote.quantity} units)`,
    html: quoteHtml,
    text: `New quote request from ${quote.companyName} for ${quote.quantity}x ${quote.productTitle}.`,
  });

  // Acknowledgement to Corporate Buyer
  if (quote.contactEmail) {
    const ackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #0d3b2e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">We Received Your Bulk Quote Request</h2>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p>Dear ${quote.contactName || quote.companyName},</p>
          <p>Thank you for reaching out to Giftingwellness regarding <strong>${quote.productTitle}</strong> (Quantity: ${quote.quantity} units).</p>
          <p>Our corporate design and procurement team is reviewing your branding requirements and will email an official proposal with digital mockups within 2 business hours.</p>
          <p style="font-size: 13px; color: #64748b;">Lead Reference: #${quote.quoteId}</p>
        </div>
      </div>
    `;
    await sendMailSafe({
      to: quote.contactEmail,
      subject: `Quotation Inquiry #${quote.quoteId} Received - Giftingwellness`,
      html: ackHtml,
      text: `Thank you for your bulk quotation request #${quote.quoteId}. Our sales team will reach out within 2 hours.`,
    });
  }
};

/**
 * Send courier shipment tracking alert to customer
 */
export const sendDispatchUpdateEmail = async (order, tracking) => {
  if (!order || !order.customer?.email || !tracking?.trackingNumber) return;

  const dispatchHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: #0d3b2e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">Your Gift Order is On Its Way! 🚚</h2>
      </div>
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>Dear ${order.customer?.fullName},</p>
        <p>Great news! Your Giftingwellness order <strong>#${order.orderId}</strong> has been packaged, branded, and dispatched.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #1e40af; font-weight: 700;">Courier Partner: ${tracking.courier || "BlueDart / Delhivery"}</p>
          <p style="margin: 6px 0; font-size: 16px; font-weight: 800; color: #0f172a;">AWB Tracking #: ${tracking.trackingNumber}</p>
          ${tracking.trackingUrl ? `<a href="${tracking.trackingUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; margin-top: 8px;">Track Package Live →</a>` : ""}
        </div>
      </div>
    </div>
  `;

  await sendMailSafe({
    to: order.customer.email,
    subject: `Order #${order.orderId} Dispatched - Tracking: ${tracking.trackingNumber}`,
    html: dispatchHtml,
    text: `Your order #${order.orderId} was dispatched via ${tracking.courier}. Tracking #: ${tracking.trackingNumber}`,
  });
};
