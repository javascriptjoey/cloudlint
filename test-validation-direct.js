// Test the validation function directly
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
    
    console.log(`Line ${lineNum}: "${line}" | Leading spaces: ${leadingSpaces} | Is list: ${isListItem}`)
    
    // Check for list indentation consistency
    if (isListItem) {
      if (expectedListIndent === null) {
        expectedListIndent = leadingSpaces
        console.log(`Setting expected list indent to: ${expectedListIndent}`)
      } else if (leadingSpaces !== expectedListIndent) {
        console.log(`FOUND ERROR: Expected ${expectedListIndent}, got ${leadingSpaces}`)
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

// Test with the problematic YAML
const testYaml = `fruits:
  - apple
   - banana
  - orange`

console.log('Testing YAML validation with:')
console.log(testYaml)
console.log('\n--- Validation Process ---')

const result = validateYAML(testYaml)

console.log('\n--- Final Result ---')
console.log('OK:', result.ok)
console.log('Messages:', result.messages)