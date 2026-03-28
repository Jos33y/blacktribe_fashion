/**
 * Order Confirmation Email — BlackTribe Fashion
 * Sent after successful payment (webhook trigger).
 *
 * The most important email. This is the first post-purchase touchpoint.
 * Logo, items, totals, shipping, Track CTA, Welcome to the Tribe.
 * No timeline promises. No exclamation marks.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';
const LOGO_URL = `${SITE_URL}/logo_white.png`;

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
}

export function orderConfirmationEmail({ order, items }) {
  const orderNumber = order.order_number;
  const total = formatNaira(order.total);
  const trackingUrl = `${SITE_URL}/track?order=${orderNumber}&token=${order.tracking_token}`;
  const shippingName = order.shipping_address?.name || '';
  const shippingStreet = order.shipping_address?.street || '';
  const shippingCity = order.shipping_address?.city || '';
  const shippingState = order.shipping_address?.state || '';

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #2A2A2A;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="56" valign="top" style="background: #FFFFFF;">
              <img src="${item.image_url}" alt="${item.name}" width="56" height="70" style="display: block; object-fit: cover;" />
            </td>
            <td style="padding-left: 16px;" valign="top">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; line-height: 1.4;">${item.name}</div>
              <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662; margin-top: 4px;">${item.size || ''}${item.color ? ' / ' + item.color : ''}${item.quantity > 1 ? ' \u00D7 ' + item.quantity : ''}</div>
            </td>
            <td align="right" valign="top">
              <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894;">${formatNaira(item.price * item.quantity)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const subject = `Order ${orderNumber} confirmed`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${subject}</title>
  <style>
    :root { color-scheme: dark light; }
    @media (prefers-color-scheme: light) {
      .email-body { background-color: #0C0C0C !important; }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <!-- Preheader (inbox preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0C0C0C;">
    Order ${orderNumber} confirmed. ${total}. Your pieces are on the way.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <!-- Logo + Wordmark -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="${LOGO_URL}" alt="BlackTribe" width="32" height="40" style="display: block; margin: 0 auto 12px; filter: brightness(1.2);" />
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <!-- Confirmation header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Your order is confirmed.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #6A6662; margin: 0 0 16px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">You will receive tracking details by email once your order ships.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding-bottom: 24px;"><div style="height: 1px; background: #2A2A2A;"></div></td></tr>

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
            <td style="padding-top: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 4px 0;">Subtotal</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; padding: 4px 0;">${formatNaira(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 4px 0;">Shipping</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; padding: 4px 0;">${order.shipping_cost === 0 ? 'Free' : formatNaira(order.shipping_cost)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #4ADE80; padding: 4px 0;">Discount</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #4ADE80; padding: 4px 0;">-${formatNaira(order.discount_amount)}</td>
                </tr>
                ` : ''}
                <tr><td colspan="2" style="padding-top: 12px;"><div style="height: 1px; background: #2A2A2A;"></div></td></tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #EDEBE8; padding-top: 12px;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 500; color: #EDEBE8; padding-top: 12px;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping address -->
          ${shippingName ? `
          <tr>
            <td style="padding-top: 32px;">
              <div style="height: 1px; background: #2A2A2A; margin-bottom: 24px;"></div>
              <p style="font-family: 'Courier New', monospace; font-size: 9px; font-weight: 500; color: #6A6662; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">SHIPPING TO</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; margin: 0 0 2px;">${shippingName}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; margin: 0; line-height: 1.5;">${shippingStreet}${shippingCity ? ', ' + shippingCity : ''}${shippingState ? ', ' + shippingState : ''}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Track CTA -->
          <tr>
            <td align="center" style="padding-top: 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#EDEBE8" style="background-color: #EDEBE8;">
                    <a href="${trackingUrl}" style="display: inline-block; padding: 14px 48px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; color: #0C0C0C;">TRACK ORDER</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome closing -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">Welcome to the Tribe.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <div style="height: 1px; background: #2A2A2A; margin-bottom: 32px;"></div>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0 0 4px;">BlackTribe Fashion. Redefining Luxury.</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; margin: 0;">
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
