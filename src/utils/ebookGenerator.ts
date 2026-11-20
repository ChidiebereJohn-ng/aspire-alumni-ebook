import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AlumniProfile } from '../components/AlumniProfileModal';

export interface EBookOptions {
  editionName: string;
  scope: string; // 'all' or specific cohort year e.g. '2024'
  alumni: AlumniProfile[];
  logoBytes?: Uint8Array;
}

// Brand RGB colors
const TEAL = rgb(0.078, 0.553, 0.576);       // #148D93
const GOLD = rgb(0.961, 0.651, 0.137);       // #F5A623
const ORANGE = rgb(0.969, 0.510, 0.176);     // #F7822D
const RED = rgb(0.839, 0.227, 0.247);        // #D63A3F
const CHARCOAL = rgb(0.122, 0.165, 0.188);   // #1F2A30
const OFF_WHITE = rgb(0.984, 0.973, 0.957);  // #FBF8F4
const WHITE = rgb(1, 1, 1);
const SOFT_TEAL = rgb(0.902, 0.957, 0.957);  // #E6F4F4
const GRAY_TEXT = rgb(0.35, 0.40, 0.45);

// Normalized 5-point star SVG path (radius ~8)
const STAR_SVG_PATH = 'M 0 -8 L 2.35 -2.5 L 8.35 -2.5 L 3.5 1.2 L 5.2 6.9 L 0 3.3 L -5.2 6.9 L -3.5 1.2 L -8.35 -2.5 L -2.35 -2.5 Z';

/**
 * Draw a crisp vector 5-point gold star that never relies on font encoding.
 */
function drawGoldStar(page: any, x: number, y: number, scale = 1, color = GOLD) {
  try {
    page.drawSvgPath(STAR_SVG_PATH, {
      x,
      y,
      scale,
      color,
    });
  } catch {
    // Graceful fallback to small geometric diamond if SVG path fails
    page.drawCircle({
      x,
      y,
      size: scale * 3.5,
      color,
    });
  }
}

/**
 * Sanitizes any string to ensure it contains only characters supported by
 * standard PDF 14 fonts (WinAnsiEncoding / Windows-1252).
 * Replaces non-encodable Unicode typography, symbols, and emojis with clean ASCII equivalents.
 */
export function toPdfSafeText(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  const replacements: [RegExp, string][] = [
    // Smart Quotes & Apostrophes
    [/[\u2018\u2019\u201A\u201B\u02BC\u02BB]/g, "'"],
    [/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"'],
    // Dashes & Hyphens
    [/[\u2014\u2015]/g, ' - '],
    [/[\u2012\u2013\u2212]/g, '-'],
    // Bullets & Symbols
    [/[\u2022\u2023\u25E6\u2043\u2219]/g, ' - '],
    [/[\u2026]/g, '...'],
    [/[\u2605\u2606\u2B50\u2728]/g, '*'],
    [/[\uD83D\uDCCD\uD83D\uDCCE\uD83D\uDDFA]/g, ''], // Map pins 📍 📌 🗺️
    // Non-breaking spaces and special spaces
    [/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' '],
  ];

  for (const [pattern, rep] of replacements) {
    str = str.replace(pattern, rep);
  }

  // Strip all 4-byte UTF-16 surrogates (all emojis and supplementary symbols)
  str = str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');

  // Strip zero-width characters and variation selectors
  str = str.replace(/[\u200B-\u200D\uFEFF\uFE00-\uFE0F]/g, '');

  // Build clean string keeping printable ASCII (32-126) and valid WinAnsi characters
  let clean = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      clean += str[i];
    } else if (code >= 160 && code <= 255) {
      // Extended Latin-1 (é, è, ü, ñ, etc.) valid in WinAnsi
      clean += str[i];
    } else {
      if (/\s/.test(str[i])) {
        clean += ' ';
      }
    }
  }

  return clean;
}

