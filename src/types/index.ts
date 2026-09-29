export type UserRole = 'student' | 'staff' | 'admin';

export type ComplaintCategory = 
  | 'classrooms'
  | 'laboratories'
  | 'fees'
  | 'library'
  | 'hostel'
  | 'transport'
  | 'it_services'
  | 'facilities'
  | 'other';

export type ComplaintStatus = 
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'jira_created'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RoleDefinition {
  id: UserRole;
  title: string;
  badge: string;
  description: string;
  primaryResponsibilities: string[];
  keyViews: string[];
  permissions: string[];
  accentColor: string;
}

export interface SystemModule {
  id: string;
  name: string;
  code: string;
  purpose: string;
  capabilities: string[];
  technicalStack: string[];
  dataFlow: string;
}

export interface ArchitectureLayer {
  layer: string;
  title: string;
  components: string[];
  protocols: string[];
  technologies: string[];
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  timeframe: string;
  deliverables: string[];
  techFocus: string[];
  status: 'current' | 'next' | 'planned';
}
