/**
 * Normalizes Arabic names to handle common spelling variations (e.g., Alif, Ya, Ta Marbuta)
 */
export const normalizeArabic = (text) => {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/[ىي]/g, "ي")
        .replace(/\s+/g, " ")
        .trim();
};