export async function generateAlumniEBook(options: EBookOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Load Standard Fonts
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed logo image if available
  let embeddedLogo: any = null;
  try {
    const logoRes = await fetch('/logo.png');
    if (logoRes.ok) {
      const bytes = await logoRes.arrayBuffer();
      embeddedLogo = await pdfDoc.embedPng(bytes);
    }
  } catch (err) {
    console.warn('Could not load logo for PDF embed:', err);
  }

  // Filter alumni by scope if applicable
  const targetAlumni = options.scope === 'all'
    ? [...options.alumni]
    : options.alumni.filter((a) => String(a.cohort_year) === String(options.scope));

  // Sort by cohort descending, then surname
  targetAlumni.sort((a, b) => b.cohort_year - a.cohort_year || a.surname.localeCompare(b.surname));

  // Group alumni by cohort
  const cohortGroups: Record<number, AlumniProfile[]> = {};
  for (const a of targetAlumni) {
    if (!cohortGroups[a.cohort_year]) {
      cohortGroups[a.cohort_year] = [];
    }
    cohortGroups[a.cohort_year].push(a);
  }

  const cohorts = Object.keys(cohortGroups)
    .map(Number)
    .sort((a, b) => b - a);

  // A4 dimensions in points: 595.28 x 841.89
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;

  let pageNum = 1;

  // Helper: Draw page footer with star and page number
  const drawPageFooter = (page: any, num: number) => {
    // Thin gold divider line
    page.drawLine({
      start: { x: 40, y: 40 },
      end: { x: PAGE_WIDTH - 40, y: 40 },
      thickness: 1,
      color: GOLD,
    });

    // Footer text
    page.drawText('Aspire for Excellence Foundation • Alumni Directory', {
      x: 42,
      y: 25,
      size: 8,
      font: helvetica,
      color: GRAY_TEXT,
    });

    // Small star motif with page number
    const pageStr = String(num);
    drawGoldStar(page, PAGE_WIDTH - 82, 28, 0.6);
    page.drawText(toPdfSafeText(`Page ${pageStr}`), {
      x: PAGE_WIDTH - 72,
      y: 25,
      size: 8,
      font: helveticaBold,
      color: GOLD,
    });
  };

  // ==========================================
  // 1. COVER PAGE
  // ==========================================
  const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: TEAL,
  });

  // Decorative border
  coverPage.drawRectangle({
    x: 24,
    y: 24,
    width: PAGE_WIDTH - 48,
    height: PAGE_HEIGHT - 48,
    borderWidth: 2,
    borderColor: GOLD,
    color: TEAL,
  });

  // White rounded panel for logo (as required by Blueprint Section 1)
  const panelW = 220;
  const panelH = 100;
  const panelX = (PAGE_WIDTH - panelW) / 2;
  const panelY = PAGE_HEIGHT - 260;

  coverPage.drawRectangle({
    x: panelX,
    y: panelY,
    width: panelW,
    height: panelH,
    color: WHITE,
    borderWidth: 1,
    borderColor: GOLD,
  });

  if (embeddedLogo) {
    const logoDims = embeddedLogo.scaleToFit(panelW - 24, panelH - 24);
    coverPage.drawImage(embeddedLogo, {
      x: panelX + (panelW - logoDims.width) / 2,
      y: panelY + (panelH - logoDims.height) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
  }

  // Cover Gold Star Motif
  drawGoldStar(coverPage, PAGE_WIDTH / 2 - 28, panelY - 45, 1.1);
  drawGoldStar(coverPage, PAGE_WIDTH / 2, panelY - 45, 1.5);
  drawGoldStar(coverPage, PAGE_WIDTH / 2 + 28, panelY - 45, 1.1);

  // Cover Title
  const titleText = 'ALUMNI DIRECTORY';
  const titleWidth = timesBold.widthOfTextAtSize(titleText, 32);
  coverPage.drawText(titleText, {
    x: (PAGE_WIDTH - titleWidth) / 2,
    y: panelY - 95,
    size: 32,
    font: timesBold,
    color: WHITE,
  });

  // Subtitle / Scope
  const rawEditionStr = options.editionName || `${options.scope === 'all' ? 'All Cohorts' : `Cohort ${options.scope}`} Edition`;
  const editionStr = toPdfSafeText(rawEditionStr.toUpperCase());
  const editionWidth = helveticaBold.widthOfTextAtSize(editionStr, 13);
  coverPage.drawText(editionStr, {
    x: (PAGE_WIDTH - editionWidth) / 2,
    y: panelY - 125,
    size: 13,
    font: helveticaBold,
    color: GOLD,
  });

  const tagline = toPdfSafeText('"Meet the alumni who came before you."');
  const taglineWidth = timesItalic.widthOfTextAtSize(tagline, 14);
  coverPage.drawText(tagline, {
    x: (PAGE_WIDTH - taglineWidth) / 2,
    y: panelY - 170,
    size: 14,
    font: timesItalic,
    color: SOFT_TEAL,
  });

  // Cover Footer
  const footerNote = 'Aspire for Excellence Foundation';
  const footWidth = timesRegular.widthOfTextAtSize(footerNote, 12);
  coverPage.drawText(footerNote, {
    x: (PAGE_WIDTH - footWidth) / 2,
    y: 60,
    size: 12,
    font: timesRegular,
    color: WHITE,
  });

  pageNum++;

  // ==========================================
  // 2. WELCOME PAGE
  // ==========================================
  const welcomePage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  welcomePage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: OFF_WHITE,
  });

  // Welcome Header
  welcomePage.drawText('WELCOME ADDRESS', {
    x: 50,
    y: PAGE_HEIGHT - 90,
    size: 11,
    font: helveticaBold,
    color: GOLD,
  });

  welcomePage.drawText('To Our Aspire Scholars & Alumni Community', {
    x: 50,
    y: PAGE_HEIGHT - 125,
    size: 22,
    font: timesBold,
    color: CHARCOAL,
  });

  welcomePage.drawLine({
    start: { x: 50, y: PAGE_HEIGHT - 140 },
    end: { x: PAGE_WIDTH - 50, y: PAGE_HEIGHT - 140 },
    thickness: 1.5,
    color: GOLD,
  });

  // Welcome Body Text
  const welcomeParagraphs = [
    'Welcome to the official Alumni Directory & E-Book of the Aspire for Excellence Foundation. Within these pages, you will discover an extraordinary community of scholars, changemakers, and visionary professionals whose journeys embody the true meaning of excellence.',
    'From software engineering in Lagos to international research institutions, from financial institutions to agricultural transformation across Nigeria, Aspire fellows continue to pave groundbreaking paths and uplift their communities.',
    'This directory serves as both a celebration of what has been accomplished and a living bridge between generations of scholars. To our incoming fellows: read their advice, draw strength from their resilience, and know that you walk on shoulders that are proud to hold you high.',
    'To our alumni: thank you for carrying our torch with unmatched integrity and dignity. Continue striving, continue leading, and always remember that excellence is not an act, but a lifelong habit.',
  ];

  let textY = PAGE_HEIGHT - 180;
  for (const para of welcomeParagraphs) {
    welcomePage.drawText(para, {
      x: 50,
      y: textY,
      size: 10.5,
      font: timesRegular,
      color: CHARCOAL,
      maxWidth: PAGE_WIDTH - 100,
      lineHeight: 16,
    });
    textY -= 75;
  }

  // Signature Block
  textY -= 20;
  welcomePage.drawText('With warmest regards and highest aspirations,', {
    x: 50,
    y: textY,
    size: 11,
    font: timesItalic,
    color: CHARCOAL,
  });

  textY -= 30;
  welcomePage.drawText('The Board of Trustees & Executive Leadership', {
    x: 50,
    y: textY,
    size: 12,
    font: timesBold,
    color: TEAL,
  });

  textY -= 16;
  welcomePage.drawText('Aspire for Excellence Foundation', {
    x: 50,
    y: textY,
    size: 10,
    font: helvetica,
    color: GRAY_TEXT,
  });

  drawPageFooter(welcomePage, pageNum);
  pageNum++;

  // ==========================================
  // 3. TABLE OF CONTENTS
  // ==========================================
  const tocPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  tocPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: OFF_WHITE,
  });

  tocPage.drawText('TABLE OF CONTENTS', {
    x: 50,
    y: PAGE_HEIGHT - 90,
    size: 11,
    font: helveticaBold,
    color: GOLD,
  });

  tocPage.drawText('Cohorts & Edition Structure', {
    x: 50,
    y: PAGE_HEIGHT - 125,
    size: 22,
    font: timesBold,
    color: CHARCOAL,
  });

  tocPage.drawLine({
    start: { x: 50, y: PAGE_HEIGHT - 140 },
    end: { x: PAGE_WIDTH - 50, y: PAGE_HEIGHT - 140 },
    thickness: 1.5,
    color: GOLD,
  });

  let tocY = PAGE_HEIGHT - 180;
  for (const cohort of cohorts) {
    const list = cohortGroups[cohort] || [];
    const cohortLabel = `Cohort ${cohort} (${list.length} ${list.length === 1 ? 'Fellow' : 'Fellows'})`;
    
    tocPage.drawText(cohortLabel, {
      x: 50,
      y: tocY,
      size: 12,
      font: timesBold,
      color: TEAL,
    });

    tocPage.drawLine({
      start: { x: 230, y: tocY + 3 },
      end: { x: PAGE_WIDTH - 60, y: tocY + 3 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    tocPage.drawText('Directory Profiles', {
      x: PAGE_WIDTH - 145,
      y: tocY,
      size: 10,
      font: timesItalic,
      color: GRAY_TEXT,
    });

    tocY -= 35;
  }

  drawPageFooter(tocPage, pageNum);
  pageNum++;

  // ==========================================
  // 4 & 5. COHORT DIVIDERS & 2x2 PROFILE PAGES
  // ==========================================
  for (const cohort of cohorts) {
    const cohortAlumni = cohortGroups[cohort] || [];
    if (cohortAlumni.length === 0) continue;

    // 4. Cohort Divider Page (Blueprint: "large year in red serif, gold star rule")
    const divPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    divPage.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: SOFT_TEAL,
    });

    // Large Red Serif Year
    const yearStr = String(cohort);
    const yrWidth = timesBold.widthOfTextAtSize(yearStr, 72);
    divPage.drawText(yearStr, {
      x: (PAGE_WIDTH - yrWidth) / 2,
      y: PAGE_HEIGHT / 2 + 30,
      size: 72,
      font: timesBold,
      color: RED,
    });

    // Gold Star Divider Rule
    const starRule = 'COHORT DIVIDER';
    const ruleW = helveticaBold.widthOfTextAtSize(starRule, 10);
    divPage.drawText(starRule, {
      x: (PAGE_WIDTH - ruleW) / 2,
      y: PAGE_HEIGHT / 2 - 10,
      size: 10,
      font: helveticaBold,
      color: GOLD,
    });

    const starY = PAGE_HEIGHT / 2 - 7;
    [-45, -30, -15].forEach((dx) => drawGoldStar(divPage, PAGE_WIDTH / 2 - ruleW / 2 + dx, starY, 0.6));
    [15, 30, 45].forEach((dx) => drawGoldStar(divPage, PAGE_WIDTH / 2 + ruleW / 2 + dx, starY, 0.6));

    const subMsg = toPdfSafeText(`Aspire for Excellence Fellows - Graduating Class of ${cohort}`);
    const subMsgW = timesItalic.widthOfTextAtSize(subMsg, 13);
    divPage.drawText(subMsg, {
      x: (PAGE_WIDTH - subMsgW) / 2,
      y: PAGE_HEIGHT / 2 - 40,
      size: 13,
      font: timesItalic,
      color: CHARCOAL,
    });

    drawPageFooter(divPage, pageNum);
    pageNum++;

    // 5. 2x2 Grid Profile Pages (4 alumni per page)
    const pageSize = 4;
    for (let i = 0; i < cohortAlumni.length; i += pageSize) {
      const pageBatch = cohortAlumni.slice(i, i + pageSize);
      const profPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      profPage.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        color: OFF_WHITE,
      });

      // Page Header
      profPage.drawText(`COHORT ${cohort} PROFILES`, {
        x: 40,
        y: PAGE_HEIGHT - 45,
        size: 9,
        font: helveticaBold,
        color: TEAL,
      });

      profPage.drawLine({
        start: { x: 40, y: PAGE_HEIGHT - 52 },
        end: { x: PAGE_WIDTH - 40, y: PAGE_HEIGHT - 52 },
        thickness: 0.75,
        color: GOLD,
      });

      // 2x2 Grid Coordinates
      // Card width: 245, Card height: 320
      const cardW = 245;
      const cardH = 320;
      const colX = [40, 310]; // Left col, Right col
      const rowY = [PAGE_HEIGHT - 65 - cardH, PAGE_HEIGHT - 65 - cardH * 2 - 15]; // Top row, Bottom row

      for (let j = 0; j < pageBatch.length; j++) {
        const item = pageBatch[j];
        const cx = colX[j % 2];
        const cy = rowY[Math.floor(j / 2)];

        // Card Container
        profPage.drawRectangle({
          x: cx,
          y: cy,
          width: cardW,
          height: cardH,
          color: WHITE,
          borderColor: rgb(0.88, 0.90, 0.92),
          borderWidth: 1,
        });

        // Photo or Placeholder
        let photoEmbedded = false;
        if (item.photo_key) {
          try {
            const photoRes = await fetch(`/api/photo/${item.photo_key}`);
            if (photoRes.ok) {
              const photoBuf = await photoRes.arrayBuffer();
              const photoImg = await pdfDoc.embedJpg(photoBuf);
              profPage.drawImage(photoImg, {
                x: cx + 15,
                y: cy + cardH - 85,
                width: 70,
                height: 70,
              });
              photoEmbedded = true;
            }
          } catch {
            // fallback
          }
        }

        if (!photoEmbedded) {
          // Circular monogram badge
          profPage.drawRectangle({
            x: cx + 15,
            y: cy + cardH - 85,
            width: 70,
            height: 70,
            color: SOFT_TEAL,
            borderColor: GOLD,
            borderWidth: 1,
          });
          const initials = `${item.first_name[0] || ''}${item.surname[0] || ''}`;
          profPage.drawText(initials, {
            x: cx + 35,
            y: cy + cardH - 55,
            size: 20,
            font: timesBold,
            color: TEAL,
          });
        }

        // Cohort Badge (top right of card)
        profPage.drawRectangle({
          x: cx + cardW - 75,
          y: cy + cardH - 28,
          width: 65,
          height: 16,
          color: TEAL,
        });
        profPage.drawText(`'${String(item.cohort_year).slice(2)} FELLOW`, {
          x: cx + cardW - 70,
          y: cy + cardH - 24,
          size: 7,
          font: helveticaBold,
          color: WHITE,
        });

        // Name
        const fullName = toPdfSafeText(`${item.first_name} ${item.surname}`);
        profPage.drawText(fullName, {
          x: cx + 15,
          y: cy + cardH - 105,
          size: 13,
          font: timesBold,
          color: CHARCOAL,
          maxWidth: cardW - 30,
        });

        // Industry
        const indName = toPdfSafeText(item.industry || 'Professional Sector');
        profPage.drawText(indName, {
          x: cx + 15,
          y: cy + cardH - 120,
          size: 8.5,
          font: helveticaBold,
          color: ORANGE,
          maxWidth: cardW - 30,
        });

        // Role & Employer (respect privacy)
        let roleLine = item.role || '';
        if (item.employer && !item.hide_employer) {
          roleLine += roleLine ? ` - ${item.employer}` : item.employer;
        }
        if (roleLine) {
          profPage.drawText(toPdfSafeText(roleLine).slice(0, 42), {
            x: cx + 15,
            y: cy + cardH - 140,
            size: 8,
            font: helvetica,
            color: CHARCOAL,
            maxWidth: cardW - 30,
          });
        }

        // Location
        const loc = toPdfSafeText(`${item.city && !item.hide_city ? `${item.city}, ` : ''}${item.state}`);
        if (loc) {
          profPage.drawText(loc, {
            x: cx + 15,
            y: cy + cardH - 155,
            size: 8,
            font: helvetica,
            color: GRAY_TEXT,
          });
        }

        // Divider in card
        profPage.drawLine({
          start: { x: cx + 15, y: cy + cardH - 170 },
          end: { x: cx + cardW - 15, y: cy + cardH - 170 },
          thickness: 0.5,
          color: rgb(0.9, 0.9, 0.9),
        });

        // Advice quote snippet (Blueprint: "cut to about 100 characters, shown only if provided")
        if (item.advice) {
          const cutAdvice = `"${toPdfSafeText(item.advice).slice(0, 100).trim()}..."`;
          profPage.drawText('Words of Wisdom:', {
            x: cx + 15,
            y: cy + cardH - 188,
            size: 7.5,
            font: helveticaBold,
            color: TEAL,
          });

          profPage.drawText(cutAdvice, {
            x: cx + 15,
            y: cy + cardH - 205,
            size: 8,
            font: timesItalic,
            color: CHARCOAL,
            maxWidth: cardW - 30,
            lineHeight: 12,
          });
        }
      }

      drawPageFooter(profPage, pageNum);
      pageNum++;
    }
  }

  // ==========================================
  // 6. BACK COVER PAGE
  // ==========================================
  const backPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  backPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: TEAL,
  });

  // Decorative border
  backPage.drawRectangle({
    x: 24,
    y: 24,
    width: PAGE_WIDTH - 48,
    height: PAGE_HEIGHT - 48,
    borderWidth: 2,
    borderColor: GOLD,
    color: TEAL,
  });

  // White rounded panel for logo
  const backPanelW = 200;
  const backPanelH = 90;
  const backPanelX = (PAGE_WIDTH - backPanelW) / 2;
  const backPanelY = PAGE_HEIGHT / 2 + 100;

  backPage.drawRectangle({
    x: backPanelX,
    y: backPanelY,
    width: backPanelW,
    height: backPanelH,
    color: WHITE,
    borderWidth: 1,
    borderColor: GOLD,
  });

  if (embeddedLogo) {
    const logoDims = embeddedLogo.scaleToFit(backPanelW - 24, backPanelH - 24);
    backPage.drawImage(embeddedLogo, {
      x: backPanelX + (backPanelW - logoDims.width) / 2,
      y: backPanelY + (backPanelH - logoDims.height) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
  }

  // Closing words
  const closingQuote = toPdfSafeText('"Striving Together - Reaching Higher"');
  const closeW = timesBold.widthOfTextAtSize(closingQuote, 18);
  backPage.drawText(closingQuote, {
    x: (PAGE_WIDTH - closeW) / 2,
    y: backPanelY - 60,
    size: 18,
    font: timesBold,
    color: WHITE,
  });

  // Contact Info
  const contactLines = [
    'Aspire for Excellence Foundation',
    'Email: info@aspireforexcellence.org',
    'Website: https://aspire-alumni-ebook.pages.dev',
    'Lagos, Nigeria - Global Alumni Network',
  ];

  let cY = backPanelY - 120;
  for (const line of contactLines) {
    const safeLine = toPdfSafeText(line);
    const lw = helvetica.widthOfTextAtSize(safeLine, 10);
    backPage.drawText(safeLine, {
      x: (PAGE_WIDTH - lw) / 2,
      y: cY,
      size: 10,
      font: helvetica,
      color: SOFT_TEAL,
    });
    cY -= 20;
  }

  // Final gold stars (drawn with vector SVG paths)
  drawGoldStar(backPage, PAGE_WIDTH / 2 - 25, 80, 0.9);
  drawGoldStar(backPage, PAGE_WIDTH / 2, 80, 1.3);
  drawGoldStar(backPage, PAGE_WIDTH / 2 + 25, 80, 0.9);

  return await pdfDoc.save();
}
