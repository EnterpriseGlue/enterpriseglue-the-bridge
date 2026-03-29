/**
 * Infrastructure Layer
 * 
 * External adapters and implementations.
 * 
 * Import Rule: Can import from domain/, application/, and external libraries.
 * Never import from interfaces/.
 * 
 * Note: During migration, infrastructure modules are re-exported from
 * their legacy locations. Full migration to this structure will happen
 * incrementally to avoid breaking changes.
 */

// Domain types available for infrastructure implementations
export type * from '../domain/index.js';
