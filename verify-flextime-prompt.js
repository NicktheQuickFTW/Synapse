/**
 * Verify FlexTime System Prompt
 * 
 * This script checks if the FlexTime system prompt has been successfully added
 * to the prompts.js file.
 */

const fs = require('fs');
const path = require('path');

// Path to the prompts.js file
const promptsPath = path.join(__dirname, 'modules/flextime/src/prompts.js');

// Verify the existence of the system prompt
function verifySystemPrompt() {
  try {
    // Check if the file exists
    if (!fs.existsSync(promptsPath)) {
      console.error('ERROR: prompts.js file does not exist at', promptsPath);
      return false;
    }
    
    // Read the file content
    const content = fs.readFileSync(promptsPath, 'utf8');
    
    // Check for the presence of the system prompt
    const hasSystemPrompt = content.includes('FlexTime – Dynamic Scheduling Optimization');
    if (hasSystemPrompt) {
      console.log('SUCCESS: FlexTime system prompt found in prompts.js');
    } else {
      console.error('ERROR: FlexTime system prompt not found in prompts.js');
    }
    
    // Check for the flexTime export
    const hasExport = content.includes('flexTime: flexTimePrompt');
    if (hasExport) {
      console.log('SUCCESS: FlexTime prompt properly exported');
    } else {
      console.error('ERROR: FlexTime prompt export not found');
    }
    
    return hasSystemPrompt && hasExport;
  } catch (error) {
    console.error('Error verifying system prompt:', error.message);
    return false;
  }
}

// Main execution
console.log('==== VERIFYING FLEXTIME SYSTEM PROMPT ====\n');
const result = verifySystemPrompt();
console.log('\n==== VERIFICATION COMPLETE ====');
console.log(`Overall result: ${result ? 'SUCCESS' : 'FAILURE'}`);

// Exit with appropriate code
process.exit(result ? 0 : 1); 