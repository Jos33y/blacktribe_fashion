/**
 * Admin Order Notification Email — BlackTribe Fashion
 * Sent to support@ after payment confirmation.
 * Internal. Functional. Concise.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';
const LOGO_URL = `${SITE_URL}/logo_white.png`;

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
}

export function adminOrderNotificationEmail({ order, items }) {
  const orderNumber = order.order_number;
  const total = formatNaira(order.total);
  const email = order.guest_email || order.user_email || '\u2014';
  const shippingName = order.shipping_address?.name || '\u2014';
  const shippingState = order.shipping_address?.state || '';
  const shippingCity = order.shipping_address?.city || '';
  const phone = order.shipping_address?.phone || '\u2014';
  const adminUrl = `${SITE_URL}/admin/orders/${order.id}`;

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #2A2A2A;">
        <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #EDEBE8;">${item.name}</span>
        <span style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662;"> \u00B7 ${item.size || '\u2014'}${item.quantity > 1 ? ' \u00D7 ' + item.quantity : ''}</span>
      </td>
      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #2A2A2A;">
        <span style="font-family: 'Courier New', monospace; font-size: 12px; color: #9B9894;">${formatNaira(item.price * (item.quantity || 1))}</span>
      </td>
    </tr>
  `).join('');

  const subject = `New order ${orderNumber} \u2014 ${total}`;

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
    New order ${orderNumber}. ${total}. ${shippingName}.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width: 520px; width: 100%;">

          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle">
                    <img src="${LOGO_URL}" alt="" width="20" height="25" style="display: inline-block; vertical-align: middle; margin-right: 10px; filter: brightness(1.2);" />
                    <span style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 2px; color: #6A6662; text-transform: uppercase; vertical-align: middle;">ORDER NOTIFICATION</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 20px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #EDEBE8; margin: 0 0 6px;">New order received.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; margin: 0;">${orderNumber} \u2014 ${total}</p>
            </td>
          </tr>

          <tr><td><div style="height: 1px; background: #2A2A2A; margin-bottom: 20px;"></div></td></tr>

          <tr>
            <td style="padding-bottom: 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="50%" valign="top">
                    <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #6A6662; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">CUSTOMER</div>
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #EDEBE8; margin-bottom: 2px;">${shippingName}</div>
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #9B9894;">${email}</div>
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #9B9894;">${phone}</div>
                  </td>
                  <td width="50%" valign="top">
                    <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #6A6662; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">SHIPPING TO</div>
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #9B9894; line-height: 1.5;">
                      ${order.shipping_address?.street || ''}${shippingCity ? ', ' + shippingCity : ''}${shippingState ? ', ' + shippingState : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td>
              <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #6A6662; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">ITEMS</div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}</table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 16px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: #9B9894; padding: 2px 0;">Subtotal</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #9B9894; padding: 2px 0;">${formatNaira(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #9B9894; padding: 2px 0;">Shipping</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #9B9894; padding: 2px 0;">${order.shipping_cost === 0 ? 'Free' : formatNaira(order.shipping_cost)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                <tr>
                  <td style="font-size: 12px; color: #4ADE80; padding: 2px 0;">Discount${order.discount_code ? ' (' + order.discount_code + ')' : ''}</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #4ADE80; padding: 2px 0;">-${formatNaira(order.discount_amount)}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 28px;" align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #242424; border: 1px solid #3A3A3A;">
                    <a href="${adminUrl}" style="display: inline-block; padding: 12px 36px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; color: #EDEBE8;">VIEW IN DASHBOARD</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="font-family: 'Courier New', monospace; font-size: 10px; color: #3A3A3A; margin: 0;">This is an automated notification from BlackTribe Fashion.</p>
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
