Add-Type -AssemblyName System.Drawing

[int]$width = 1200
[int]$height = 630

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 1. Background: Deep Teal Gradient
$colorTop = [System.Drawing.ColorTranslator]::FromHtml('#148D93')
$colorBottom = [System.Drawing.ColorTranslator]::FromHtml('#0B4F53')
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorTop, $colorBottom, 45.0)
$g.FillRectangle($brush, $rect)

# 2. Decorative Gold Border
$goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F5A623'), 3)
[int]$innerW = $width - 50
[int]$innerH = $height - 50
$innerRect = New-Object System.Drawing.Rectangle(25, 25, $innerW, $innerH)
$g.DrawRectangle($goldPen, $innerRect)

$thinGoldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F7822D'), 1)
[int]$thinW = $width - 64
[int]$thinH = $height - 64
$thinRect = New-Object System.Drawing.Rectangle(32, 32, $thinW, $thinH)
$g.DrawRectangle($thinGoldPen, $thinRect)

# 3. White Shield Card for Logo
[int]$cardWidth = 260
[int]$cardHeight = 110
[int]$cardX = ($width - $cardWidth) / 2
[int]$cardY = 65
$cardRect = New-Object System.Drawing.Rectangle($cardX, $cardY, $cardWidth, $cardHeight)

# Shadow
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
[int]$shadowX = $cardX + 4
[int]$shadowY = $cardY + 4
$shadowRect = New-Object System.Drawing.Rectangle($shadowX, $shadowY, $cardWidth, $cardHeight)
$g.FillRectangle($shadowBrush, $shadowRect)

# Card Background
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FBF8F4'))
$g.FillRectangle($whiteBrush, $cardRect)
$cardBorderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F5A623'), 2)
$g.DrawRectangle($cardBorderPen, $cardRect)

# Draw Logo
$logoPath = Resolve-Path 'public/logo.png'
if (Test-Path $logoPath) {
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)
    [int]$logoTargetWidth = 210
    [int]$logoTargetHeight = [int]($logoImg.Height * ($logoTargetWidth / $logoImg.Width))
    if ($logoTargetHeight -gt 85) {
        $logoTargetHeight = 85
        $logoTargetWidth = [int]($logoImg.Width * ($logoTargetHeight / $logoImg.Height))
    }
    [int]$logoX = $cardX + (($cardWidth - $logoTargetWidth) / 2)
    [int]$logoY = $cardY + (($cardHeight - $logoTargetHeight) / 2)
    $g.DrawImage($logoImg, $logoX, $logoY, $logoTargetWidth, $logoTargetHeight)
    $logoImg.Dispose()
}

# String format centered
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center

# 4. Text: Foundation Name
$fontOrg = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)
$brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#F5A623'))
$g.DrawString('★  ASPIRE FOR EXCELLENCE FOUNDATION  ★', $fontOrg, $brushGold, [float]($width / 2), 205, $format)

# 5. Text: Alumni Directory & Yearbook
$fontTitle = New-Object System.Drawing.Font('Georgia', 42, [System.Drawing.FontStyle]::Bold)
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString('Alumni Directory & Yearbook', $fontTitle, $brushWhite, [float]($width / 2), 255, $format)

# 6. Text: Tagline
$fontTagline = New-Object System.Drawing.Font('Georgia', 26, [System.Drawing.FontStyle]::Italic)
$brushCream = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FBF8F4'))
$g.DrawString('"Meet the alumni who came before you."', $fontTagline, $brushCream, [float]($width / 2), 340, $format)

# 7. Divider Line with Stars
$divPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F5A623'), 1.5)
$g.DrawLine($divPen, 350, 410, 850, 410)

# 8. Description Badges
$fontBadge = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Bold)
$brushBadge = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#E6F4F4'))
$g.DrawString('Cohorts 2021 – 2026   •   Nigeria & Diaspora   •   Official Publication', $fontBadge, $brushBadge, [float]($width / 2), 445, $format)

# 9. Bottom Pill
[int]$pillWidth = 380
[int]$pillHeight = 46
[int]$pillX = ($width - $pillWidth) / 2
[int]$pillY = 515
$pillRect = New-Object System.Drawing.Rectangle($pillX, $pillY, $pillWidth, $pillHeight)
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#D63A3F'))
$g.FillRectangle($pillBrush, $pillRect)
$pillBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F5A623'), 2)
$g.DrawRectangle($pillBorder, $pillRect)

$fontPill = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)
$g.DrawString('EXPLORE DIRECTORY & YEARBOOK', $fontPill, $brushWhite, [float]($width / 2), 528, $format)

# Save to public
$outPublic = 'public/og-preview.png'
$bmp.Save($outPublic, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Output "Successfully generated: $outPublic (1200x630)"
