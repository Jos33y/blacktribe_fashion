/**
 * Payment Reminder Email Template
 * Sent once when a customer creates an order but doesn't complete payment.
 * Contains a direct link to the payment page.
 *
 * Brand voice: "Your bag is waiting." One email. One time. Never more.
 */

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
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
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #EDEBE8; margin: 0 0 16px; letter-spacing: -0.5px;">Your bag is waiting.</h1>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0; line-height: 1.6;">
                You started an order but did not complete payment. Your ${itemCount} ${itemCount === 1 ? 'piece is' : 'pieces are'} still reserved.
              </p>
            </td>
          </tr>

          <!-- Product items -->
          ${(items || []).map((item) => `
          <tr>
            <td style="padding-bottom: 8px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #2A2A2A;">
                <tr>
                  <td width="80" valign="top">
                    <img src="${item.image_url}" alt="${item.name}" width="80" height="100" style="display: block; object-fit: cover; background: #FFFFFF;" />
                  </td>
                  <td style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; margin-bottom: 4px;">${item.name}</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662;">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}${item.quantity > 1 ? ' × ' + item.quantity : ''}</div>
                  </td>
                  <td align="right" style="padding: 16px;" valign="middle">
                    <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500; color: #EDEBE8;">${formatNaira(item.price * item.quantity)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}

          <!-- Total -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 8px 0;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: 500; color: #EDEBE8; padding: 8px 0;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${paymentUrl}" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 48px;">
                COMPLETE ORDER
              </a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; margin: 0; line-height: 1.6; text-align: center;">
                This link expires in 48 hours. After that, your bag will be released.
              </p>
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
