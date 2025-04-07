/**
 * FlexTime Test Script
 * 
 * This script tests the FlexTime module functionality, particularly the integration
 * of the new system prompt for enhanced scheduling capabilities.
 */

const flextime = require('../modules/flextime');
const fs = require('fs');
const path = require('path');

/**
 * Simple test to verify the FlexTime system prompt exists
 */
function testSystemPrompt() {
  try {
    const promptsPath = path.join(__dirname, 'modules/flextime/src/prompts.js');
    const promptsContent = fs.readFileSync(promptsPath, 'utf8');
    
    const hasFlexTimePrompt = promptsContent.includes('FlexTime – Dynamic Scheduling Optimization');
    
    console.log('System Prompt Test:', hasFlexTimePrompt ? 'PASSED' : 'FAILED');
    return hasFlexTimePrompt;
  } catch (error) {
    console.error('Error testing system prompt:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('==== TESTING FLEXTIME MODULE WITH NEW SYSTEM PROMPT ====\n');
  
  const systemPromptResult = testSystemPrompt();
  
  console.log('\n==== FLEXTIME TESTS COMPLETED ====');
  
  return systemPromptResult;
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 