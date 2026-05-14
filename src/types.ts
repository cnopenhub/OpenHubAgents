/**
 * CommAgent Business Types
 */

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  FAILED = 'FAILED'
}

export interface Tenant {
  id: string;
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  status: ResourceStatus;
  createdAt: string;
}

export enum VersionStatus {
  DRAFT = 'DRAFT',
  UPLOADING = 'UPLOADING',
  COMPILING = 'COMPILING',
  SUCCESS = 'SUCCESS',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED'
}

export interface ResourceVersion {
  id: string;
  versionNumber: string;
  description?: string;
  status: VersionStatus;
  files: string[];
  createdAt: string;
  publishedAt?: string;
  logs?: string[];
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  type: 'instruction' | 'workflow' | 'module';
  status: ResourceStatus;
  activeVersionId?: string;
  versions: ResourceVersion[];
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  status: ResourceStatus;
  size?: string;
  chunkCount?: number;
  activeVersionId?: string;
  versions: ResourceVersion[];
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: ResourceStatus;
  boundSkills: string[]; // Skill IDs
  boundKBs: string[]; // KB IDs
  publishedVersion?: string;
  createdAt: string;
}
