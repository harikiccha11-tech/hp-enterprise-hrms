import { db } from './db'
import { PrismaClient } from '@prisma/client'

/**
 * Resolve the actual Client ID for a CLIENT-role user.
 * Priority: cu.user.clientId → fallback to Client record by accountId
 */
export async function resolveClientId(
  clientIdFromUser: string | null | undefined,
  accountId: string
): Promise<string | null> {
  if (clientIdFromUser) return clientIdFromUser
  const client = await db.client.findFirst({
    where: { accountId },
    select: { id: true },
  })
  return client?.id ?? null
}

/**
 * Get all employee IDs assigned to a specific client.
 * Combines: direct assignment, project membership, and client-visible site assignments.
 */
export async function getClientEmployeeIds(
  dbInstance: PrismaClient,
  clientId: string,
  accountId: string
): Promise<string[]> {
  // Method 1: Direct assignment via Employee.assignedClientId
  const directEmployees = await dbInstance.employee.findMany({
    where: {
      assignedClientId: clientId,
      accountId,
      status: { in: ['ACTIVE', 'APPROVED'] },
    },
    select: { id: true },
  })

  // Method 2: Via project membership
  const projects = await dbInstance.project.findMany({
    where: { clientId, accountId },
    select: { id: true },
  })
  const projectIds = projects.map((p) => p.id)
  let projectMemberIds: string[] = []
  if (projectIds.length > 0) {
    const members = await dbInstance.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      select: { employeeId: true },
    })
    projectMemberIds = members.map((m) => m.employeeId)
  }

  // Method 3: Client-visible site assignments
  const siteAssigned = await dbInstance.siteAssignment.findMany({
    where: { accountId, status: 'active', clientVisible: true },
    select: { employeeId: true },
  })
  const siteEmpIds = siteAssigned.map((s) => s.employeeId)

  // Combine all unique IDs
  const allIds = new Set([
    ...directEmployees.map((e) => e.id),
    ...projectMemberIds,
    ...siteEmpIds,
  ])
  return Array.from(allIds)
}
