/**
 * Payment Link Email Template
 * Sent immediately after order creation (before payment).
 * Insurance: if browser crashes, phone dies, or user switches devices,
 * they can complete payment from this email.
 *
 * Brand voice: direct, factual. No urgency. No exclamation marks.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
}

export function paymentLinkEmail({ order, items, paymentUrl }) {
  const orderNumber = order.order_number;
  const total = formatNaira(order.total);
  const url = paymentUrl || `${SITE_URL}/pay/${orderNumber}?token=${order.tracking_token}`;

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="48" valign="top">
              <img src="${item.image_url || item.image}" alt="${item.name}" width="48" height="60" style="display: block; object-fit: cover; background: #FFFFFF;" />
            </td>
            <td style="padding-left: 14px;" valign="top">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #EDEBE8; line-height: 1.4;">${item.name}</div>
              <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662; margin-top: 3px;">${item.size || ''}${item.color ? ' / ' + item.color : ''}${item.quantity > 1 ? ' × ' + item.quantity : ''}</div>
            </td>
            <td align="right" valign="top">
              <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #9B9894;">${formatNaira((item.price) * (item.quantity || 1))}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const subject = `Complete your order ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Complete your order.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 12px; color: #6A6662; margin: 0 0 14px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">Your order has been reserved. Complete payment to confirm.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="height: 1px; background: #2A2A2A;"></div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding-top: 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 3px 0;">Subtotal</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; padding: 3px 0;">${formatNaira(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 3px 0;">Shipping</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; padding: 3px 0;">${order.shipping_cost === 0 ? 'Free' : formatNaira(order.shipping_cost)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #4ADE80; padding: 3px 0;">Discount</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #4ADE80; padding: 3px 0;">-${formatNaira(order.discount_amount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding-top: 10px;">
                    <div style="height: 1px; background: #2A2A2A;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #EDEBE8; padding-top: 10px;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: 500; color: #EDEBE8; padding-top: 10px;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Button -->
          <tr>
            <td style="padding-top: 32px;" align="center">
              <a href="${url}" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; padding: 14px 48px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none;">COMPLETE PAYMENT</a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding-top: 24px;" align="center">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0; line-height: 1.6;">This link stays active until the order is cancelled or fulfilled.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; text-align: center;">
              <div style="height: 1px; background: #2A2A2A; margin-bottom: 32px;"></div>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0 0 4px;">BlackTribe Fashion. Redefining Luxury.</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #3A3A3A; margin: 0;">
                <a href="${SITE_URL}" style="color: #6A6662; text-decoration: none;">blacktribefashion.com</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();

  return { subject, html };
}
