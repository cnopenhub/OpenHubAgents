import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ShieldAlert, 
  Box, 
  Cpu, 
  BookOpen, 
  Wrench, 
  Link, 
  Key, 
  FileLock, 
  Terminal, 
  History,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Database,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

export type PortalMode = 'platform' | 'tenant' | 'api';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  portal: PortalMode;
}

const NAV_ITEMS: NavItem[] = [
  // Platform Admin
  { id: 'p-overview', label: '总体概览', icon: BarChart3, portal: 'platform' },
  { id: 'p-tenants', label: '租户管理', icon: Users, portal: 'platform' },
  { id: 'p-ops', label: '平台运维', icon: Settings, portal: 'platform' },
  { id: 'p-audit', label: '审计日志', icon: ShieldAlert, portal: 'platform' },
  
  // Tenant Admin
  { id: 't-dashboard', label: '控制面板', icon: LayoutDashboard, portal: 'tenant' },
  { id: 't-agents', label: '智能体中心', icon: Cpu, portal: 'tenant' },
  { id: 't-skills', label: '技能中心', icon: BookOpen, portal: 'tenant' },
  { id: 't-kb', label: '知识库中心', icon: Database, portal: 'tenant' },
  { id: 't-credentials', label: '凭据管理', icon: Key, portal: 'tenant' },
  { id: 't-audit', label: '操作审计', icon: History, portal: 'tenant' },

  // API Integration Portal
  { id: 'a-explorer', label: 'API 服务中心', icon: Terminal, portal: 'api' },
  { id: 'a-samples', label: '代码示例指南', icon: FileLock, portal: 'api' },
];

interface SidebarProps {
  activePortal: PortalMode;
  setActivePortal: (m: PortalMode) => void;
  activeItem: string;
  setActiveItem: (id: string) => void;
}

export function Sidebar({ activePortal, setActivePortal, activeItem, setActiveItem }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredItems = NAV_ITEMS.filter(item => item.portal === activePortal);

  return (
    <aside 
      className={`${isCollapsed ? 'w-18' : 'w-60'} bg-surface flex flex-col transition-all duration-500 z-50 text-ink border-r border-border`}
    >
      {/* Brand Header */}
      {!isCollapsed && (
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_-3px_rgba(155,169,255,0.6)]">
              <Zap className="w-4 h-4 text-bg fill-current" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight uppercase">OPENHUB AGENTS</span>
          </div>
          <p className="text-[10px] text-ink-muted font-mono tracking-widest uppercase">Nexus Protocol v2.4</p>
        </div>
      )}

      {/* Portal Switcher */}
      <div className="px-4 pb-6">
        <div className={`relative ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <select 
              value={activePortal}
              onChange={(e) => setActivePortal(e.target.value as PortalMode)}
              className="w-full bg-surface-variant/50 border border-border text-[11px] font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary appearance-none text-ink cursor-pointer hover:bg-surface-variant transition-colors pr-8"
            >
              <option value="platform" className="bg-surface">平台管理员</option>
              <option value="tenant" className="bg-surface">租户管理员</option>
              <option value="api" className="bg-surface">接口服务中心</option>
            </select>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {activePortal[0].toUpperCase()}
            </div>
          )}
          {!isCollapsed && <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none rotate-90" />}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 text-left rounded-2xl group
              ${activeItem === item.id 
                ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(155,169,255,0.2)]' 
                : 'text-ink-muted hover:bg-surface-variant hover:text-ink'}
            `}
          >
            <item.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 ${activeItem === item.id ? 'text-primary' : 'text-ink-muted group-hover:text-ink hover:scale-110'}`} />
            {!isCollapsed && <span className="text-xs font-medium tracking-wide">{item.label}</span>}
            {activeItem === item.id && !isCollapsed && (
              <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 mt-auto">
        <div className={`p-4 rounded-2xl bg-surface-variant/30 border border-border/50 ${isCollapsed ? 'hidden' : ''}`}>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary" />
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold truncate">Joseph Liu</p>
                <p className="text-[9px] text-ink-muted font-mono uppercase">超级管理员</p>
              </div>
           </div>
        </div>
        <div className="flex items-center justify-center mt-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 flex items-center justify-center hover:bg-surface-variant rounded-xl transition-colors text-ink-muted hover:text-primary border border-transparent hover:border-border"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
