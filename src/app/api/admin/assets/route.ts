import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || ''
    const category = sp.get('category') || ''
    const search = sp.get('search') || ''
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }
    const assets = await db.asset.findMany({
      where,
      include: {
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    // Attach current assignment info
    const mapped = assets.map((a) => {
      const current = a.assignments[0]
      return {
        ...a,
        currentAssignment: current && !current.returnedAt ? {
          id: current.id,
          employeeId: current.employeeId,
          assignedAt: current.assignedAt,
          condition: current.condition,
        } : null,
      }
    })
    return NextResponse.json({ assets: mapped })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { action } = body

    // Assign action
    if (action === 'assign') {
      const { assetId, employeeId, condition, notes } = body
      if (!assetId || !employeeId) return NextResponse.json({ error: 'Asset ID and Employee ID are required' }, { status: 400 })
      const asset = await db.asset.findUnique({ where: { id: assetId } })
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      if (asset.status !== 'AVAILABLE') return NextResponse.json({ error: 'Asset is not available for assignment' }, { status: 400 })
      const assignment = await db.assetAssignment.create({
        data: {
          assetId,
          employeeId,
          condition: condition || 'Good',
          notes: notes || null,
        },
      })
      await db.asset.update({ where: { id: assetId }, data: { status: 'ASSIGNED' } })
      await audit(cu!.user.id, 'ASSIGN_ASSET', 'Asset', assetId, `Assigned to employee ${employeeId}`)
      return NextResponse.json({ ok: true, assignment })
    }

    // Return action
    if (action === 'return') {
      const { assetId, condition, notes } = body
      if (!assetId) return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
      const asset = await db.asset.findUnique({
        where: { id: assetId },
        include: { assignments: { where: { returnedAt: null }, orderBy: { assignedAt: 'desc' }, take: 1 } },
      })
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      if (asset.assignments.length === 0) return NextResponse.json({ error: 'No active assignment found' }, { status: 400 })
      const updated = await db.assetAssignment.update({
        where: { id: asset.assignments[0].id },
        data: { returnedAt: new Date(), condition: condition || null, notes: notes || null },
      })
      await db.asset.update({ where: { id: assetId }, data: { status: 'AVAILABLE' } })
      await audit(cu!.user.id, 'RETURN_ASSET', 'Asset', assetId)
      return NextResponse.json({ ok: true, assignment: updated })
    }

    // Create action
    const { name, category, serialNumber, make, model, purchaseDate, purchaseCost, currentValue, warrantyExpiry, status, location, notes } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Asset name is required' }, { status: 400 })
    if (!category?.trim()) return NextResponse.json({ error: 'Asset category is required' }, { status: 400 })
    const asset = await db.asset.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        serialNumber: serialNumber || null,
        make: make || null,
        model: model || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? Number(purchaseCost) : null,
        currentValue: currentValue ? Number(currentValue) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        status: status || 'AVAILABLE',
        location: location || null,
        notes: notes || null,
      },
    })
    await audit(cu!.user.id, 'CREATE_ASSET', 'Asset', asset.id, asset.name)
    return NextResponse.json({ ok: true, asset })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process asset request' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, name, category, serialNumber, make, model, purchaseDate, purchaseCost, currentValue, warrantyExpiry, status, location, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (name !== undefined) data.name = name.trim()
    if (category !== undefined) data.category = category.trim()
    if (serialNumber !== undefined) data.serialNumber = serialNumber || null
    if (make !== undefined) data.make = make || null
    if (model !== undefined) data.model = model || null
    if (purchaseDate !== undefined) data.purchaseDate = purchaseDate ? new Date(purchaseDate) : null
    if (purchaseCost !== undefined) data.purchaseCost = purchaseCost ? Number(purchaseCost) : null
    if (currentValue !== undefined) data.currentValue = currentValue ? Number(currentValue) : null
    if (warrantyExpiry !== undefined) data.warrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null
    if (status !== undefined) data.status = status
    if (location !== undefined) data.location = location || null
    if (notes !== undefined) data.notes = notes || null
    const asset = await db.asset.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_ASSET', 'Asset', id)
    return NextResponse.json({ ok: true, asset })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.asset.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_ASSET', 'Asset', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
