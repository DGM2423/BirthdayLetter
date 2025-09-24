// script.js - improved: fills a heart silhouette with justified text,
// uses multiple spans per scanline (handles the two-lobed top),
// breaks long words into chunks when necessary.

// Canvas + DPI handling
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');
const CSS_W = canvas.width;
const CSS_H = canvas.height;
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CSS_W * dpr);
canvas.height = Math.round(CSS_H * dpr);
canvas.style.width = CSS_W + 'px';
canvas.style.height = CSS_H + 'px';
ctx.scale(dpr, dpr);

// ========== TUNABLE PARAMETERS ==========
const fontSize = 16;         // px - reduce to fit more text
const lineHeight = 36;       // px - distance between lines
const heartScale = 18;       // increase to make heart bigger
const sampleSteps = 1600;    // shape sampling (higher is smoother)
// =======================================

// Text to render
const text = `Happy Birthday Amor! You are the most amazing woman in the world, you deserve 
all the happiness in the universe. You bring joy everywhere you go and make everyone 
around you feel special. You make me feel like I can do anything with your support. 
I constantly feel loved and wanted by you. I am so grateful to have you in my life. 
You are also so so beautiful, inside and out. Smartest mcb major out there, Smartest 
cutie patootie, smartest woman I know. I wish you all the best on your special day. I 
wish I was there celebrating with you but I hope you know I love you and miss you. I'll 
see you this weekend. I♥♥♥LOVE♥♥♥YOU♥♥♥`;

// Drawing styles
const textColor = '#d6336c';
const outlineColor = '#ff4d6c';
const outlineWidth = 2;

// Canvas text setup
ctx.font = `${fontSize}px Arial`;
ctx.textBaseline = 'middle';
ctx.fillStyle = textColor;
ctx.strokeStyle = outlineColor;
ctx.lineWidth = outlineWidth;

// Build parametric heart polygon (classic heart)
function buildHeartPolygon(scale, centerX, centerY, steps = 800) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2; // 0..2π
    const X = 16 * Math.pow(Math.sin(t), 3);
    const Y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const x = centerX + X * scale;
    const y = centerY - Y * scale; // invert y for canvas coords
    pts.push({ x, y });
  }
  return pts;
}

// Scanline intersection spans for given y (returns array of [left,right] spans)
function scanlineSpans(polygon, y) {
  const xs = [];
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];
    const y1 = p1.y;
    const y2 = p2.y;
    if ((y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) && (y1 !== y2)) {
      const t = (y - y1) / (y2 - y1);
      const x = p1.x + t * (p2.x - p1.x);
      xs.push(x);
    }
  }
  if (xs.length < 2) return [];
  xs.sort((a, b) => a - b);
  const spans = [];
  for (let i = 0; i < xs.length - 1; i += 2) {
    const left = xs[i];
    const right = xs[i + 1];
    if (right - left > 4) spans.push([left, right]);
  }
  return spans;
}

// draw polygon outline
function strokeHeart(polygon) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// Helper: draw a centered chunk (string) inside a span
function drawChunkCentered(chunk, leftX, rightX, y) {
  const chunkW = ctx.measureText(chunk).width;
  const x = leftX + (rightX - leftX - chunkW) / 2;
  ctx.fillText(chunk, x, y);
}

// Helper: draw words filling the span with justification (fills full span if possible)
function drawWordsFillingSpan(wordsArr, leftX, rightX, y) {
  // compute widths
  const gaps = Math.max(wordsArr.length - 1, 0);
  let naturalWidth = 0;
  for (let i = 0; i < wordsArr.length; i++) {
    naturalWidth += ctx.measureText(wordsArr[i]).width;
  }
  const spaceW = ctx.measureText(' ').width;
  const naturalWithSpaces = naturalWidth + gaps * spaceW;
  const spanWidth = rightX - leftX;
  const extra = Math.max(0, spanWidth - naturalWithSpaces);

  if (wordsArr.length === 1) {
    // center single word
    const word = wordsArr[0];
    const w = ctx.measureText(word).width;
    const startX = leftX + (spanWidth - w) / 2;
    ctx.fillText(word, startX, y);
    return;
  }

  // distribute extra across gaps (simple even distribution)
  const extraPerGap = gaps > 0 ? extra / gaps : 0;
  let x = leftX;
  for (let i = 0; i < wordsArr.length; i++) {
    const w = wordsArr[i];
    ctx.fillText(w, x, y);
    const wW = ctx.measureText(w).width;
    x += wW;
    if (i < wordsArr.length - 1) {
      x += spaceW + extraPerGap;
    }
  }
}

