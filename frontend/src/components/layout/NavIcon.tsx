import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Bell,
  Star,
  User,
  Inbox,
  Wrench,
  CheckCircle2,
  FileText,
  LayoutGrid,
  FolderKanban,
  Timer,
  Building2,
  BarChart3,
  GitPullRequest,
  Settings,
  HelpCircle,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Bell,
  Star,
  User,
  Inbox,
  Wrench,
  CheckCircle2,
  FileText,
  LayoutGrid,
  FolderKanban,
  Timer,
  Building2,
  BarChart3,
  GitPullRequest,
  Settings,
};

export function NavIcon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} />;
}
