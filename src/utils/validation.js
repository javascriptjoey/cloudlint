import * as YAML from 'yaml';

// Enhanced YAML validation function using proper YAML parser
export function validateYAML(yamlString) {
  const errors = [];
  let suggestedFix = null;
  
  // Handle empty input
  if (!yamlString || yamlString.trim() === '') {
    return {
      ok: true,
      messages: [],
      suggestedFix: null
    };
  }
  
  try {
    // First, try to parse with the YAML library to catch syntax errors
    const doc = YAML.parseDocument(yamlString);
    
    // Check for YAML parsing errors (syntax issues like missing quotes)
    if (doc.errors && doc.errors.length > 0) {
      doc.errors.forEach(error => {
        let lineNumber = null;
        let columnNumber = null;
        let message = error.message || 'YAML syntax error';
        
        // Extract line number from error message or position
        const lineMatch = message.match(/at line (\d+)/i) || message.match(/line (\d+)/i);
        if (lineMatch) {
          lineNumber = parseInt(lineMatch[1]);
        }
        
        const columnMatch = message.match(/column (\d+)/i);
        if (columnMatch) {
          columnNumber = parseInt(columnMatch[1]);
        }
        
        // Extract from error position if available
        if (error.pos && error.pos.length > 0) {
          const pos = error.pos[0];
          if (pos.line && !lineNumber) {
            lineNumber = pos.line;
          }
          if (pos.col && !columnNumber) {
            columnNumber = pos.col;
          }
        }
        
        // Handle specific error types and provide better messages
        if (message.includes('Unexpected scalar at node end')) {
          message = 'Missing closing quote or malformed string value';
        } else if (message.includes('Implicit keys need to be on a single line')) {
          message = 'Invalid key structure - keys must be on a single line';
        } else if (message.includes('Unexpected end of stream')) {
          message = 'Incomplete YAML structure - missing closing quotes or brackets';
        }
        
        errors.push({
          message: lineNumber ? `${message} on line ${lineNumber}${columnNumber ? `, column ${columnNumber}` : ''}` : message,
          severity: 'error',
          line: lineNumber,
          column: columnNumber
        });
      });
    }
    
    // Check for warnings
    if (doc.warnings && doc.warnings.length > 0) {
      doc.warnings.forEach(warning => {
        let lineNumber = 'unknown';
        if (warning.pos && warning.pos.length > 0) {
          const pos = warning.pos[0];
          if (pos.line) {
            lineNumber = pos.line;
          }
        }
        
        errors.push({
          message: lineNumber !== 'unknown' ? `${warning.message} on line ${lineNumber}` : warning.message,
          severity: 'warning',
          line: lineNumber
        });
      });
    }
    
  } catch (parseError) {
    // Catch any other parsing errors
    let message = parseError.message || 'YAML parsing error';
    let lineNumber = 'unknown';
    
    // Try to extract line number from error message
    const lineMatch = message.match(/at line (\d+)/i);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1]);
    }
    
    // Handle common syntax errors
    if (message.includes('end of the stream or a document separator')) {
      message = 'Missing closing quote or incomplete string value';
    } else if (message.includes('found unexpected character')) {
      message = 'Invalid character found - check for missing quotes or special characters';
    }
    
    errors.push({
      message: lineNumber !== 'unknown' ? `${message} on line ${lineNumber}` : message,
      severity: 'error',
      line: lineNumber
    });
  }
  
  // Additional custom validation for style issues
  const styleErrors = validateYAMLStyle(yamlString);
  errors.push(...styleErrors);
  
  // Generate suggested fix if there are errors
  if (errors.length > 0) {
    suggestedFix = generateSuggestedFix(yamlString, errors);
  }
  
  return {
    ok: errors.filter(e => e.severity === 'error').length === 0,
    messages: errors,
    suggestedFix: suggestedFix
  };
}

