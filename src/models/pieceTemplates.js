// src/models/pieceTemplates.js

import { CrochetPiece } from '../types/assemblyModels';

/**
 * D1: Piece Abstraction - Modular Templates
 * Defines standard crochet pieces with connection points
 */

// Connection point type standards
export const CONNECTION_TYPES = {
  NECK: 'neck',
  SHOULDER: 'shoulder',
  HIP: 'hip',
  WRIST: 'wrist',
  ANKLE: 'ankle',
  TOP: 'top',
  BOTTOM: 'bottom',
  SIDE: 'side',
  JOINT: 'joint',
  UNIVERSAL: 'universal'
};

// Standard sizes for compatibility
export const PIECE_SIZES = {
  TINY: 1,    // Accessories
  SMALL: 2,   // Hands, feet
  MEDIUM: 3,  // Arms, legs
  LARGE: 4,   // Body, head
  XLARGE: 5   // Special pieces
};

/**
 * Base template for creating pieces
 */
class PieceTemplate {
  constructor(config) {
    this.name = config.name;
    this.type = config.type;
    this.size = config.size || PIECE_SIZES.MEDIUM;
    this.defaultColor = config.defaultColor || '#fbbf24';
    this.connectionPoints = config.connectionPoints || [];
    this.pattern = config.pattern || [];
    this.tier = config.tier || 'freemium';
    this.isCustom = config.isCustom || false;
  }

  /**
   * Create a piece instance from this template
   */
  createPiece(options = {}) {
    const piece = new CrochetPiece({
      name: options.name || this.name,
      type: this.type,
      color: options.color || this.defaultColor,
      isCustom: this.isCustom,
      rounds: this.generatePattern(options.size || this.size),
      stitchCount: this.calculateStitches(),
      roundCount: this.pattern.length
    });

    // Add connection points
    this.connectionPoints.forEach(cp => {
      piece.addConnectionPoint(
        cp.name,
        cp.position,
        cp.compatible
      );
    });

    return piece;
  }

  /**
   * Generate pattern based on size
   */
  generatePattern(size) {
    // Scale pattern based on size
    const scaleFactor = size / PIECE_SIZES.MEDIUM;
    return this.pattern.map(round => ({
      ...round,
      stitches: Math.round(round.stitches * scaleFactor)
    }));
  }

  /**
   * Calculate total stitches
   */
  calculateStitches() {
    return this.pattern.reduce((sum, round) => sum + round.stitches, 0);
  }
}

/**
 * PIECE TEMPLATES LIBRARY
 */

// HEAD TEMPLATE
export const HEAD_TEMPLATE = new PieceTemplate({
  name: 'Basic Head',
  type: 'head',
  size: PIECE_SIZES.LARGE,
  defaultColor: '#fde68a',
  connectionPoints: [
    {
      name: 'neck',
      position: { x: 0, y: -1, z: 0 },
      compatible: [CONNECTION_TYPES.NECK, CONNECTION_TYPES.TOP]
    },
    {
      name: 'hat_point',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.BOTTOM, 'hat']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 12, instruction: '(inc) x6' },
    { round: 3, stitches: 18, instruction: '(sc, inc) x6' },
    { round: 4, stitches: 24, instruction: '(2sc, inc) x6' },
    { round: 5, stitches: 30, instruction: '(3sc, inc) x6' },
    { round: 6, stitches: 36, instruction: '(4sc, inc) x6' },
    { round: 7, stitches: 36, instruction: 'sc around' },
    { round: 8, stitches: 36, instruction: 'sc around' },
    { round: 9, stitches: 36, instruction: 'sc around' },
    { round: 10, stitches: 30, instruction: '(3sc, dec) x6' },
    { round: 11, stitches: 24, instruction: '(2sc, dec) x6' },
    { round: 12, stitches: 18, instruction: '(sc, dec) x6' }
  ],
  tier: 'freemium'
});