// Main rendering algorithm: scanlines, spans, fill words
function renderTextInHeart(text, polygon) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const spaceWidth = ctx.measureText(' ').width;

  // bounding Y
  let minY = Infinity, maxY = -Infinity;
  polygon.forEach(p => { if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; });

  let y = Math.ceil(minY + lineHeight * 0.6);
  let wordIndex = 0;

  // iterate scanlines top -> bottom
  while (y < maxY && wordIndex < words.length) {
    const spans = scanlineSpans(polygon, y);
    if (spans.length === 0) {
      y += lineHeight;
      continue;
    }

    // sort spans by distance to center (so center span gets filled first)
    const centerX = CSS_W / 2;
    spans.sort((a, b) => {
      const ca = (a[0] + a[1]) / 2;
      const cb = (b[0] + b[1]) / 2;
      return Math.abs(ca - centerX) - Math.abs(cb - centerX);
    });

    // loop through spans in this scanline, fill each with one line (if words remain)
    for (let s = 0; s < spans.length && wordIndex < words.length; s++) {
      const [leftX, rightX] = spans[s];
      const spanWidth = rightX - leftX;

      // Build best-fit sequence of words for this span
      const lineWords = [];
      let naturalWidth = 0;
      let tempIndex = wordIndex;

      while (tempIndex < words.length) {
        const w = words[tempIndex];
        const wW = ctx.measureText(w).width;
        const tentative = (lineWords.length === 0) ? (wW) : (naturalWidth + spaceWidth + wW + (lineWords.length - 0) * 0);
        // note: naturalWidth here holds widths of words already in line (no spaces)
        const currentTotal = (lineWords.length === 0) ? wW : (naturalWidth + spaceWidth + wW + (lineWords.length - 1) * spaceWidth);
        // simpler: compute total width if add the word:
        const totalIfAdded = (lineWords.length === 0)
          ? wW
          : naturalWidth + (lineWords.length) * spaceWidth + wW;
        if (totalIfAdded <= spanWidth) {
          // add it
          lineWords.push(w);
          naturalWidth += wW;
          tempIndex++;
        } else {
          break;
        }
      }

      // If no word fits (single word too long) => break that long word into a chunk of chars
      if (lineWords.length === 0) {
        const longWord = words[wordIndex];
        // find max characters that fit
        let fitCount = 0;
        for (let c = 1; c <= longWord.length; c++) {
          const chunk = longWord.slice(0, c);
          if (ctx.measureText(chunk).width <= spanWidth) {
            fitCount = c;
          } else {
            break;
          }
        }
        if (fitCount === 0) {
          // as a fallback, place first char and advance
          const chunk = longWord[0];
          drawChunkCentered(chunk, leftX, rightX, y);
          words[wordIndex] = longWord.slice(1) || '';
          if (words[wordIndex] === '') wordIndex++;
        } else {
          const chunk = longWord.slice(0, fitCount);
          drawChunkCentered(chunk, leftX, rightX, y);
          // replace word with remainder or remove
          const remainder = longWord.slice(fitCount);
          if (remainder.length > 0) words[wordIndex] = remainder;
          else wordIndex++;
        }
        // move to next span on same y (do not increment y yet)
        continue;
      }

      // Render the collected lineWords in this span with justification
      drawWordsFillingSpan(lineWords, leftX, rightX, y);

      // advance wordIndex by number of words consumed
      wordIndex = tempIndex;
    }

    // after trying all spans on this y, move down a line
    y += lineHeight;
  }
}

// ====== Build heart polygon and render everything ======
(function main() {
  // center the heart nicely on the canvas
  const centerX = CSS_W / 2;
  const centerY = CSS_H / 2 + 10;
  const polygon = buildHeartPolygon(heartScale, centerX, centerY, sampleSteps);

  // draw outline first (so text overlays or you can comment this out)
  strokeHeart(polygon);

  // fill text
  ctx.fillStyle = textColor;
  renderTextInHeart(text, polygon);
})();