// Custom style validation for indentation and formatting
function validateYAMLStyle(yamlString) {
  const lines = yamlString.split('\n');
  const errors = [];
  let expectedListIndent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const leadingSpaces = line.length - line.trimStart().length;
    const isListItem = trimmed.startsWith('- ');
    const isKeyValue = trimmed.includes(':') && !trimmed.startsWith('- ');
    
    // Check for list indentation consistency
    if (isListItem) {
      if (expectedListIndent === null) {
        expectedListIndent = leadingSpaces;
      } else if (leadingSpaces !== expectedListIndent) {
        errors.push({
          message: `Inconsistent list indentation on line ${lineNum} (expected ${expectedListIndent} spaces, got ${leadingSpaces})`,
          severity: 'error',
          line: lineNum
        });
      }
    } else if (isKeyValue) {
      // Reset list indentation when we exit a list
      expectedListIndent = null;
    }
    
    // Check for mixed indentation (tabs vs spaces)
    if (line.match(/^\t/)) {
      errors.push({
        message: `Tab character used for indentation on line ${lineNum} (use spaces instead)`,
        severity: 'error',
        line: lineNum
      });
    }
    
    // Check for odd number of spaces for indentation (YAML should use 2 or 4 spaces)
    if (leadingSpaces > 0 && leadingSpaces % 2 !== 0 && leadingSpaces !== 1) {
      errors.push({
        message: `Odd indentation on line ${lineNum} (${leadingSpaces} spaces - should be even)`,
        severity: 'warning',
        line: lineNum
      });
    }
    
    // Check for missing space after colon
    if (trimmed.includes(':') && !trimmed.includes(': ') && !trimmed.endsWith(':')) {
      if (!trimmed.includes('http://') && !trimmed.includes('https://')) {
        errors.push({
          message: `Missing space after colon on line ${lineNum}`,
          severity: 'warning',
          line: lineNum
        });
      }
    }
  }
  
  return errors;
}

// Generate suggested fixes for common YAML errors
function generateSuggestedFix(yamlString, errors) {
  let fixedYaml = yamlString;
  const lines = fixedYaml.split('\n');
  let hasChanges = false;
  
  // Sort errors by line number (descending) to avoid position shifting
  const sortedErrors = errors
    .filter(error => error.line && typeof error.line === 'number')
    .sort((a, b) => (b.line || 0) - (a.line || 0));
  
  sortedErrors.forEach(error => {
    const lineIndex = error.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const originalLine = lines[lineIndex];
      let fixedLine = originalLine;
      
      // Fix missing quotes
      if (error.message.toLowerCase().includes('missing') && error.message.toLowerCase().includes('quote')) {
        // Look for unmatched quote at the end of the line
        const quoteMatch = originalLine.match(/(.*)"([^"]*$)/);
        if (quoteMatch) {
          fixedLine = quoteMatch[1] + '"' + quoteMatch[2] + '"';
          hasChanges = true;
        }
      }
      
      // Fix tab indentation
      else if (error.message.toLowerCase().includes('tab character')) {
        fixedLine = originalLine.replace(/^\t+/, (match) => '  '.repeat(match.length));
        hasChanges = true;
      }
      
      // Fix odd indentation
      else if (error.message.toLowerCase().includes('odd indentation')) {
        const leadingSpaceMatch = originalLine.match(/^( *)(.*)/);
        if (leadingSpaceMatch) {
          const spaces = leadingSpaceMatch[1].length;
          const content = leadingSpaceMatch[2];
          // Round to nearest even number
          const evenSpaces = spaces % 2 === 0 ? spaces : spaces - 1;
          fixedLine = ' '.repeat(Math.max(0, evenSpaces)) + content;
          hasChanges = true;
        }
      }
      
      // Fix missing space after colon
      else if (error.message.toLowerCase().includes('missing space after colon')) {
        fixedLine = originalLine.replace(/:([^\s])/g, ': $1');
        hasChanges = true;
      }
      
      // Fix inconsistent list indentation
      else if (error.message.toLowerCase().includes('inconsistent list indentation')) {
        const match = error.message.match(/expected (\d+) spaces, got (\d+)/);
        if (match) {
          const expectedSpaces = parseInt(match[1]);
          const actualSpaces = parseInt(match[2]);
          const leadingSpaceMatch = originalLine.match(/^( *)(.*)/);
          if (leadingSpaceMatch) {
            const content = leadingSpaceMatch[2];
            fixedLine = ' '.repeat(expectedSpaces) + content;
            hasChanges = true;
          }
        }
      }
      
      lines[lineIndex] = fixedLine;
    }
  });
  
  if (!hasChanges) {
    return null;
  }
  
  const suggestedYaml = lines.join('\n');
  
  // Validate that the suggested fix actually works
  try {
    const testValidation = validateYAML(suggestedYaml);
    if (testValidation.ok || testValidation.messages.length < errors.length) {
      return {
        yaml: suggestedYaml,
        description: `Fixed ${errors.length} issue(s): ${errors.map(e => e.message.split(' ')[0]).join(', ')}`
      };
    }
  } catch (e) {
    // If suggested fix causes more issues, don't return it
  }
  
  return null;
}