// BODY TEMPLATE
export const BODY_TEMPLATE = new PieceTemplate({
  name: 'Basic Body',
  type: 'body',
  size: PIECE_SIZES.LARGE,
  defaultColor: '#60a5fa',
  connectionPoints: [
    {
      name: 'neck_joint',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.NECK, CONNECTION_TYPES.BOTTOM]
    },
    {
      name: 'left_shoulder',
      position: { x: -0.8, y: 0.7, z: 0 },
      compatible: [CONNECTION_TYPES.SHOULDER, CONNECTION_TYPES.JOINT]
    },
    {
      name: 'right_shoulder',
      position: { x: 0.8, y: 0.7, z: 0 },
      compatible: [CONNECTION_TYPES.SHOULDER, CONNECTION_TYPES.JOINT]
    },
    {
      name: 'left_hip',
      position: { x: -0.5, y: -0.8, z: 0 },
      compatible: [CONNECTION_TYPES.HIP, CONNECTION_TYPES.JOINT]
    },
    {
      name: 'right_hip',
      position: { x: 0.5, y: -0.8, z: 0 },
      compatible: [CONNECTION_TYPES.HIP, CONNECTION_TYPES.JOINT]
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 12, instruction: '(inc) x6' },
    { round: 3, stitches: 18, instruction: '(sc, inc) x6' },
    { round: 4, stitches: 24, instruction: '(2sc, inc) x6' },
    { round: 5, stitches: 30, instruction: '(3sc, inc) x6' },
    { round: 6, stitches: 30, instruction: 'sc around' },
    { round: 7, stitches: 30, instruction: 'sc around' },
    { round: 8, stitches: 30, instruction: 'sc around' },
    { round: 9, stitches: 30, instruction: 'sc around' },
    { round: 10, stitches: 24, instruction: '(3sc, dec) x6' },
    { round: 11, stitches: 18, instruction: '(sc, dec) x6' },
    { round: 12, stitches: 12, instruction: '(dec) x6' }
  ],
  tier: 'freemium'
});

// ARM TEMPLATE
export const ARM_TEMPLATE = new PieceTemplate({
  name: 'Basic Arm',
  type: 'arm',
  size: PIECE_SIZES.MEDIUM,
  defaultColor: '#fde68a',
  connectionPoints: [
    {
      name: 'shoulder_joint',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.SHOULDER, CONNECTION_TYPES.JOINT]
    },
    {
      name: 'wrist',
      position: { x: 0, y: -1, z: 0 },
      compatible: [CONNECTION_TYPES.WRIST, CONNECTION_TYPES.JOINT, 'hand']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 9, instruction: '(sc, inc) x3' },
    { round: 3, stitches: 9, instruction: 'sc around' },
    { round: 4, stitches: 9, instruction: 'sc around' },
    { round: 5, stitches: 9, instruction: 'sc around' },
    { round: 6, stitches: 9, instruction: 'sc around' },
    { round: 7, stitches: 9, instruction: 'sc around' },
    { round: 8, stitches: 9, instruction: 'sc around' }
  ],
  tier: 'freemium'
});

// LEG TEMPLATE
export const LEG_TEMPLATE = new PieceTemplate({
  name: 'Basic Leg',
  type: 'leg',
  size: PIECE_SIZES.MEDIUM,
  defaultColor: '#3b82f6',
  connectionPoints: [
    {
      name: 'hip_joint',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.HIP, CONNECTION_TYPES.JOINT]
    },
    {
      name: 'ankle',
      position: { x: 0, y: -1, z: 0 },
      compatible: [CONNECTION_TYPES.ANKLE, CONNECTION_TYPES.JOINT, 'foot']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 12, instruction: '(inc) x6' },
    { round: 3, stitches: 12, instruction: 'sc around' },
    { round: 4, stitches: 12, instruction: 'sc around' },
    { round: 5, stitches: 12, instruction: 'sc around' },
    { round: 6, stitches: 12, instruction: 'sc around' },
    { round: 7, stitches: 12, instruction: 'sc around' },
    { round: 8, stitches: 12, instruction: 'sc around' },
    { round: 9, stitches: 12, instruction: 'sc around' },
    { round: 10, stitches: 12, instruction: 'sc around' }
  ],
  tier: 'freemium'
});

// HAND TEMPLATE (Pro tier)
export const HAND_TEMPLATE = new PieceTemplate({
  name: 'Basic Hand',
  type: 'hand',
  size: PIECE_SIZES.SMALL,
  defaultColor: '#fde68a',
  connectionPoints: [
    {
      name: 'wrist_joint',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.WRIST, 'arm']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 6, instruction: 'sc around' },
    { round: 3, stitches: 6, instruction: 'sc around' },
    { round: 4, stitches: 6, instruction: 'sc around' }
  ],
  tier: 'pro'
});

// FOOT TEMPLATE (Pro tier)
export const FOOT_TEMPLATE = new PieceTemplate({
  name: 'Basic Foot',
  type: 'foot',
  size: PIECE_SIZES.SMALL,
  defaultColor: '#1f2937',
  connectionPoints: [
    {
      name: 'ankle_joint',
      position: { x: 0, y: 1, z: 0 },
      compatible: [CONNECTION_TYPES.ANKLE, 'leg']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 8, instruction: 'sc, inc, sc, inc, sc, inc, sc, inc' },
    { round: 3, stitches: 8, instruction: 'sc around' },
    { round: 4, stitches: 8, instruction: 'sc around' },
    { round: 5, stitches: 8, instruction: 'sc around' }
  ],
  tier: 'pro'
});

