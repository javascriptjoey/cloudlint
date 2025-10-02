// Test validation logic
const testYAML = `fruits:
  - apple
   - banana
  - orange`;

// Enhanced YAML validation function (copied from dev-server.js)
function validateYAML(yamlString) {
  const lines = yamlString.split('\n')
  const errors = []
  
  // Track indentation levels for lists and objects
  const indentStack = []
  let expectedListIndent = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const leadingSpaces = line.length - line.trimStart().length
    const isListItem = trimmed.startsWith('- ')
    const isKeyValue = trimmed.includes(':') && !trimmed.startsWith('- ')
    
    // Check for list indentation consistency
    if (isListItem) {
      if (expectedListIndent === null) {
        expectedListIndent = leadingSpaces
      } else if (leadingSpaces !== expectedListIndent) {
        errors.push({
          message: `Inconsistent list indentation on line ${lineNum} (expected ${expectedListIndent} spaces, got ${leadingSpaces})`,
          severity: 'error'
        })
      }
    } else if (isKeyValue) {
      // Reset list indentation when we exit a list
      expectedListIndent = null
    }
    
    // Check for mixed indentation (tabs vs spaces)
    if (line.match(/^\t/)) {
      errors.push({
        message: `Tab character used for indentation on line ${lineNum} (use spaces instead)`,
        severity: 'error'
      })
    }
    
    // Check for odd number of spaces for indentation (YAML should use 2 or 4 spaces)
    if (leadingSpaces > 0 && leadingSpaces % 2 !== 0 && leadingSpaces !== 1) {
      errors.push({
        message: `Odd indentation on line ${lineNum} (${leadingSpaces} spaces - should be even)`,
        severity: 'warning'
      })
    }
    
    // Check for missing space after colon
    if (trimmed.includes(':') && !trimmed.includes(': ') && !trimmed.endsWith(':')) {
      if (!trimmed.includes('http://') && !trimmed.includes('https://')) {
        errors.push({
          message: `Missing space after colon on line ${lineNum}`,
          severity: 'warning'
        })
      }
    }
  }
  
  return {
    ok: errors.filter(e => e.severity === 'error').length === 0,
    messages: errors
  }
}

console.log('Testing YAML validation with problematic input:')
console.log('Input YAML:')
console.log(testYAML)
console.log('\nValidation result:')
const result = validateYAML(testYAML)
console.log(JSON.stringify(result, null, 2))

// Test with properly formatted YAML
const correctYAML = `fruits:
  - apple
  - banana
  - orange`;

console.log('\n\nTesting with correct YAML:')
console.log('Input YAML:')
console.log(correctYAML)
console.log('\nValidation result:')
const correctResult = validateYAML(correctYAML)
console.log(JSON.stringify(correctResult, null, 2))