import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { assistants } from './assistants'
import { createUpdateTimestamps } from './columnHelpers'

export const topics = sqliteTable(
  'topics',
  {
    id: text('id').notNull().unique().primaryKey(),
    assistant_id: text('assistant_id')
      .notNull()
      .references(() => assistants.id),
    name: text('name').notNull(),
    isLoading: integer('isLoading', { mode: 'boolean' }),
    // Context management fields
    context_strategy: text('context_strategy'), // JSON: ContextStrategyConfig
    context_summary: text('context_summary'), // Generated summary text
    context_facts: text('context_facts'), // JSON: string[] of extracted facts
    summary_updated_at: integer('summary_updated_at', { mode: 'timestamp' }),
    facts_updated_at: integer('facts_updated_at', { mode: 'timestamp' }),
    ...createUpdateTimestamps
  },
  table => [
    index('idx_topics_assistant_id').on(table.assistant_id),
    index('idx_topics_created_at').on(table.created_at),
    index('idx_topics_assistant_id_created_at').on(table.assistant_id, table.created_at)
  ]
)
