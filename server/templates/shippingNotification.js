/**
 * Shipping Notification Email Template
 * Sent when admin updates order status to "shipped".
 * Includes tracking number if provided.
 *
 * Brand voice: factual, brief, includes tracking link.
 */

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
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
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0C0C0C;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 4px; color: #EDEBE8;">BLACKTRIBE</div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding-bottom: 32px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Your order is on its way.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #6A6662; margin: 0 0 16px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                Your ${itemCount} ${itemCount === 1 ? 'piece has' : 'pieces have'} been shipped. ${trackingNumber ? 'Track your delivery below.' : 'You will receive a tracking number shortly.'}
              </p>
            </td>
          </tr>

          ${trackingNumber ? `
          <!-- Tracking info -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 500; color: #6A6662; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">TRACKING NUMBER</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; color: #EDEBE8; letter-spacing: 1px;">${trackingNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Product preview -->
          ${firstItem ? `
          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td width="60" valign="top">
                    <img src="${firstItem.image_url}" alt="${firstItem.name}" width="60" height="75" style="display: block; object-fit: cover; background: #FFFFFF;" />
                  </td>
                  <td style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; margin-bottom: 4px;">${firstItem.name}</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662;">${firstItem.size}${firstItem.color ? ' / ' + firstItem.color : ''}</div>
                    ${itemCount > 1 ? `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin-top: 8px;">+ ${itemCount - 1} more ${itemCount - 1 === 1 ? 'piece' : 'pieces'}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Track CTA -->
          ${trackingUrl ? `
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${trackingUrl}" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 48px;">
                TRACK ORDER
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <div style="height: 1px; background: #2A2A2A; margin-bottom: 32px;"></div>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0 0 4px;">BlackTribe Fashion. Redefining Luxury.</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #3A3A3A; margin: 0;">
                <a href="https://blacktribefashion.com" style="color: #6A6662; text-decoration: none;">blacktribefashion.com</a>
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
