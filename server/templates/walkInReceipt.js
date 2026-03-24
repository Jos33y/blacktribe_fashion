/**
 * Walk-in Receipt Email Template
 * Sent when staff provides a customer email during walk-in order creation.
 * Functions as a digital receipt.
 *
 * Brand voice: clean, receipt-like, appreciative.
 */

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
}

export function walkInReceiptEmail({ order, items }) {
  const orderNumber = order.order_number;
  const total = formatNaira(order.total);
  const paymentMethod = {
    cash: 'Cash',
    pos_terminal: 'POS Terminal',
    bank_transfer: 'Bank Transfer',
  }[order.payment_method] || order.payment_method;

  const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const itemsHtml = (items || []).map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #EDEBE8; line-height: 1.4;">
              ${item.name}
              <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6A6662; margin-top: 2px;">
                Size ${item.size}${item.quantity > 1 ? ' x ' + item.quantity : ''}
              </div>
            </td>
            <td align="right" valign="top" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894;">
              ${formatNaira(item.price * item.quantity)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const subject = `Your BlackTribe receipt`;

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
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9px; font-weight: 300; letter-spacing: 6px; color: #6A6662; margin-top: 4px; text-transform: uppercase;">FASHION</div>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #EDEBE8; margin: 0 0 8px; letter-spacing: -0.5px;">Your receipt.</h1>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: 'Courier New', monospace; font-size: 12px; color: #6A6662;">Order: ${orderNumber}</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #6A6662;">${dateStr}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding-bottom: 16px;"><div style="height: 1px; background: #2A2A2A;"></div></td></tr>

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
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #9B9894; padding: 4px 0;">Subtotal</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #9B9894; padding: 4px 0;">${formatNaira(order.subtotal)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #4ADE80; padding: 4px 0;">Discount</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 13px; color: #4ADE80; padding: 4px 0;">-${formatNaira(order.discount_amount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding-top: 12px;"><div style="height: 1px; background: #2A2A2A;"></div></td>
                </tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #EDEBE8; padding-top: 12px;">Total</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 500; color: #EDEBE8; padding-top: 12px;">${total}</td>
                </tr>
                <tr>
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6A6662; padding-top: 8px;">Payment</td>
                  <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #6A6662; padding-top: 8px;">${paymentMethod}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Thank you -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #9B9894; margin: 0 0 24px; line-height: 1.6;">
                Thank you for shopping with BlackTribe.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="https://blacktribefashion.com/shop" style="display: inline-block; background-color: #EDEBE8; color: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 48px;">
                SHOP ONLINE
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 16px; text-align: center;">
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
