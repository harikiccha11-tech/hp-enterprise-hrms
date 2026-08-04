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
    const search = sp.get('search') || ''
    const status = sp.get('status') || ''
    const category = sp.get('category') || ''
    const where: any = {}
    if (search) {
      where.OR = [
        { vendorName: { contains: search } },
        { companyName: { contains: search } },
        { gst: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (category) where.category = category
    const vendors = await db.vendor.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ vendors })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load vendors' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { vendorName, companyName, gst, email, phone, address, category, pan, bankName, bankAccount, bankIfsc, rating, status } = body
    if (!vendorName?.trim()) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    const vendor = await db.vendor.create({
      data: {
        vendorName: vendorName.trim(),
        companyName: companyName || null,
        gst: gst || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        category: category || null,
        pan: pan || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankIfsc: bankIfsc || null,
        rating: rating ? Number(rating) : null,
        status: status || 'ACTIVE',
      },
    })
    await audit(cu!.user.id, 'CREATE_VENDOR', 'Vendor', vendor.id, vendor.vendorName)
    return NextResponse.json({ ok: true, vendor })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, vendorName, companyName, gst, email, phone, address, category, pan, bankName, bankAccount, bankIfsc, rating, status } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (vendorName !== undefined) data.vendorName = vendorName.trim()
    if (companyName !== undefined) data.companyName = companyName || null
    if (gst !== undefined) data.gst = gst || null
    if (email !== undefined) data.email = email || null
    if (phone !== undefined) data.phone = phone || null
    if (address !== undefined) data.address = address || null
    if (category !== undefined) data.category = category || null
    if (pan !== undefined) data.pan = pan || null
    if (bankName !== undefined) data.bankName = bankName || null
    if (bankAccount !== undefined) data.bankAccount = bankAccount || null
    if (bankIfsc !== undefined) data.bankIfsc = bankIfsc || null
    if (rating !== undefined) data.rating = rating ? Number(rating) : null
    if (status !== undefined) data.status = status
    const vendor = await db.vendor.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_VENDOR', 'Vendor', id)
    return NextResponse.json({ ok: true, vendor })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.vendor.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_VENDOR', 'Vendor', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
  }
}