// HAT TEMPLATE (Pro tier accessory)
export const HAT_TEMPLATE = new PieceTemplate({
  name: 'Basic Hat',
  type: 'accessory',
  size: PIECE_SIZES.MEDIUM,
  defaultColor: '#dc2626',
  connectionPoints: [
    {
      name: 'head_attachment',
      position: { x: 0, y: -1, z: 0 },
      compatible: ['hat_point', CONNECTION_TYPES.TOP]
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 12, instruction: '(inc) x6' },
    { round: 3, stitches: 18, instruction: '(sc, inc) x6' },
    { round: 4, stitches: 24, instruction: '(2sc, inc) x6' },
    { round: 5, stitches: 30, instruction: '(3sc, inc) x6' },
    { round: 6, stitches: 36, instruction: '(4sc, inc) x6' },
    { round: 7, stitches: 36, instruction: 'sc around (brim)' }
  ],
  tier: 'pro',
  isCustom: true
});

// TAIL TEMPLATE (Studio tier)
export const TAIL_TEMPLATE = new PieceTemplate({
  name: 'Animal Tail',
  type: 'accessory',
  size: PIECE_SIZES.MEDIUM,
  defaultColor: '#a78bfa',
  connectionPoints: [
    {
      name: 'body_attachment',
      position: { x: 0, y: 0, z: -1 },
      compatible: [CONNECTION_TYPES.BOTTOM, 'body']
    }
  ],
  pattern: [
    { round: 1, stitches: 6, instruction: 'MR 6sc' },
    { round: 2, stitches: 6, instruction: 'sc around' },
    { round: 3, stitches: 6, instruction: 'sc around' },
    { round: 4, stitches: 6, instruction: 'sc around' },
    { round: 5, stitches: 6, instruction: 'sc around' },
    { round: 6, stitches: 4, instruction: '(dec) x2' }
  ],
  tier: 'studio',
  isCustom: true
});

/**
 * Template library with tier information
 */
export const PIECE_LIBRARY = {
  // Freemium pieces (basic set)
  freemium: [
    HEAD_TEMPLATE,
    BODY_TEMPLATE,
    ARM_TEMPLATE,
    LEG_TEMPLATE
  ],
  
  // Pro pieces (extended set)
  pro: [
    HAND_TEMPLATE,
    FOOT_TEMPLATE,
    HAT_TEMPLATE
  ],
  
  // Studio pieces (full access)
  studio: [
    TAIL_TEMPLATE
    // Add more specialty pieces here
  ]
};

/**
 * Get available templates for a tier
 */
export function getAvailableTemplates(tier) {
  const templates = [...PIECE_LIBRARY.freemium];
  
  if (tier === 'pro' || tier === 'studio') {
    templates.push(...PIECE_LIBRARY.pro);
  }
  
  if (tier === 'studio') {
    templates.push(...PIECE_LIBRARY.studio);
  }
  
  return templates;
}

/**
 * Create a complete figure from templates
 */
export function createBasicFigure(options = {}) {
  const figure = {
    head: HEAD_TEMPLATE.createPiece({ color: options.headColor }),
    body: BODY_TEMPLATE.createPiece({ color: options.bodyColor }),
    leftArm: ARM_TEMPLATE.createPiece({ name: 'Left Arm' }),
    rightArm: ARM_TEMPLATE.createPiece({ name: 'Right Arm' }),
    leftLeg: LEG_TEMPLATE.createPiece({ name: 'Left Leg' }),
    rightLeg: LEG_TEMPLATE.createPiece({ name: 'Right Leg' })
  };
  
  return figure;
}

/**
 * Generate custom piece from pattern
 */
export function createCustomPiece(pattern, options = {}) {
  const template = new PieceTemplate({
    name: options.name || 'Custom Piece',
    type: 'custom',
    size: options.size || PIECE_SIZES.MEDIUM,
    defaultColor: options.color || '#9333ea',
    connectionPoints: options.connectionPoints || [
      {
        name: 'universal',
        position: { x: 0, y: 0, z: 0 },
        compatible: [CONNECTION_TYPES.UNIVERSAL]
      }
    ],
    pattern: pattern,
    tier: options.tier || 'pro',
    isCustom: true
  });
  
  return template.createPiece(options);
}
