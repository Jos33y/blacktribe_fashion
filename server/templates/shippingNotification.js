/**
 * Shipping Notification Email — BlackTribe Fashion
 * Sent when admin updates order status to "shipped".
 * Shows tracking number, first product preview, Track CTA.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';
const LOGO_URL = `${SITE_URL}/logo_white.png`;

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
}

export function shippingNotificationEmail({ order, items, trackingUrl }) {
  const orderNumber = order.order_number;
  const trackingNumber = order.tracking_number;
  const firstItem = items?.[0];
  const itemCount = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const subject = `Your order has shipped`;

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
    Your ${itemCount} ${itemCount === 1 ? 'piece is' : 'pieces are'} on the way. Order ${orderNumber}.
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="${LOGO_URL}" alt="BlackTribe" width="32" height="40" style="display: block; margin: 0 auto 12px; filter: brightness(1.2);" />
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 32px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Your order is on its way.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #6A6662; margin: 0 0 16px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                Your ${itemCount} ${itemCount === 1 ? 'piece has' : 'pieces have'} been shipped.${trackingNumber ? ' Track your delivery below.' : ''}
              </p>
            </td>
          </tr>

          ${trackingNumber ? `
          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: 'Courier New', monospace; font-size: 9px; font-weight: 500; color: #6A6662; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">TRACKING NUMBER</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; color: #EDEBE8; letter-spacing: 1px;">${trackingNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          ${firstItem ? `
          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td width="56" valign="top" style="background: #FFFFFF;">
                    <img src="${firstItem.image_url}" alt="${firstItem.name}" width="56" height="70" style="display: block; object-fit: cover;" />
                  </td>
                  <td style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; margin-bottom: 4px;">${firstItem.name}</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662;">${firstItem.size || ''}${firstItem.color ? ' / ' + firstItem.color : ''}</div>
                    ${itemCount > 1 ? `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin-top: 8px;">+ ${itemCount - 1} more ${itemCount - 1 === 1 ? 'piece' : 'pieces'}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          ${trackingUrl ? `
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#EDEBE8" style="background-color: #EDEBE8;">
                    <a href="${trackingUrl}" style="display: inline-block; padding: 14px 48px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; color: #0C0C0C;">TRACK ORDER</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

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
