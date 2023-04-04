const DEFAULT_OPTIONS = {
    cols: 10,
    maxRows: 20,
    rulerGradientThresh: 0.05,
    rulerLengthThresh: 0.25,
};

function makeGrayscale(rgba, width, height, _options) {
    let output = new Float32Array(width * height);
    let j = 0;
    for (let i = 0; i < output.length; i++) {
        let r = rgba[j++];
        let g = rgba[j++];
        let b = rgba[j++];
        let a = rgba[j++];
        if (a < 255) {
            output[i] = 0;
        } else {
            output[i] = (r + g + b) / (255 * 3);
        }
    }
    return output;
}

function computeSobel(intensity, width, height, _options) {
    let gradient = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            // gx,gy = gradient per axis
            let gx = 0, gy = 0;
            // dx,dy = offset from x,y
            // s,s0,s1,s2 = state machines used to generate this kernel for gx:
            //   [ +1  0 -1 ]
            //   [ +2  0 -2 ]
            //   [ +1  0 -1 ]
            // t,t0,t1,t2 = state machines used to generate this kernel for gy:
            //   [ +1 +2 +1 ]
            //   [  0  0  0 ]
            //   [ -1 -2 -1 ]
            for (let dy = -1, s0 = 1, s1 = 2, t0 = 1, t1 = 0;
                 dy < 2;
                 dy++, s0 = s1, s1 = 1, t0 = t1, t1 = -1)
            {
                // s0 := [1, 2, 1]
                // t0 := [1, 0, -1]
                for (let dx = -1, s = s0, s2 = 0, t = t0, t2 = t0 + t0;
                     dx < 2;
                     dx++, s = s2, s2 = -s0, t = t2, t2 = t0)
                {
                    // s := [s0, 0, -s0]
                    // t := [t0, 2*t0, t0]
                    let v = intensity[(y + dy) * width + (x + dx)];
                    gx += s * v;
                    gy += t * v;
                }
            }
            gradient[y * width + x] = gx * gx + gy * gy; // magnitude squared
            // NOTE(iitalics): not computed: direction = atan2(gy, gx)
        }
    }
    return gradient;
}

function computeRulers(gradient, width, height, options) {
    let { rulerLengthThresh, rulerGradientThresh } = options;
    let horizontal = new Uint8Array(height);
    let vertical = new Uint8Array(width);
    let minHorizontalLength = Math.floor(rulerLengthThresh * width);
    let minVerticalLength = Math.floor(rulerLengthThresh * height);
    for (let y = 0; y < height; y++) {
        let length = 0, maxLength = 0, previous = false;
        for (let x = 0; x < width; x++) {
            let current = gradient[y * width + x] > rulerGradientThresh;
            if (current && previous) {
                length++;
                maxLength = Math.max(length, maxLength);
            } else {
                length = 0;
                previous = current;
            }
        }
        horizontal[y] = (maxLength >= minHorizontalLength);
    }
    for (let x = 0; x < width; x++) {
        let length = 0, maxLength = 0, previous = false;
        for (let y = 0; y < height; y++) {
            let current = gradient[y * width + x] > rulerGradientThresh;
            if (current && previous) {
                length++;
                maxLength = Math.max(length, maxLength);
            } else {
                length = 0;
                previous = current;
            }
        }
        vertical[x] = (maxLength >= minVerticalLength);
    }
    return { horizontal, vertical };
}

function findBounds(rulers, options) {
    let { cols, maxRows } = options;
    let { vertical, horizontal } = rulers;

    // x0,y0,x1,x1 = playfield bounding box (x0 ≤ x < x1, y0 ≤ y < y1). y0 is not computed
    // yet because it is derived by substracting the height from y1.
    let x0, x1, y1;
    for (let i = 0, j = vertical.length - 1; i < j; i++, j--) {
        if (vertical[i] && x0 === undefined) {
            x0 = i + 2;
        }
        if (vertical[j] && x1 === undefined) {
            x1 = j - 2;
        }
    }
    for (let i = 0, j = horizontal.length - 1; i < j; i++, j--) {
        // don't search for y0
        if (horizontal[j] && y1 === undefined) {
            y1 = j - 1;
        }
    }

    // defaults if not found by the loops above
    x0 ||= 0;
    x1 ||= vertical.length;
    y1 ||= horizontal.length;

    // determine number of rows by available space above y1
    let cellSize = (x1 - x0) / cols;
    let rows = maxRows;
    let height = cellSize * maxRows;
    while (height > y1) {
        height -= cellSize;
        rows--;
    }
    let y0 = y1 - Math.round(height);
    return { x0, x1, y0, y1, cols, rows };
}

export function detectBounds({ data, width, height }, options = {}) {
    options = { ...DEFAULT_OPTIONS, ...options };
    let intensity = makeGrayscale(data, width, height, options);
    let gradient = computeSobel(intensity, width, height, options);
    let rulers = computeRulers(gradient, width, height, options);
    return findBounds(rulers, options);
}
