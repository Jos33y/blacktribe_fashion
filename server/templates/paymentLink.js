/**
 * Payment Link Email — BlackTribe Fashion
 * Sent immediately after order creation (before payment).
 * Insurance: if browser crashes or user switches devices,
 * they can complete payment from this email.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';
const LOGO_URL = `${SITE_URL}/logo_white.png`;

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
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
            <td width="48" valign="top" style="background: #FFFFFF;">
              <img src="${item.image_url || item.image}" alt="${item.name}" width="48" height="60" style="display: block; object-fit: cover;" />
            </td>
            <td style="padding-left: 14px;" valign="top">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #EDEBE8; line-height: 1.4;">${item.name}</div>
              <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662; margin-top: 3px;">${item.size || ''}${item.color ? ' / ' + item.color : ''}${item.quantity > 1 ? ' \u00D7 ' + item.quantity : ''}</div>
            </td>
            <td align="right" valign="top">
              <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #9B9894;">${formatNaira(item.price * (item.quantity || 1))}</div>
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
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${subject}</title>
  <style>:root { color-scheme: dark light; } @media (prefers-color-scheme: light) { .email-body { background-color: #0C0C0C !important; } }</style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">

  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0C0C0C;">
    Complete your BlackTribe order. ${total}.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="${LOGO_URL}" alt="BlackTribe" width="28" height="56" style="display: block; margin: 0 auto 12px; filter: brightness(1.2);" />
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Complete your order.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 12px; color: #6A6662; margin: 0 0 14px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">Your order has been reserved. Complete payment to confirm.</p>
            </td>
          </tr>

          <tr><td style="padding-bottom: 20px;"><div style="height: 1px; background: #2A2A2A;"></div></td></tr>

          <tr><td><table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}</table></td></tr>

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
                  <td style="font-size: 13px; color: #4ADE80; padding: 3px 0;">Discount</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #4ADE80; padding: 3px 0;">-${formatNaira(order.discount_amount)}</td>
                </tr>` : ''}
                <tr><td colspan="2" style="padding-top: 10px;"><div style="height: 1px; background: #2A2A2A;"></div></td></tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #EDEBE8; padding-top: 10px;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: 500; color: #EDEBE8; padding-top: 10px;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 32px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#EDEBE8" style="background-color: #EDEBE8;">
                    <a href="${url}" style="display: inline-block; padding: 14px 48px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; color: #0C0C0C;">COMPLETE PAYMENT</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 24px;" align="center">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0; line-height: 1.6;">This link stays active until the order is cancelled or fulfilled.</p>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 48px; text-align: center;">
              <div style="height: 1px; background: #2A2A2A; margin-bottom: 32px;"></div>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0 0 4px;">BlackTribe Fashion. Redefining Luxury.</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; margin: 0;"><a href="${SITE_URL}" style="color: #6A6662; text-decoration: none;">blacktribefashion.com</a></p>
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
