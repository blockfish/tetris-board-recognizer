import { imageToPixels, imageFromURL } from './utils'
import { detectBounds } from './detect-bounds'
import { classifyField } from './classify'

export function recognizeImage(image) {
    return recognizePixels(imageToPixels(image));
}

export function recognizeBlob(blob) {
    return imageFromURL(URL.createObjectURL(blob))
        .then(recognizeImage);
}

export async function recognizePixels(pixels) {
    let bounds = detectBounds(pixels);
    let field = classifyField(pixels, bounds);
    return { bounds, field };
}
