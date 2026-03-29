/**
 * Payment Reminder Email — BlackTribe Fashion
 * Sent once when customer creates order but doesn't complete payment.
 * "Your bag is waiting." One email. One time. Never more.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';
const LOGO_URL = `${SITE_URL}/logo_white.png`;

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
}

export function paymentReminderEmail({ order, items, paymentUrl }) {
  const orderNumber = order.order_number;
  const total = formatNaira(order.total);
  const itemCount = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const subject = `Your bag is waiting`;

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
    Your ${itemCount} ${itemCount === 1 ? 'piece is' : 'pieces are'} still reserved. Complete your order.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="${LOGO_URL}" alt="BlackTribe" width="28" height="56" style="display: block; margin: 0 auto 16px; filter: brightness(1.2);" />
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 32px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 16px; letter-spacing: -0.5px;">Your bag is waiting.</h1>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                You started an order but did not complete payment. Your ${itemCount} ${itemCount === 1 ? 'piece is' : 'pieces are'} still reserved.
              </p>
            </td>
          </tr>

          ${(items || []).map((item) => `
          <tr>
            <td style="padding-bottom: 8px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td width="72" valign="top" style="background: #FFFFFF;">
                    <img src="${item.image_url}" alt="${item.name}" width="72" height="90" style="display: block; object-fit: cover;" />
                  </td>
                  <td style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; margin-bottom: 4px;">${item.name}</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662;">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}${item.quantity > 1 ? ' \u00D7 ' + item.quantity : ''}</div>
                  </td>
                  <td align="right" style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500; color: #EDEBE8;">${formatNaira(item.price * item.quantity)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}

          <tr>
            <td style="padding: 16px 0 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #EDEBE8; padding: 8px 0;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 500; color: #EDEBE8; padding: 8px 0;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#EDEBE8" style="background-color: #EDEBE8;">
                    <a href="${paymentUrl}" style="display: inline-block; padding: 16px 48px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; color: #0C0C0C;">COMPLETE ORDER</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 32px; text-align: center;">
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