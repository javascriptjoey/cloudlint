import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// Simple YAML validation function
function validateYAML(yamlString) {
  const lines = yamlString.split('\n')
  const errors = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1
    
    // Check for indentation issues
    if (line.trim() && !line.startsWith('#')) {
      const leadingSpaces = line.length - line.trimLeft().length
      const nextLine = lines[i + 1]
      
      // Detect badly indented list items
      if (line.includes('- ') && leadingSpaces > 0 && !line.trimLeft().startsWith('- ')) {
        errors.push({
          message: `Indentation error on line ${lineNum}`,
          severity: 'error'
        })
      }
      
      // Detect missing colon for key-value pairs
      if (line.includes(':') && !line.includes(': ') && !line.endsWith(':')) {
        if (!line.includes('http://') && !line.includes('https://')) {
          errors.push({
            message: `Missing space after colon on line ${lineNum}`,
            severity: 'warning'
          })
        }
      }
      
      // Detect inconsistent list formatting
      if (line.trimLeft().startsWith('- ')) {
        inList = true
      } else if (inList && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
        if (!line.includes(':')) {
          errors.push({
            message: `Inconsistent list formatting on line ${lineNum}`,
            severity: 'warning'
          })
        }
        inList = false
      }
    }
  }
  
  return {
    ok: errors.filter(e => e.severity === 'error').length === 0,
    messages: errors
  }
}

app.post('/validate', (req, res) => {
  const { yaml } = req.body || {}
  console.log(`[dev-server] Validating YAML (${yaml?.length || 0} chars)`)
  
  if (!yaml || yaml.trim() === '') {
    return res.json({ ok: true, messages: [] })
  }
  
  try {
    const result = validateYAML(yaml)
    console.log(`[dev-server] Result: ${result.ok ? 'OK' : 'ERRORS'}, ${result.messages.length} messages`)
    res.json(result)
  } catch (error) {
    console.error('[dev-server] Validation error:', error)
    res.json({ 
      ok: false, 
      messages: [{ message: 'Internal validation error', severity: 'error' }] 
    })
  }
})

app.post('/suggest', (req, res) => {
  res.json({ provider: 'Generic' })
})

app.post('/convert', (req, res) => {
  const { yaml } = req.body || {}
  try {
    // Simple conversion - just parse as basic object
    const lines = yaml?.split('\n') || []
    const obj = {}
    
    lines.forEach(line => {
      if (line.includes(': ')) {
        const [key, value] = line.split(': ', 2)
        obj[key.trim()] = value.trim()
      }
    })
    
    res.json({ json: JSON.stringify(obj, null, 2) })
  } catch (error) {
    res.status(400).json({ error: 'Failed to convert YAML' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[dev-server] Simple validation server running on port ${PORT}`)
  console.log(`[dev-server] This is a development server for UI testing only`)
})