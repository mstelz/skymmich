
// Plate solving machine tags include individual star names which are too noisy for many uses.
// Only keep catalog objects (M/NGC/IC/Abell/Sh2/LDN/LBN), user-created tags, and known categories.
export const CATALOG_PATTERN = /^(M\s?\d|NGC\s?\d|IC\s?\d|Abell\s?\d|Sh2-|LDN\s?\d|LBN\s?\d|Barnard|Cr\s?\d|Mel\s?\d|PGC\s?\d|UGC\s?\d|Ced\s?\d|vdB\s?\d)/i;
export const STAR_PATTERN = /^The star\b/i;

/**
 * Filter image tags to only include meaningful ones.
 * Excludes individual star names from plate solving.
 * Keeps: catalog objects (NGC/IC/M/etc), 'astrophotography', named nebulae/objects.
 */
export function filterRelevantTags(tags: string[]): string[] {
  return tags.filter(tag => {
    // Always exclude star names from plate solving
    if (STAR_PATTERN.test(tag)) return false;
    
    // Exclude fragments from badly-split names (e.g. "25 Tau)")
    if (/^\d+\s+\w{2,4}\)$/.test(tag)) return false;
    
    // Keep catalog objects
    if (CATALOG_PATTERN.test(tag)) return true;
    
    // Keep 'astrophotography' and other short user tags
    if (tag === 'astrophotography') return true;
    
    // Keep named nebulae/objects (contain "Nebula", "Cluster", "Galaxy", etc.)
    if (/nebula|cluster|galaxy|supernova|remnant/i.test(tag)) return true;
    
    // Keep anything that's not from plate solving (short, no parentheses with star designations)
    // If it looks like a star designation with parenthesized catalog number, skip it
    if (/\(\d+\s+\w{2,4}\)/.test(tag) || /\([\u03b1-\u03c9η]\s+\w{2,4}/.test(tag)) return false;
    
    return true;
  });
}
