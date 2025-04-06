/**
 * XII-OS Core Database Module
 * 
 * Provides a robust database interface for XII-OS applications
 */

export * from './pool';
export * from './client';
export * from './types';
export * from './errors';

// Default export with version information
export default {
  version: '1.0.0',
  description: 'Core database module for XII-OS'
}; 