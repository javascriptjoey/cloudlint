import express from 'express'
import cors from 'cors'
import { validateYAML } from './src/utils/validation.js'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/validate', (req, res) => {
  const { yaml } = req.body || {}
  console.log(`[dev-server] Validating YAML (${yaml?.length || 0} chars)`)
  
  if (!yaml || yaml.trim() === '') {
    return res.json({ ok: true, messages: [], suggestedFix: null })
  }
  
  try {
    const result = validateYAML(yaml)
    console.log(`[dev-server] Result: ${result.ok ? 'OK' : 'ERRORS'}, ${result.messages.length} messages, Fix: ${result.suggestedFix ? 'Available' : 'None'}`)
    
    // Return complete result including suggested fix
    const response = {
      ok: result.ok,
      messages: result.messages,
      suggestedFix: result.suggestedFix || null
    }
    
    res.json(response)
  } catch (error) {
    console.error('[dev-server] Validation error:', error)
    res.json({ 
      ok: false, 
      messages: [{ message: 'Internal validation error', severity: 'error' }],
      suggestedFix: null
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