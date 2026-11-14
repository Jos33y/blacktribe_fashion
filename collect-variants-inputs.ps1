# BlackTribe Fashion / colour variants inputs
#
# Colour variants: one product, several colours, each with its own photos
# and stock. Stages every file a colour choice passes through: product page,
# selectors, cards, bag, checkout, order creation, stock decrement, admin
# product form, walk-in orders, order emails, and every stylesheet the
# staged pages import.
#
# Exits on any missing file rather than building a partial archive.
#
# Run from the repository root.

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'package.json')) {
  Write-Host 'No package.json here. Run this from the repository root.' -ForegroundColor Red
  exit 1
}

# Pages whose CSS imports get picked up automatically
$pages = @(
  'src\pages\shop\ProductDetail.jsx',
  'src\components\product\ColorSelector.jsx',
  'src\components\product\SizeSelector.jsx',
  'src\components\product\ProductCard.jsx',
  'src\components\product\QuickView.jsx',
  'src\components\cart\CartItem.jsx',
  'src\pages\checkout\Checkout.jsx',
  'src\pages\admin\ProductForm.jsx',
  'src\pages\admin\WalkInOrder.jsx'
)

$files = @(
  # storefront: product page + pieces
  'src\pages\shop\ProductDetail.jsx',
  'src\components\product\ColorSelector.jsx',
  'src\components\product\SizeSelector.jsx',
  'src\components\product\ProductCard.jsx',
  'src\components\product\QuickView.jsx',
  'src\components\product\ScarcityIndicator.jsx',

  # bag
  'src\store\cartStore.js',
  'src\components\cart\CartItem.jsx',
  'src\components\cart\CartDrawer.jsx',

  # checkout + order
  'src\pages\checkout\Checkout.jsx',
  'src\components\checkout\OrderSummary.jsx',
  'server\routes\cart.js',
  'server\routes\orders.js',
  'server\routes\webhooks.js',
  'server\services\orderService.js',
  'server\services\paymentService.js',

  # admin
  'src\pages\admin\ProductForm.jsx',
  'src\pages\admin\WalkInOrder.jsx',
  'src\pages\admin\OrderDetail.jsx',
  'server\routes\admin\products.js',
  'server\routes\admin\orders.js',

  # emails that list size/colour
  'server\templates\orderConfirmation.js',
  'server\templates\adminOrderNotification.js'
)

foreach ($p in $pages) {
  if (-not (Test-Path -LiteralPath $p)) { continue }
  Select-String -LiteralPath $p -Pattern 'styles/[A-Za-z0-9_/.-]+\.css' -AllMatches |
    ForEach-Object { $_.Matches } |
    ForEach-Object {
      $rel = 'src\' + ($_.Value -replace '/', '\')
      if ($files -notcontains $rel) {
        $files += $rel
        Write-Host ("imported:  {0}" -f $rel) -ForegroundColor Cyan
      }
    }
}

$missing = @()
foreach ($f in $files) {
  if (-not (Test-Path -LiteralPath $f)) { $missing += $f }
}

if ($missing.Count -gt 0) {
  Write-Host ''
  Write-Host ("{0} file(s) missing. Nothing was written." -f $missing.Count) -ForegroundColor Red
  foreach ($m in $missing) { Write-Host ("  {0}" -f $m) }
  Write-Host ''
  Write-Host 'Send me this list rather than editing it out. A path I got'
  Write-Host 'wrong tells me something about the layout.'
  exit 1
}

$stage = Join-Path $env:TEMP 'bt_variants_inputs'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }

foreach ($f in $files) {
  $dst = Join-Path $stage $f
  $dir = [System.IO.Path]::GetDirectoryName($dst)
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item -LiteralPath $f -Destination $dst -Force
  Write-Host ("staged:    {0}" -f $f)
}

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath 'bt-variants-inputs.zip' -Force
Remove-Item $stage -Recurse -Force

Write-Host ''
Write-Host ("{0} files in bt-variants-inputs.zip" -f $files.Count) -ForegroundColor Cyan
Write-Host ''
