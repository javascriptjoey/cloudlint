// Test fixtures for YAML validation edge cases
export const validYamlCases = [
  {
    name: 'Simple key-value pairs',
    yaml: `name: John Doe
age: 30
city: New York`,
    description: 'Basic valid YAML with consistent formatting'
  },
  {
    name: 'Properly indented list',
    yaml: `fruits:
  - apple
  - banana
  - orange`,
    description: 'List with consistent 2-space indentation'
  },
  {
    name: 'Nested objects with lists',
    yaml: `users:
  - name: John
    age: 30
    hobbies:
      - reading
      - coding
  - name: Jane
    age: 25
    hobbies:
      - painting
      - music`,
    description: 'Complex nested structure with consistent indentation'
  },
  {
    name: 'Empty values and comments',
    yaml: `# Configuration file
database:
  host: localhost
  port: 5432
  password: # Will be set via environment
  ssl: true`,
    description: 'YAML with comments and empty values'
  },
  {
    name: 'Four-space indentation',
    yaml: `config:
    database:
        host: localhost
        port: 3306
    cache:
        enabled: true
        ttl: 300`,
    description: 'Consistently using 4-space indentation'
  }
];

export const invalidYamlCases = [
  {
    name: 'Missing closing quote',
    yaml: `user:
  name: "Alice
  email: "alice@example.com"`,
    description: 'Missing closing quote on name field - should trigger syntax error',
    expectedErrors: [
      {
        type: 'syntax-error',
        message: /missing.*quote|quote.*missing|incomplete.*string/i
      }
    ]
  },
  {
    name: 'Multiple syntax errors',
    yaml: `config:
  host: "localhost
	port: 3000
   ssl:enabled`,
    description: 'Missing quote, tab character, odd indentation, missing colon space',
    expectedErrors: [
      {
        type: 'syntax-error',
        message: /missing.*quote|quote.*missing/i
      },
      {
        type: 'mixed-indentation',
        message: /tab.*character/i
      },
      {
        type: 'odd-spacing',
        message: /odd.*indentation/i
      },
      {
        type: 'missing-space',
        message: /missing.*space.*colon/i
      }
    ]
  },
  {
    name: 'Inconsistent list indentation',
    yaml: `fruits:
  - apple
   - banana
  - orange`,
    description: 'List item "banana" has 3 spaces instead of 2',
    expectedErrors: [
      {
        type: 'indentation',
        line: 3,
        message: /Inconsistent list indentation.*expected 2.*got 3/i
      },
      {
        type: 'odd-spacing',
        line: 3,
        message: /Odd indentation.*3 spaces/i
      }
    ]
  },
  {
    name: 'Mixed tab and space indentation',
    yaml: `config:
\thost: localhost
  port: 3306`,
    description: 'First property uses tab, second uses spaces',
    expectedErrors: [
      {
        type: 'mixed-indentation',
        line: 2,
        message: /Tab character used for indentation/i
      }
    ]
  },
  {
    name: 'Odd indentation (3 spaces)',
    yaml: `database:
   host: localhost
   port: 3306`,
    description: 'Using 3 spaces for indentation instead of even number',
    expectedErrors: [
      {
        type: 'odd-spacing',
        line: 2,
        message: /Odd indentation.*3 spaces/i
      },
      {
        type: 'odd-spacing',
        line: 3,
        message: /Odd indentation.*3 spaces/i
      }
    ]
  },
  {
    name: 'Missing space after colon',
    yaml: `name:John Doe
age:30
city: New York`,
    description: 'First two properties missing space after colon',
    expectedErrors: [
      {
        type: 'missing-space',
        line: 1,
        message: /Missing space after colon/i
      },
      {
        type: 'missing-space',
        line: 2,
        message: /Missing space after colon/i
      }
    ]
  },
  {
    name: 'Inconsistent nested list indentation',
    yaml: `users:
  - name: John
    hobbies:
      - reading
       - coding
      - writing`,
    description: 'Nested list has inconsistent indentation for "coding"',
    expectedErrors: [
      {
        type: 'indentation',
        line: 5,
        message: /Inconsistent list indentation.*expected 6.*got 7/i
      },
      {
        type: 'odd-spacing',
        line: 5,
        message: /Odd indentation.*7 spaces/i
      }
    ]
  },
  {
    name: 'Mixed even indentation (2 and 4 spaces)',
    yaml: `config:
  database:
      host: localhost
  cache:
    enabled: true`,
    description: 'Mixing 2-space and 4-space indentation at same level',
    expectedErrors: [
      // Note: This might not be caught by current logic but should be tested
    ]
  },
  {
    name: 'Severely malformed indentation',
    yaml: `root:
 child1:
    value1: test
      child2:
   value2: test`,
    description: 'Multiple indentation issues in one file',
    expectedErrors: [
      {
        type: 'odd-spacing',
        line: 2,
        message: /Odd indentation.*1 spaces/i
      },
      {
        type: 'odd-spacing',
        line: 5,
        message: /Odd indentation.*3 spaces/i
      }
    ]
  }
];

export const edgeCases = [
  {
    name: 'Empty YAML',
    yaml: '',
    description: 'Completely empty input',
    shouldPass: true
  },
  {
    name: 'Only whitespace',
    yaml: '   \n  \t  \n   ',
    description: 'Only whitespace and newlines',
    shouldPass: true
  },
  {
    name: 'Only comments',
    yaml: `# This is a comment
# Another comment
  # Indented comment`,
    description: 'File with only comments',
    shouldPass: true
  },
  {
    name: 'URLs with colons (should not trigger missing space error)',
    yaml: `website: https://example.com
api: http://localhost:3000/api`,
    description: 'URLs containing colons should not trigger colon space errors',
    shouldPass: true
  },
  {
    name: 'Very long lines',
    yaml: `description: This is a very long description that might cause issues if the validation logic has problems with long strings or lines that exceed certain character limits`,
    description: 'Testing with long content',
    shouldPass: true
  },
  {
    name: 'Single space indentation (edge case)',
    yaml: `root:
 child: value`,
    description: 'Using single space indentation',
    expectedErrors: [
      {
        type: 'odd-spacing',
        line: 2,
        message: /Odd indentation.*1 spaces/i
      }
    ]
  }
];

// Helper function to get all test cases
export function getAllTestCases() {
  return {
    valid: validYamlCases,
    invalid: invalidYamlCases,
    edge: edgeCases
  };
}

// Helper function to get specific test case by name
export function getTestCase(name) {
  const allCases = [...validYamlCases, ...invalidYamlCases, ...edgeCases];
  return allCases.find(testCase => testCase.name === name);
}

// Helper function to generate test case for specific indentation error
export function createIndentationErrorCase(baseIndent, errorIndent, description = '') {
  return {
    name: `Custom indentation error: ${baseIndent} vs ${errorIndent}`,
    yaml: `items:
${' '.repeat(baseIndent)}- first
${' '.repeat(errorIndent)}- second
${' '.repeat(baseIndent)}- third`,
    description: description || `List with ${baseIndent} and ${errorIndent} space indentation`,
    expectedErrors: [
      {
        type: 'indentation',
        line: 3,
        message: new RegExp(`expected ${baseIndent}.*got ${errorIndent}`, 'i')
      }
    ]
  };
}