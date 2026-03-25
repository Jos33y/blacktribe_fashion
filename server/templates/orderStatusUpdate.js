/**
 * Order Status Update Email Template
 * Sent when admin changes order status to confirmed/processing.
 * (Shipped and Delivered have their own dedicated templates.)
 *
 * Brand voice: factual, brief, reassuring.
 */

const SITE_URL = process.env.SITE_URL || 'https://blacktribefashion.com';

const STATUS_MESSAGES = {
  confirmed: {
    headline: 'Your order is confirmed.',
    body: 'We are preparing your order for shipment. You will receive tracking details once it ships.',
  },
  processing: {
    headline: 'Your order is being packed.',
    body: 'Your pieces are being prepared with care. Shipping details will follow shortly.',
  },
};

export function orderStatusUpdateEmail({ order, statusKey }) {
  const orderNumber = order.order_number;
  const content = STATUS_MESSAGES[statusKey];

  if (!content) return null;

  const trackingUrl = `${SITE_URL}/track?order=${orderNumber}&token=${order.tracking_token}`;

  const subject = `Order ${orderNumber} — ${content.headline.replace('.', '')}`;

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
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">${content.headline}</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #6A6662; margin: 0 0 16px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">${content.body}</p>
            </td>
          </tr>

          <!-- Track CTA -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${trackingUrl}" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 40px;">TRACK ORDER</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
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
