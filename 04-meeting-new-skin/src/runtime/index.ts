import { PolarisRuntime } from '@polaris-runtime/core/dev';
import { RepoPlugin } from '../plugins/repo.plugin';
import { MeetingPlugin } from '../plugins/meeting.plugin';
import { WorkspacePlugin } from '../plugins/workspace.plugin';

export const runtime = new PolarisRuntime();
runtime.register([RepoPlugin, MeetingPlugin, WorkspacePlugin]);
runtime.setAllowedContextWorkflow('workspace/wf-set-context');

export const getPayload = <T>(result: any): T | undefined => {
  if (result && result.payload) return result.payload as T;
  if (result && result.data) return result.data as T;
  return result as T;
};