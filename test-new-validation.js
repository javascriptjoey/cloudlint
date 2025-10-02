import { validateYAML } from './src/utils/validation.js';

console.log('Testing New YAML Validation Logic\n');

// Test 1: Missing quote (the reported issue)
console.log('=== Test 1: Missing Quote ===');
const missingQuoteYaml = `user:
  name: "Alice
  email: "alice@example.com"`;

const result1 = validateYAML(missingQuoteYaml);
console.log('YAML:', missingQuoteYaml);
console.log('Result:', result1.ok ? 'PASS' : 'FAIL');
console.log('Messages:', result1.messages);
if (result1.suggestedFix) {
  console.log('Suggested Fix:');
  console.log(result1.suggestedFix.yaml);
  console.log('Description:', result1.suggestedFix.description);
}
console.log();

// Test 2: Original banana indentation issue
console.log('=== Test 2: Banana Indentation ===');
const bananaYaml = `fruits:
  - apple
   - banana
  - orange`;

const result2 = validateYAML(bananaYaml);
console.log('YAML:', bananaYaml);
console.log('Result:', result2.ok ? 'PASS' : 'FAIL');
console.log('Messages:', result2.messages);
console.log();

// Test 3: Valid YAML
console.log('=== Test 3: Valid YAML ===');
const validYaml = `user:
  name: "Alice"
  email: "alice@example.com"
  hobbies:
    - reading
    - coding`;

const result3 = validateYAML(validYaml);
console.log('YAML:', validYaml);
console.log('Result:', result3.ok ? 'PASS' : 'FAIL');
console.log('Messages:', result3.messages);
console.log();

// Test 4: Multiple syntax errors
console.log('=== Test 4: Multiple Errors ===');
const multiErrorYaml = `config:
  host: "localhost
	port: 3000
   ssl:enabled`;

const result4 = validateYAML(multiErrorYaml);
console.log('YAML:', multiErrorYaml);
console.log('Result:', result4.ok ? 'PASS' : 'FAIL');
console.log('Messages:', result4.messages);
console.log();

// Test 5: Empty YAML
console.log('=== Test 5: Empty YAML ===');
const emptyYaml = '';

const result5 = validateYAML(emptyYaml);
console.log('YAML: (empty)');
console.log('Result:', result5.ok ? 'PASS' : 'FAIL');
console.log('Messages:', result5.messages);
console.log();

console.log('Testing Complete!');