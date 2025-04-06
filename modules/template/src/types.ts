/**
 * Interface all XII-OS modules must implement
 */
export interface ModuleInterface {
  /**
   * Initialize the module
   * @returns A promise that resolves to a boolean indicating success
   */
  initialize(): Promise<boolean>;
  
  /**
   * Execute the module with provided parameters
   * @param params Input parameters for the module
   * @returns A promise that resolves to the execution result
   */
  execute(params?: Record<string, any>): Promise<any>;
  
  /**
   * Shutdown the module and perform cleanup
   * @returns A promise that resolves to a boolean indicating success
   */
  shutdown(): Promise<boolean>;
  
  /**
   * Get information about the module
   * @returns An object containing module metadata
   */
  getInfo(): Record<string, any>;
} 