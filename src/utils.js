export function toYCbCr(sRGB, YCbCr = new Float32Array(3)) {
    let R = Math.pow(sRGB[0] / 255, 2.2);
    let G = Math.pow(sRGB[1] / 255, 2.2);
    let B = Math.pow(sRGB[2] / 255, 2.2);
    // BT.709
    YCbCr[0] = R *  0.2126000 + G *  0.7152000 + B *  0.0722000;
    YCbCr[1] = R * -0.1145721 + G * -0.3854279 + B / 2;
    YCbCr[2] = R / 2          + G * -0.4541529 + B * -0.0458471;
    return YCbCr;
}

export function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

export function imageToPixels(image) {
    let ctx2d = image.tagName === 'CANVAS' && image.getContext('2d');
    if (!ctx2d) {
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx2d = canvas.getContext('2d');
        ctx2d.drawImage(image, 0, 0);
    }
    return ctx2d.getImageData(0, 0, image.width, image.height);
}

export function imageFromURL(url) {
    return new Promise((res, rej) => {
        let image = new Image();
        image.onload = () => res(image);
        image.onerror = () => rej(new Error(`could not load image ${url}`));
        image.src = url;
    });
}
