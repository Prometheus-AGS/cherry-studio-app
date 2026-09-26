import * as z from 'zod';

import { PRODUCT_NAME } from '@/shared/branding';
import { PluginError } from '@/shared/contracts/plugins';

import type { PluginAuthorizationDefinition, PluginDefinition } from '../../pluginDefinition';
import { createOfficialMcpClient } from '../../transport/createOfficialMcpClient';
import { GithubAuthorizationRuntime } from './GithubAuthorizationRuntime';
import { GithubTokenCredentialSchema, GithubUserCredentialSchema } from './githubCredentials';
import { getGithubApplication } from './githubOauth';
import { githubGuide } from './guide';

// Pre-fills the fine-grained token form: name, expiry and the permissions the tools use.
const githubTokenCredentialsUrl = `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent(PRODUCT_NAME)}&description=${encodeURIComponent(`${PRODUCT_NAME} plugin`)}&expires_in=366&contents=read&issues=write&pull_requests=write`;

const githubUserMethod: PluginAuthorizationDefinition = {
  id: 'github_user',
  kind: 'interactive',
  interaction: 'callback',
  stages: ['user', 'account'],
  createRuntime: (store) => new GithubAuthorizationRuntime(store),
  createRequestAuthorization: (tools) => ({
    apply(credential, { headers }) {
      const parsed = GithubUserCredentialSchema.safeParse(credential);
      if (!parsed.success || parsed.data.rejected)
        throw new PluginError('authorization', 'The GitHub authorization is unavailable.');
      headers.set('Authorization', `Bearer ${parsed.data.tokens.accessToken}`);
      headers.set('X-MCP-Tools', Object.keys(tools).join(','));
    },
  }),
};

export const githubPlugin: PluginDefinition = {
  serverName: 'GitHub',
  guide: githubGuide,
  catalog: {
    id: 'github',
    icon: 'github',
    // Operator decision: GitHub sign-in is paused until The Boss accounts replace it.
    disabledReason: 'boss-accounts-coming-soon',
    links: {
      credentials: githubTokenCredentialsUrl,
      website: 'https://github.com',
      authorizationManagement: 'https://github.com/settings/applications',
      privacy:
        'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    },
  },
  tools: {
    get_me: 'read',
    search_repositories: 'read',
    search_issues: 'read',
    search_pull_requests: 'read',
    get_file_contents: 'read',
    list_pull_requests: 'read',
    issue_read: 'read',
    pull_request_read: 'read',
    issue_write: 'write',
    add_issue_comment: 'write',
    create_pull_request: 'write',
  },
  authMethods: [
    ...(getGithubApplication() ? [githubUserMethod] : []),
    {
      id: 'personal_token',
      kind: 'credentials',
      requiresDisconnect: true,
      fields: [{ id: 'token', secret: true, maxLength: 4096, pattern: '^\\S+$' }],
      encodeCredentials: (fields) => ({ version: 1, token: fields.token }),
      createRequestAuthorization: (tools) => ({
        apply(credential, { headers }) {
          const parsed = GithubTokenCredentialSchema.safeParse(credential);
          if (!parsed.success)
            throw new PluginError('authorization', 'The GitHub credential is invalid.');
          const { token } = parsed.data;
          headers.set('Authorization', `Bearer ${token}`);
          headers.set('X-MCP-Tools', Object.keys(tools).join(','));
        },
      }),
    },
  ],
  createClient(context) {
    return createOfficialMcpClient(context, {
      url: 'https://api.githubcopilot.com/mcp/',
    });
  },
  validation: {
    tool: 'get_me',
    args: {},
    accountLabel: (result) => z.object({ login: z.string().min(1).max(100) }).parse(result).login,
  },
};
