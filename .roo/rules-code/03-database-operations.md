# Database Operations

## Overview

This project uses **SQLite** with **Drizzle ORM** for type-safe database operations. All database schemas are in `db/schema/` and migrations are in `drizzle/`.

## Critical Requirements

### ⚠️ Always Generate Migrations

**REQUIRED**: After ANY schema change, run:
```bash
npx drizzle-kit generate
```

**Why**: This creates migration files that track schema changes and ensure database consistency across installs.

### ⚠️ Consult Documentation First

Before working with database operations, **ALWAYS** consult:
- `docs/data.md` (English)
- `docs/data-zh.md` (Chinese)

These contain:
- Complete database schema
- Entity relationships
- Data flow patterns
- Storage considerations

## Database Architecture

### Key Entities

```typescript
// Core entities in the database
- assistants    // AI assistant configurations
- topics        // Chat conversation threads
- messages      // Individual chat messages
- message_blocks // Message content blocks (text, code, images, etc.)
- providers     // LLM service configurations
- files         // Uploaded attachments
- mcp           // MCP server configurations
```

### Database Access Pattern

```typescript
// ✅ CORRECT - Use database access layer
import { assistantDatabase, messageDatabase, topicDatabase } from '@database'

async function loadTopic(topicId: string): Promise<Topic | null> {
  return await topicDatabase.getTopicById(topicId)
}

// ❌ WRONG - Direct db queries (unless in database layer)
import { db } from '@db'
import { topics } from '@db/schema'

const topic = await db.query.topics.findFirst({
  where: eq(topics.id, topicId)
})
```

## Schema Definitions

### Defining Tables

```typescript
// ✅ CORRECT - Schema definition in db/schema/
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey().notNull(),
  assistant_id: text('assistant_id').notNull(),
  name: text('name').notNull(),
  messages: text('messages').default('[]').notNull(),
  pinned: integer('pinned', { mode: 'boolean' }),
  prompt: text('prompt'),
  is_name_manually_edited: integer('is_name_manually_edited', { mode: 'boolean' }),
  created_at: integer('created_at', { mode: 'timestamp' }),
  updated_at: integer('updated_at', { mode: 'timestamp' })
})

// Add indexes for performance
export const topicsIndexes = {
  idx_topics_assistant_id: index('idx_topics_assistant_id').on(topics.assistant_id),
  idx_topics_created_at: index('idx_topics_created_at').on(topics.created_at),
  idx_topics_assistant_id_created_at: index('idx_topics_assistant_id_created_at')
    .on(topics.assistant_id, topics.created_at)
}
```

### Foreign Keys

```typescript
// ✅ CORRECT - Define foreign key relationships
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().notNull(),
  topic_id: text('topic_id')
    .notNull()
    .references(() => topics.id),
  assistant_id: text('assistant_id')
    .notNull()
    .references(() => assistants.id),
  // ... other fields
})

// ✅ CORRECT - Cascade delete
export const message_blocks = sqliteTable('message_blocks', {
  id: text('id').primaryKey().notNull(),
  message_id: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  // ... other fields
})
```

## Database Mapper Pattern

### Transforming Database Records

```typescript
// ✅ CORRECT - Transform DB records to domain types
import type { SelectAssistant } from '@db/schema'
import type { Assistant } from '@/types/assistant'

export function transformDbToAssistant(dbRecord: SelectAssistant): Assistant {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    prompt: dbRecord.prompt,
    type: dbRecord.type,
    emoji: dbRecord.emoji,
    description: dbRecord.description,
    model: safeJsonParse(dbRecord.model),
    defaultModel: safeJsonParse(dbRecord.default_model),
    settings: safeJsonParse(dbRecord.settings),
    topics: [],
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  }
}

export function transformAssistantToDb(assistant: Assistant): InsertAssistant {
  return {
    id: assistant.id,
    name: assistant.name,
    prompt: assistant.prompt,
    type: assistant.type,
    emoji: assistant.emoji,
    description: assistant.description,
    model: assistant.model ? JSON.stringify(assistant.model) : null,
    default_model: assistant.defaultModel ? JSON.stringify(assistant.defaultModel) : null,
    settings: assistant.settings ? JSON.stringify(assistant.settings) : null,
    created_at: assistant.createdAt,
    updated_at: assistant.updated_at
  }
}

// Helper for safe JSON parsing
function safeJsonParse<T>(json: string | null): T | undefined {
  if (!json) return undefined
  try {
    return JSON.parse(json) as T
  } catch {
    return undefined
  }
}
```

