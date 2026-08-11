import { IPlugin, successResult, errorResult, logger } from '@polaris-runtime/core';

export const WorkspacePlugin: IPlugin = {
  name: 'workspace',
  version: '1.0.0',
  description: 'Workspace management for meeting app',

  capabilities: [
    {
      name: 'workspace/cap-set-context',
      description: 'Set global context (user, role, workspace)',
      run: (input) => {
        logger.verbose('[Workspace] Setting context:', input);
        return successResult(input, 'workspace', undefined, 'Context updated');
      }
    }
  ],

  workflows: [
    {
      name: 'workspace/wf-set-context',
      description: '🔒 ALLOWED: Set global context',
      allowed: [],
      steps: [{ name: 'SetContext', useCapability: 'workspace/cap-set-context' }]
    }
  ]
};