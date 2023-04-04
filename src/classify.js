import { lerp, toYCbCr } from './utils'

export function classifyField(pixels, bounds) {
    let sRGB = new Float32Array(3);
    let YCbCr = new Float32Array(3);
    let rows = [];
    for (let y = 19; y >= 0; y--) {
        let row = '', empty = true;
        for (let x = 0; x < 10; x++) {
            let b = classifyBlock(pixels, bounds, x, y, sRGB, YCbCr);
            row += b;
            if (b != '_') {
                empty = false;
            }
        }
        if (empty) {
            break;
        }
        rows.push(row);
    }
    return rows.reverse().join('');
}

export function classifyBlock(pixels, bounds, col, row,
                              // allows you to reuse this temporary storage
                              sRGB = new Float32Array(3),
                              YCbCr = new Float32Array(3))
{
    // find range of pixels for the desired cell
    let x0 = Math.round(lerp(bounds.x0, bounds.x1, col / bounds.cols));
    let x1 = Math.round(lerp(bounds.x0, bounds.x1, (col + 1) / bounds.cols));
    let y0 = Math.round(lerp(bounds.y0, bounds.y1, row / bounds.rows));
    let y1 = Math.round(lerp(bounds.y0, bounds.y1, (row + 1) / bounds.rows));

    // get average pixel color in range
    sRGB[0] = 0;
    sRGB[1] = 0;
    sRGB[2] = 0;
    for (let x = x0; x < x1; x++) {
        for (let y = y0; y < y1; y++) {
            let i = (pixels.width * y + x) * 4;
            sRGB[0] += pixels.data[i + 0];
            sRGB[1] += pixels.data[i + 1];
            sRGB[2] += pixels.data[i + 2];
        }
    }
    let n = (y1 - y0) * (x1 - x0);
    sRGB[0] /= n;
    sRGB[1] /= n;
    sRGB[2] /= n;

    return classifyPixel(sRGB, YCbCr);
}

export function classifyPixel(sRGB, YCbCr) {
    // i pulled these numbers out of my ass
    const BLACK_THRESHOLD = 0.04;
    const GREY_THRESHOLD = 0.09;
    const SLOPE_PURPLE = 0.3;
    const SLOPE_CYAN = -0.75;
    const SLOPE_GREEN = 2.5;
    const SLOPE_YELLOW0 = 0.2;
    const SLOPE_YELLOW = -1.1;
    const SLOPE_RED = -3;

    let [Y, Cb, Cr] = toYCbCr(sRGB, YCbCr);

    if (Math.abs(Cb) < GREY_THRESHOLD && Math.abs(Cr) < GREY_THRESHOLD) {
        if (Y < BLACK_THRESHOLD) {
            return '_';
        } else {
            return 'X';
        }
    }

    if (Cb < 0 && Cb * SLOPE_YELLOW0 < Cr) {
        if (Cb * SLOPE_RED < Cr) {
            return 'Z';
        } else if (Cb * SLOPE_YELLOW > Cr) {
            return 'O';
        } else {
            return 'L';
        }
    } else if (Cb * SLOPE_CYAN > Cr) {
        if (Cb * SLOPE_GREEN < Cr) {
            return 'S';
        } else {
            return 'I';
        }
    } else {
        if (Cb * SLOPE_PURPLE > Cr) {
            return 'J';
        } else {
            return 'T';
        }
    }
}
