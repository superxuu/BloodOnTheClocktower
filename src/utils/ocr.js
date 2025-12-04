import Tesseract from 'tesseract.js';

export const recognizeScript = async (imageFile, onProgress) => {
    try {
        const result = await Tesseract.recognize(
            imageFile,
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

const parseScriptFromText = (text) => {
    // Heuristic parsing logic
    // This is highly dependent on the format of the script image.
    // We'll assume a standard list format for now and try to identify role names.

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const roles = [];
    let currentTeam = 'townsfolk'; // Default start

    // Keywords to switch teams
    const teamKeywords = {
        '村民': 'townsfolk',
        'Townsfolk': 'townsfolk',
        '外来者': 'outsider',
        'Outsider': 'outsider',
        '爪牙': 'minion',
        'Minion': 'minion',
        '恶魔': 'demon',
        'Demon': 'demon'
    };

    lines.forEach(line => {
        // Check for team headers
        for (const [keyword, team] of Object.entries(teamKeywords)) {
            if (line.includes(keyword)) {
                currentTeam = team;
                return;
            }
        }

        // Assume lines that aren't headers are roles
        // This is very naive and will need improvement
        if (line.length > 2) {
            roles.push({
                id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: line.trim(),
                team: currentTeam,
                ability: "OCR 导入角色 - 请手动编辑详情", // Placeholder
                firstNight: false,
                otherNight: false
            });
        }
    });

    return {
        id: `imported_${Date.now()}`,
        title: "导入的剧本",
        author: "OCR Import",
        description: "通过图片识别导入的剧本",
        roles: roles
    };
};