## Database Access Layer

### Database Service Pattern

```typescript
// ✅ CORRECT - Database service in db/databases/
import { db } from '@db'
import { topics } from '@db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { Topic } from '@/types/assistant'

export class TopicDatabase {
  async getTopicById(id: string): Promise<Topic | null> {
    const result = await db.query.topics.findFirst({
      where: eq(topics.id, id)
    })
    
    if (!result) return null
    return transformDbToTopic(result)
  }

  async getTopicsByAssistantId(assistantId: string): Promise<Topic[]> {
    const results = await db.query.topics.findMany({
      where: eq(topics.assistant_id, assistantId),
      orderBy: [desc(topics.created_at)]
    })
    
    return results.map(transformDbToTopic)
  }

  async createTopic(topic: Topic): Promise<void> {
    const dbTopic = transformTopicToDb(topic)
    await db.insert(topics).values(dbTopic)
  }

  async updateTopic(id: string, updates: Partial<Topic>): Promise<void> {
    const dbUpdates = transformTopicToDb(updates as Topic)
    await db.update(topics)
      .set(dbUpdates)
      .where(eq(topics.id, id))
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id))
  }
}

export const topicDatabase = new TopicDatabase()
```

## Query Patterns

### Basic Queries

```typescript
// ✅ CORRECT - Simple select
const topic = await db.query.topics.findFirst({
  where: eq(topics.id, topicId)
})

// ✅ CORRECT - Select with conditions
const activeTopics = await db.query.topics.findMany({
  where: and(
    eq(topics.assistant_id, assistantId),
    eq(topics.archived, false)
  ),
  orderBy: [desc(topics.created_at)],
  limit: 50
})

// ✅ CORRECT - Count
const topicCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(topics)
  .where(eq(topics.assistant_id, assistantId))
```

### Joins

```typescript
// ✅ CORRECT - Join with relations
const topicsWithMessages = await db.query.topics.findMany({
  where: eq(topics.assistant_id, assistantId),
  with: {
    messages: {
      orderBy: [desc(messages.created_at)],
      limit: 10
    }
  }
})

// ✅ CORRECT - Manual join
const results = await db
  .select()
  .from(topics)
  .innerJoin(messages, eq(topics.id, messages.topic_id))
  .where(eq(topics.assistant_id, assistantId))
```

### Batch Operations

```typescript
// ✅ CORRECT - Batch insert
async function createMultipleMessages(messageList: Message[]): Promise<void> {
  const dbMessages = messageList.map(transformMessageToDb)
  await db.insert(messages).values(dbMessages)
}

// ✅ CORRECT - Batch update
async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  await db.update(messages)
    .set({ read: true })
    .where(inArray(messages.id, messageIds))
}

// ✅ CORRECT - Batch delete
async function deleteOldMessages(beforeDate: Date): Promise<void> {
  await db.delete(messages)
    .where(lt(messages.created_at, beforeDate))
}
```

## Transactions

### Using Transactions

```typescript
// ✅ CORRECT - Transaction for atomic operations
async function moveMessageToTopic(
  messageId: string,
  fromTopicId: string,
  toTopicId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update message topic
    await tx.update(messages)
      .set({ topic_id: toTopicId })
      .where(eq(messages.id, messageId))
    
    // Update message count in from topic
    const fromTopic = await tx.query.topics.findFirst({
      where: eq(topics.id, fromTopicId)
    })
    
    if (fromTopic) {
      const messageList = JSON.parse(fromTopic.messages)
      const updatedMessages = messageList.filter((id: string) => id !== messageId)
      
      await tx.update(topics)
        .set({ messages: JSON.stringify(updatedMessages) })
        .where(eq(topics.id, fromTopicId))
    }
    
    // Update message count in to topic
    const toTopic = await tx.query.topics.findFirst({
      where: eq(topics.id, toTopicId)
    })
    
    if (toTopic) {
      const messageList = JSON.parse(toTopic.messages)
      messageList.push(messageId)
      
      await tx.update(topics)
        .set({ messages: JSON.stringify(messageList) })
        .where(eq(topics.id, toTopicId))
    }
  })
}

// ❌ WRONG - No transaction for related operations
async function moveMessageToTopic(messageId: string, fromTopicId: string, toTopicId: string) {
  await db.update(messages).set({ topic_id: toTopicId }).where(eq(messages.id, messageId))
  await db.update(topics).set({ /* ... */ }).where(eq(topics.id, fromTopicId))
  await db.update(topics).set({ /* ... */ }).where(eq(topics.id, toTopicId))
  // If one of these fails, data becomes inconsistent!
}
```

