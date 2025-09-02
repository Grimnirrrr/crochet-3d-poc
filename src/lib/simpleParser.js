export function parsePattern(text) {
  console.log('Parsing pattern:', text);
  
  const lines = text.split('\n').filter(line => line.trim());
  const rounds = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines or comments
    if (!line || line.startsWith('//')) continue;
    
    // Extract all numbers from the line
    const numbers = line.match(/\d+/g)?.map(Number) || [];
    
    // Determine stitch count
    let stitchCount = 0;
    let roundNumber = i + 1;
    
    // Check for round number explicitly stated
    if (line.toLowerCase().includes('round') && numbers.length > 0) {
      roundNumber = numbers[0];
      numbers.shift(); // Remove round number from array
    }
    
    // Pattern detection
    if (line.toLowerCase().includes('mr') || line.toLowerCase().includes('magic ring')) {
      // Magic ring - first number is stitch count
      stitchCount = numbers[0] || 6;
    } 
    else if (line.includes('inc') && line.includes('each')) {
      // "inc in each" or "2 sc in each" - doubles previous round
      const prevCount = rounds[rounds.length - 1]?.stitches || 6;
      stitchCount = prevCount * 2;
    }
    else if (line.includes('inc')) {
      // Has increases - look for final count in parentheses
      // E.g., "[sc, inc] x6 (18)" - take the 18
      const parenMatch = line.match(/\((\d+)\)/);
      if (parenMatch) {
        stitchCount = parseInt(parenMatch[1]);
      } else {
        // Estimate based on previous round + 6
        const prevCount = rounds[rounds.length - 1]?.stitches || 0;
        stitchCount = prevCount + 6;
      }
    }
    else if (line.includes('dec')) {
      // Has decreases - look for final count
      const parenMatch = line.match(/\((\d+)\)/);
      if (parenMatch) {
        stitchCount = parseInt(parenMatch[1]);
      } else {
        // Estimate decrease by 6
        const prevCount = rounds[rounds.length - 1]?.stitches || 12;
        stitchCount = Math.max(6, prevCount - 6);
      }
    }
    else {
      // Default: take the last/largest number as stitch count
      stitchCount = numbers[numbers.length - 1] || 6;
    }
    
    // Detect if this round has increases or decreases
    const hasIncrease = line.toLowerCase().includes('inc');
    const hasDecrease = line.toLowerCase().includes('dec');
    
    rounds.push({
      round: roundNumber,
      stitches: stitchCount,
      instruction: line,
      hasIncrease,
      hasDecrease,
      original: line
    });
    
    console.log(`Parsed Round ${roundNumber}: ${stitchCount} stitches`);
  }
  
  return rounds;
}

/**
 * Validate parsed pattern
 */
export function validatePattern(rounds) {
  const errors = [];
  const warnings = [];
  
  if (!rounds || rounds.length === 0) {
    errors.push('No valid rounds found in pattern');
    return { valid: false, errors, warnings };
  }
  
  // Check first round
  if (rounds[0].stitches < 3) {
    errors.push('First round should have at least 3 stitches');
  }
  
  // Check for logical progression
  for (let i = 1; i < rounds.length; i++) {
    const curr = rounds[i];
    const prev = rounds[i - 1];
    
    // Check for impossible jumps
    if (curr.stitches > prev.stitches * 3) {
      warnings.push(`Round ${curr.round}: Large increase from ${prev.stitches} to ${curr.stitches} stitches`);
    }
    
    if (curr.stitches < prev.stitches * 0.3) {
      warnings.push(`Round ${curr.round}: Large decrease from ${prev.stitches} to ${curr.stitches} stitches`);
    }
  }
  
  // Check for maximum stitches (performance)
  const maxStitches = rounds[rounds.length - 1].stitches;
  if (maxStitches > 500) {
    warnings.push(`Pattern has ${maxStitches} stitches - may impact performance`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Common pattern templates for testing
 */
export const patternTemplates = {
  sphere: `Round 1: 6 sc in magic ring
Round 2: 2 sc in each (12)
Round 3: [sc, inc] x6 (18)
Round 4: [2 sc, inc] x6 (24)
Round 5: [3 sc, inc] x6 (30)
Round 6: [4 sc, inc] x6 (36)`,
  
  cone: `Round 1: 6 sc in MR
Round 2: inc x6 (12)
Round 3: (sc, inc) x6 (18)
Round 4-8: sc in each (18)`,
  
  simple: `6 sc in magic ring
12
18
24
30`,
  
  withDecrease: `Round 1: 6 sc in MR
Round 2: inc in each (12)
Round 3: (sc, inc) x6 (18)
Round 4: (2sc, inc) x6 (24)
Round 5: (2sc, dec) x6 (18)
Round 6: (sc, dec) x6 (12)
Round 7: dec x6 (6)`
};