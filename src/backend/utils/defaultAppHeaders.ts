import { USER_AGENT_NAME } from '@/shared/branding';

/** Identifying headers attached to outbound AI-provider and web-search requests. */
export function defaultAppHeaders(): Record<string, string> {
  return {
    'User-Agent': `${USER_AGENT_NAME}/1.0`,
    'X-App-Name': USER_AGENT_NAME,
  };
}
