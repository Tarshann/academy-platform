// Add userRelations functions after notificationPreferences section
// ... existing code ...

// ==================== User Relations (Parent-Child) ====================

export async function getUserRelations(parentId?: number, childId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { userRelations } = await import("../drizzle/schema");
  let query = db.select().from(userRelations);
  
  if (parentId) {
    query = query.where(eq(userRelations.parentId, parentId));
  }
  if (childId) {
    query = query.where(eq(userRelations.childId, childId));
  }
  
  return query;
}

export async function createUserRelation(relation: InsertUserRelation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userRelations).values(relation).returning({ id: userRelations.id });
  return result[0].id;
}

export async function deleteUserRelation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userRelations).where(eq(userRelations.id, id));
}

export async function getChildrenForParent(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { userRelations } = await import("../drizzle/schema");
  const relations = await db.select()
    .from(userRelations)
    .where(eq(userRelations.parentId, parentId));
  
  const childIds = relations.map(r => r.childId);
  if (childIds.length === 0) return [];
  
  return db.select().from(users).where(inArray(users.id, childIds));
}

export async function getParentsForChild(childId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { userRelations } = await import("../drizzle/schema");
  const relations = await db.select()
    .from(userRelations)
    .where(eq(userRelations.childId, childId));
  
  const parentIds = relations.map(r => r.parentId);
  if (parentIds.length === 0) return [];
  
  return db.select().from(users).where(inArray(users.id, parentIds));
}
