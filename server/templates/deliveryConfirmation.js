/**
 * Delivery Confirmation Email Template
 * Sent when admin updates order status to "delivered".
 * Brief. Invites customer to share on social.
 */

export function deliveryConfirmationEmail({ order }) {
  const orderNumber = order.order_number;

  const subject = `Your order has been delivered`;

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
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Delivered.</h1>
              <p style="font-family: 'Courier New', monospace; font-size: 13px; color: #6A6662; margin: 0 0 16px; letter-spacing: 1px;">${orderNumber}</p>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                Your order has arrived. We hope you enjoy your piece.
              </p>
            </td>
          </tr>

          <!-- Social invite -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                Share your look. Tag <span style="color: #EDEBE8;">@blacktribefashion</span> on Instagram.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="https://blacktribefashion.com/shop" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 48px;">
                SHOP NEW ARRIVALS
              </a>
            </td>
          </tr>

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
