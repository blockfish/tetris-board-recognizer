import { imageToPixels, imageFromURL } from './utils'

export function recognizeImage(image) {
    return recognizePixels(imageToPixels(image));
}

export function recognizeBlob(blob) {
    return imageFromURL(URL.createObjectURL(blob))
        .then(recognizeImage);
}

export async function recognizePixels(pixels) {
    await new Promise(res => setTimeout(res, 1000));
    return { width: pixels.width, height: pixels.height };
}
