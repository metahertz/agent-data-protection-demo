import { NextRequest, NextResponse } from 'next/server'
import { getAppConfig, saveAppConfig } from '@/lib/config'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const config = getAppConfig()
  return NextResponse.json({
    mcpServerUrl: config.mcpServerUrl,
    systemPromptMode: config.systemPromptMode,
    debugMode: config.debugMode,
    modelId: config.modelId,
    viewProtectionEnabled: config.viewProtectionEnabled,
    hasMongoDB: !!process.env.MONGODB_URI,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Update runtime config (hot-reloads without restart)
    const runtimeFields = ['mcpServerUrl', 'systemPromptMode', 'debugMode', 'modelId', 'viewProtectionEnabled']
    if (runtimeFields.some(f => body[f] !== undefined)) {
      saveAppConfig({
        ...(body.mcpServerUrl !== undefined && { mcpServerUrl: body.mcpServerUrl }),
        ...(body.systemPromptMode !== undefined && { systemPromptMode: body.systemPromptMode }),
        ...(body.debugMode !== undefined && { debugMode: body.debugMode }),
        ...(body.modelId !== undefined && { modelId: body.modelId }),
        ...(body.viewProtectionEnabled !== undefined && { viewProtectionEnabled: body.viewProtectionEnabled }),
      })
    }

    // Write secrets to .env.local (requires restart to take effect)
    let envChanged = false
    if (body.mongodbUri || body.anthropicApiKey) {
      const envPath = path.join(process.cwd(), '.env.local')
      let envContent = ''
      try {
        envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''
      } catch { /* ignore */ }

      if (body.mongodbUri) {
        envContent = setEnvVar(envContent, 'MONGODB_URI', body.mongodbUri)
        envChanged = true
      }
      if (body.anthropicApiKey) {
        envContent = setEnvVar(envContent, 'ANTHROPIC_API_KEY', body.anthropicApiKey)
        envChanged = true
      }
      fs.writeFileSync(envPath, envContent)
    }

    return NextResponse.json({ success: true, restartRequired: envChanged })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

function setEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${value}`
  if (regex.test(content)) {
    return content.replace(regex, line)
  }
  return content + (content.endsWith('\n') ? '' : '\n') + line + '\n'
}
