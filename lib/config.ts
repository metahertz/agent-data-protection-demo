import fs from 'fs'
import path from 'path'

interface AppConfig {
  mcpServerUrl: string
  systemPromptMode: 'unsafe' | 'safe'
  debugMode: boolean
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'app-config.json')

const DEFAULT_CONFIG: AppConfig = {
  // MCP_SERVER_URL env var takes precedence (set automatically by docker-compose)
  mcpServerUrl: process.env.MCP_SERVER_URL ?? 'http://chat-server-example-mcp-1:3100/sse',
  systemPromptMode: 'unsafe',
  debugMode: false,
}

export function getAppConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const saved = JSON.parse(raw) as Partial<AppConfig>
      // Saved config file wins — env var is only the initial default
      return { ...DEFAULT_CONFIG, ...saved }
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG
}

export function saveAppConfig(partial: Partial<AppConfig>): void {
  const current = getAppConfig()
  const updated = { ...current, ...partial }
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2))
}
