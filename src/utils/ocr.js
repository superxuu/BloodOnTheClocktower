import Tesseract from 'tesseract.js';

export const recognizeScript = async (imageFile, onProgress) => {
    try {
        // Pre-process image to improve accuracy (Grayscale + Binarization)
        const processedImage = await preprocessImage(imageFile);

        const result = await Tesseract.recognize(
            processedImage,
            'chi_sim+eng', // Support Chinese and English
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        onProgress(m.progress);
                    }
                }
            }
        );

        return parseScriptFromText(result.data.text);
    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
};

// Helper: Pre-process image using Canvas
const preprocessImage = (imageFile) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Binarization (Thresholding)
            // 1. Convert to grayscale
            // 2. Apply threshold to make it black and white
            const threshold = 128; // Standard threshold, could be adjusted

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Luminance formula
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // Thresholding
                const val = gray > threshold ? 255 : 0;

                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
    });
};

import scriptsData from '../data/scripts.json';

// Flatten all known roles into a unique list for iteration
const allRoles = [];
const roleIds = new Set();

scriptsData.forEach(script => {
    if (script.roles) {
        script.roles.forEach(role => {
            if (!roleIds.has(role.id)) {
                allRoles.push(role);
                roleIds.add(role.id);
            }
        });
    }
});

export const parseScriptFromText = (text) => {
    // Normalize text: remove common noise but keep structure for debugging if needed
    // But for search, we'll use the raw-ish text or a space-normalized version.
    // Actually, regex with \s* is best for the original text.

    const roles = [];
    const foundRoleIds = new Set();

    // Strategy: Iterate through ALL known roles and check if they exist in the text.
    // This bypasses layout issues (columns, weird newlines) and OCR splitting characters.

    allRoles.forEach(role => {
        if (foundRoleIds.has(role.id)) return;

        const name = role.name;
        if (!name) return;

        // 1. Construct a regex that allows spaces between characters
        // e.g. "洗衣妇" -> /洗\s*衣\s*妇/
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedName = escapeRegExp(name);
        const spacedPattern = escapedName.split('').join('\\s*');
        const regex = new RegExp(spacedPattern, 'i'); // Case insensitive for English

        // 2. Check for match
        const match = text.match(regex);

        // 3. Fuzzy fallback for Chinese names (length >= 3)
        // If exact/spaced match fails, try matching 2/3 characters?
        // Maybe too risky for false positives. Let's stick to spaced match first.
        // The user's issue is likely spaces or layout.

        // Let's add a simple fuzzy check: if name is 3 chars, allow 1 char mismatch/missing?
        // For now, let's try the spaced regex first. It's very powerful for OCR.

        if (match) {
            roles.push({
                ...role,
                id: `imported_${role.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                // Use official data
            });
            foundRoleIds.add(role.id);
        } else {
            // Experimental: Try matching simplified/traditional or common OCR typos?
            // For now, let's see if spaced regex is enough.
            // Also check for English name if Chinese fails?
            // The OCR is set to 'chi_sim+eng', so it might pick up English IDs if present.
            if (role.id && text.toLowerCase().includes(role.id.replace(/_/g, ' '))) {
                roles.push({
                    ...role,
                    id: `imported_${role.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                });
                foundRoleIds.add(role.id);
            }
        }
    });

    return {
        id: `imported_${Date.now()}`,
        title: "导入的剧本 (OCR)",
        author: "OCR Import",
        description: `通过图片识别导入。已自动识别 ${roles.length} 个角色。`,
        roles: roles.length > 0 ? roles : [{
            id: 'placeholder',
            name: '未识别出角色',
            team: 'townsfolk',
            ability: '请尝试手动添加角色，或检查图片清晰度。',
            firstNight: false,
            otherNight: false
        }]
    };
};