## Migrations

### Migration Workflow

```bash
# 1. Modify schema file in db/schema/
# 2. Generate migration
npx drizzle-kit generate

# 3. Migration file created in drizzle/XXXX_description.sql
# 4. Migrations run automatically on app start
```

### Writing Custom Migrations

```sql
-- ✅ CORRECT - Safe migration with IF EXISTS
ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0;

DROP TABLE IF EXISTS old_table;

CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);

-- ✅ CORRECT - Data migration
UPDATE messages 
SET read = 1 
WHERE created_at < '2024-01-01';

-- ❌ WRONG - No IF EXISTS check
DROP TABLE old_table; -- Will fail if table doesn't exist
```

## JSON Fields

### Storing JSON Data

```typescript
// ✅ CORRECT - JSON field in schema
export const assistants = sqliteTable('assistants', {
  id: text('id').primaryKey(),
  settings: text('settings'), // Store as JSON string
  model: text('model')         // Store as JSON string
})

// ✅ CORRECT - Safely parse JSON
function getAssistant(id: string): Promise<Assistant> {
  const result = await db.query.assistants.findFirst({
    where: eq(assistants.id, id)
  })
  
  return {
    ...result,
    settings: safeJsonParse(result.settings),
    model: safeJsonParse(result.model)
  }
}

// ✅ CORRECT - Safely stringify JSON
async function updateAssistant(id: string, updates: Partial<Assistant>) {
  await db.update(assistants)
    .set({
      settings: updates.settings ? JSON.stringify(updates.settings) : undefined,
      model: updates.model ? JSON.stringify(updates.model) : undefined
    })
    .where(eq(assistants.id, id))
}
```

## Performance Considerations

### Indexing

```typescript
// ✅ CORRECT - Add indexes for frequently queried columns
export const messagesIndexes = {
  idx_messages_topic_id: index('idx_messages_topic_id').on(messages.topic_id),
  idx_messages_created_at: index('idx_messages_created_at').on(messages.created_at),
  // Composite index for common query pattern
  idx_messages_topic_created: index('idx_messages_topic_created')
    .on(messages.topic_id, messages.created_at)
}

// ❌ WRONG - No indexes on foreign keys or frequently queried columns
```

### Pagination

```typescript
// ✅ CORRECT - Limit results for large datasets
async function getRecentMessages(topicId: string, page: number = 0, pageSize: number = 50) {
  return await db.query.messages.findMany({
    where: eq(messages.topic_id, topicId),
    orderBy: [desc(messages.created_at)],
    limit: pageSize,
    offset: page * pageSize
  })
}

// ❌ WRONG - Loading all records
async function getAllMessages(topicId: string) {
  return await db.query.messages.findMany({
    where: eq(messages.topic_id, topicId)
  }) // Could return thousands of records!
}
```

## Error Handling

### Database Error Handling

```typescript
// ✅ CORRECT - Proper error handling
async function createTopic(topic: Topic): Promise<Result<Topic>> {
  try {
    const dbTopic = transformTopicToDb(topic)
    await db.insert(topics).values(dbTopic)
    return { success: true, data: topic }
  } catch (error) {
    logger.error('Failed to create topic', error as Error, { topicId: topic.id })
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return { success: false, error: 'Topic already exists' }
    }
    
    return { success: false, error: 'Database error' }
  }
}

// ❌ WRONG - Unhandled database errors
async function createTopic(topic: Topic) {
  const dbTopic = transformTopicToDb(topic)
  await db.insert(topics).values(dbTopic)
  // What if this fails?
}
```

## Verification Checklist

Before committing database code:

- [ ] Ran `npx drizzle-kit generate` after schema changes
- [ ] Consulted `docs/data.md` for schema documentation
- [ ] Used database access layer (not direct queries in components)
- [ ] Added indexes for foreign keys and frequently queried columns
- [ ] Used transactions for related operations
- [ ] Handled JSON fields with safe parsing
- [ ] Implemented proper error handling
- [ ] Used pagination for potentially large result sets
- [ ] Added cascade delete for dependent records
- [ ] Tested migration on clean database