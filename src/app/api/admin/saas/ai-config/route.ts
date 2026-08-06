import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AI_CONFIG_KEYS = [
  'ai.model', 'ai.temperature', 'ai.maxTokens', 'ai.systemPrompt',
  'ai.rateLimits',
]

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const url = new URL(req.url)
    const sub = url.searchParams.get('type') || ''

    // AI config settings
    const settings = await db.setting.findMany({
      where: { key: { startsWith: 'ai.' } },
    })
    const config: Record<string, string> = {}
    for (const s of settings) config[s.key] = s.value

    // Models
    const models = await db.aiModelConfig.findMany({ orderBy: { createdAt: 'desc' } })
    const parsedModels = models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      version: m.version,
      status: m.status,
      capabilities: m.capabilities ? JSON.parse(m.capabilities) : [],
      cost: m.costPerK || 0,
    }))

    // Prompt templates
    const prompts = await db.promptTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    const parsedPrompts = prompts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      template: p.template,
      variables: p.variables ? JSON.parse(p.variables) : [],
    }))

    // Knowledge base stats
    const kbCount = await db.knowledgeBase.count()
    const kbCategories = await db.knowledgeBase.groupBy({ by: ['category'], _count: true })

    // AI usage today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const usageToday = await db.aiUsageLedger.aggregate({
      _sum: { inputTokens: true, outputTokens: true, requestCount: true, estimatedCostInr: true },
      where: { usageDate: { gte: today } },
    })

    // Rate limits
    let rateLimits: any[] = []
    try { rateLimits = config['ai.rateLimits'] ? JSON.parse(config['ai.rateLimits']) : [
      { role: 'Super Admin', rpm: 100, daily: 5000 },
      { role: 'HR Manager', rpm: 50, daily: 2000 },
      { role: 'Employee', rpm: 20, daily: 500 },
      { role: 'Client', rpm: 10, daily: 200 },
    ] } catch { rateLimits = [] }

    return NextResponse.json({
      config: {
        model: config['ai.model'] || 'gpt-4',
        temperature: parseFloat(config['ai.temperature'] || '0.7'),
        maxTokens: config['ai.maxTokens'] || '2048',
        systemPrompt: config['ai.systemPrompt'] || 'You are a helpful HR assistant for HPHRMS Enterprise.',
        rateLimits,
      },
      models: parsedModels,
      prompts: parsedPrompts,
      knowledgeBase: {
        total: kbCount,
        categories: kbCategories.map((c) => ({ category: c.category, count: c._count })),
      },
      usage: {
        todayCalls: usageToday._sum.requestCount || 0,
        todayTokens: (usageToday._sum.inputTokens || 0) + (usageToday._sum.outputTokens || 0),
        todayCost: usageToday._sum.estimatedCostInr || 0,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { config, model, prompt } = body

    if (config) {
      // Update AI configuration settings
      if (config.model !== undefined) {
        await db.setting.upsert({ where: { key: 'ai.model' }, update: { value: config.model }, create: { key: 'ai.model', value: config.model } })
      }
      if (config.temperature !== undefined) {
        await db.setting.upsert({ where: { key: 'ai.temperature' }, update: { value: String(config.temperature) }, create: { key: 'ai.temperature', value: String(config.temperature) } })
      }
      if (config.maxTokens !== undefined) {
        await db.setting.upsert({ where: { key: 'ai.maxTokens' }, update: { value: String(config.maxTokens) }, create: { key: 'ai.maxTokens', value: String(config.maxTokens) } })
      }
      if (config.systemPrompt !== undefined) {
        await db.setting.upsert({ where: { key: 'ai.systemPrompt' }, update: { value: config.systemPrompt }, create: { key: 'ai.systemPrompt', value: config.systemPrompt } })
      }
      if (config.rateLimits) {
        await db.setting.upsert({ where: { key: 'ai.rateLimits' }, update: { value: JSON.stringify(config.rateLimits) }, create: { key: 'ai.rateLimits', value: JSON.stringify(config.rateLimits) } })
      }
      await audit(cu!.user.id, 'UPDATE', 'AIConfig', 'config', 'Updated AI configuration')
    }

    if (model) {
      if (model.id) {
        // Update existing model
        const updateData: any = {}
        if (model.name !== undefined) updateData.name = model.name
        if (model.provider !== undefined) updateData.provider = model.provider
        if (model.version !== undefined) updateData.version = model.version
        if (model.status !== undefined) updateData.status = model.status
        if (model.capabilities !== undefined) updateData.capabilities = JSON.stringify(model.capabilities)
        if (model.cost !== undefined) updateData.costPerK = model.cost
        await db.aiModelConfig.update({ where: { id: model.id }, data: updateData })
      } else {
        // Create new model
        await db.aiModelConfig.create({
          data: {
            name: model.name || 'New Model',
            provider: model.provider || 'Custom',
            version: model.version,
            status: model.status || 'Active',
            capabilities: model.capabilities ? JSON.stringify(model.capabilities) : '[]',
            costPerK: model.cost || 0,
          },
        })
      }
      await audit(cu!.user.id, model.id ? 'UPDATE' : 'CREATE', 'AiModelConfig', model.id || '', `Model: ${model.name}`)
    }

    if (prompt) {
      if (prompt.id) {
        await db.promptTemplate.update({
          where: { id: prompt.id },
          data: {
            name: prompt.name,
            category: prompt.category,
            description: prompt.description,
            template: prompt.template,
            variables: prompt.variables ? JSON.stringify(prompt.variables) : null,
          },
        })
      } else {
        await db.promptTemplate.create({
          data: {
            name: prompt.name || 'New Prompt',
            category: prompt.category,
            description: prompt.description,
            template: prompt.template,
            variables: prompt.variables ? JSON.stringify(prompt.variables) : null,
          },
        })
      }
      await audit(cu!.user.id, prompt.id ? 'UPDATE' : 'CREATE', 'PromptTemplate', prompt.id || '', `Prompt: ${prompt.name}`)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })

    if (type === 'model') {
      await db.aiModelConfig.delete({ where: { id } })
    } else if (type === 'prompt') {
      await db.promptTemplate.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    await audit(cu!.user.id, 'DELETE', type === 'model' ? 'AiModelConfig' : 'PromptTemplate', id, `Deleted ${type}: ${id}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
