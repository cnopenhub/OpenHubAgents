import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  Activity,
  Layers,
  Search,
  Plus,
  Code,
  Copy,
  Play,
  Key,
  Shield,
  RefreshCcw,
  Book,
  Box,
  Cpu,
  Trash2,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Settings2,
  Rocket,
  Upload,
  Database,
  BookOpen,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Settings,
  History,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  BarChart3
} from 'lucide-react';
import { Sidebar, PortalMode } from './components/Sidebar';
import { ResourceStatus, Tenant, Skill, KnowledgeBase, Agent, VersionStatus, ResourceVersion } from './types';

// Mock Data
const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: '智远未来科技有限公司', accessKeyId: 'AK_72183921', secretAccessKey: 'SK_************************', status: ResourceStatus.ACTIVE, createdAt: '2024-03-10' }
];

const MOCK_SKILLS: Skill[] = [
  { 
    id: 's1', 
    name: '基础对话策略包',
    description: '核心对话引擎，负责通用意图识别与响应生成。',
    type: 'instruction', 
    status: ResourceStatus.ACTIVE,
    activeVersionId: 'v1',
    versions: [
      { id: 'v1', versionNumber: 'v1.2.0', description: '稳定版：优化了中文分词精度。', status: VersionStatus.PUBLISHED, files: ['strategy_base.json', 'prompt_v1.md'], createdAt: '2024-05-01', publishedAt: '2024-05-01' },
      { id: 'v2', versionNumber: 'v1.3.0-rc', description: '预发布：实验性多轮对话状态机。', status: VersionStatus.DRAFT, files: ['strategy_v2_alpha.json'], createdAt: '2024-05-12' }
    ],
    updatedAt: '2024-05-01' 
  },
  { 
    id: 's2', 
    name: '售后退款流程规范', 
    description: '自动化退款审核与银行接口对接逻辑。',
    type: 'workflow', 
    status: ResourceStatus.ACTIVE,
    versions: [
      { id: 'v1', versionNumber: 'v0.8.4', description: '修复了金额校验的逻辑漏洞。', status: VersionStatus.FAILED, files: ['refund_flow.bpmn'], createdAt: '2024-05-10', logs: ['Error: Validation failed at node [7]'] }
    ],
    updatedAt: '2024-05-12' 
  }
];

const MOCK_KBS: KnowledgeBase[] = [
  { 
    id: 'k1', 
    name: '内部 HR 知识库', 
    description: '包含入职指南、福利政策及考勤管理等核心文档。',
    status: ResourceStatus.ACTIVE,
    size: '12.4 MB',
    chunkCount: 1420,
    activeVersionId: 'v1',
    versions: [
      { id: 'v1', versionNumber: 'v1.0.0', description: '2024 官方发布版。', status: VersionStatus.PUBLISHED, files: ['hr_manual_2024.pdf', 'benefits_summary.docx'], createdAt: '2024-04-15', publishedAt: '2024-04-15' }
    ],
    updatedAt: '2024-04-15' 
  }
];

const MOCK_AGENTS: Agent[] = [
  { id: 'a1', name: 'HR 助手', description: '负责解答员工行政与人力资源相关问题', status: ResourceStatus.ACTIVE, boundSkills: ['s1'], boundKBs: ['k1'], publishedVersion: '20240501-release', createdAt: '2024-01-20' },
  { id: 'a2', name: '智能客服', description: '全渠道通用客户服务机器人', status: ResourceStatus.DRAFT, boundSkills: [], boundKBs: [], createdAt: '2024-05-12' }
];

// Modals Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface-variant/30">
            <h3 className="font-display font-bold text-base tracking-tight">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-surface-variant rounded-full transition-colors text-ink-muted hover:text-ink"
            >
              <Trash2 className="w-4.5 h-4.5 rotate-45" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ResourceManagementView = ({ 
  resourceId, 
  type, 
  skills, 
  kbs, 
  setSelectedResourceId, 
  setVersionDraft, 
  setIsCreatingVersion,
  handleSwitchActiveVersion,
  handleCompileVersion,
  handlePublishVersion,
  handleUploadFile,
  setIsUploading,
  simulateUpload
}: { 
  resourceId: string, 
  type: 'skill' | 'kb',
  skills: Skill[],
  kbs: KnowledgeBase[],
  setSelectedResourceId: (val: any) => void,
  setVersionDraft: (val: any) => void,
  setIsCreatingVersion: (val: any) => void,
  handleSwitchActiveVersion: any,
  handleCompileVersion: any,
  handlePublishVersion: any,
  handleUploadFile: any,
  setIsUploading: (val: boolean) => void,
  simulateUpload: (resourceId: string, versionId: string, type: 'skill' | 'kb', fileName: string) => void
}) => {
  const resource = type === 'skill' ? skills.find(s => s.id === resourceId) : kbs.find(k => k.id === resourceId);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!resource) return null;

  const selectedVersion = resource.versions.find(v => v.id === selectedVersionId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedVersion) {
      simulateUpload(resource.id, selectedVersion.id, type, file.name);
    }
  };

  // If we are in detail mode but no version is selected, go back to list
  if (viewMode === 'detail' && !selectedVersion) {
    setViewMode('list');
  }

  return (
    <motion.div 
      key={`manage-${type}-${resource.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      {/* Header with Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={() => {
            if (viewMode === 'detail') {
              setViewMode('list');
              setSelectedVersionId(null);
            } else {
              setSelectedResourceId(null);
            }
          }}
          className="p-3 bg-surface-variant/30 hover:bg-surface-variant rounded-2xl transition-colors border border-border"
        >
          <ArrowRight className="w-5 h-5 rotate-180 text-ink" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[10px] text-ink-muted font-bold uppercase tracking-[0.1em] opacity-40 mb-1">
            <span>{type === 'skill' ? '技能中心' : '知识库中心'}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{resource.name}</span>
            {viewMode === 'detail' && selectedVersion && (
              <>
                <ArrowRight className="w-3 h-3" />
                <span className="text-primary">{selectedVersion.versionNumber}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold tracking-tight">
              {viewMode === 'list' ? '版本管理' : `版本详情: ${selectedVersion?.versionNumber}`}
            </h2>
            {viewMode === 'detail' && selectedVersion && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-widest ${
                selectedVersion.status === VersionStatus.PUBLISHED ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                selectedVersion.status === VersionStatus.COMPILING ? 'bg-secondary/10 text-secondary border-secondary/20 animate-pulse' :
                selectedVersion.status === VersionStatus.UPLOADING ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' :
                selectedVersion.status === VersionStatus.SUCCESS ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                selectedVersion.status === VersionStatus.FAILED ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-ink/5 text-ink-muted border-border'
              }`}>
                {selectedVersion.status === VersionStatus.PUBLISHED ? '已发布' : 
                 selectedVersion.status === VersionStatus.COMPILING ? '编译中' :
                 selectedVersion.status === VersionStatus.UPLOADING ? '上传中' :
                 selectedVersion.status === VersionStatus.SUCCESS ? '就绪' :
                 selectedVersion.status === VersionStatus.FAILED ? '失败' : '草稿'}
              </span>
            )}
          </div>
        </div>
        
        {viewMode === 'list' && (
          <button 
            onClick={() => {
              setVersionDraft({ number: `v1.${resource.versions.length + 1}.0`, description: '' });
              setIsCreatingVersion(true);
            }}
            className="bg-primary text-bg px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary"
          >
            <Plus className="w-4 h-4" /> 创建新版本
          </button>
        )}

        {viewMode === 'detail' && selectedVersion && (
          <div className="flex gap-3">
             {selectedVersion.status !== VersionStatus.PUBLISHED && (
                <button 
                  disabled={selectedVersion.status === VersionStatus.COMPILING || selectedVersion.status === VersionStatus.SUCCESS || selectedVersion.status === VersionStatus.UPLOADING}
                  onClick={() => handleCompileVersion(resource.id, selectedVersion.id, type)}
                  className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border ${
                    selectedVersion.status === VersionStatus.COMPILING || selectedVersion.status === VersionStatus.SUCCESS || selectedVersion.status === VersionStatus.UPLOADING
                      ? 'bg-surface-variant/50 text-ink-muted border-border cursor-not-allowed opacity-50' 
                      : 'bg-primary text-bg border-transparent hover:scale-105'
                  }`}
                >
                  {selectedVersion.status === VersionStatus.COMPILING ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 正在编译...
                    </>
                  ) : selectedVersion.status === VersionStatus.UPLOADING ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 正在上传...
                    </>
                  ) : selectedVersion.status === VersionStatus.SUCCESS ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> 编译完成
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" /> 编译版本
                    </>
                  )}
                </button>
             )}
             
             {(selectedVersion.status === VersionStatus.SUCCESS) && (
                <button 
                  onClick={() => handlePublishVersion(resource.id, selectedVersion.id, type)}
                  className="bg-tertiary text-bg px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-tertiary/20"
                >
                  <ShieldCheck className="w-4 h-4" /> 发布版本
                </button>
             )}

             {selectedVersion.status === VersionStatus.PUBLISHED && resource.activeVersionId !== selectedVersion.id && (
                <button 
                  onClick={() => handleSwitchActiveVersion(resource.id, selectedVersion.id, type)}
                  className="bg-primary text-bg px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary"
                >
                  <Zap className="w-4 h-4" /> 设为活跃版本
                </button>
             )}
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resource.versions.map(v => {
            const isActive = resource.activeVersionId === v.id;
            return (
              <div 
                key={v.id} 
                onClick={() => {
                  setSelectedVersionId(v.id);
                  setViewMode('detail');
                }}
                className="m3-card !p-6 cursor-pointer hover:border-primary/50 transition-all flex flex-col relative group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{v.versionNumber}</span>
                    {isActive && <span className="text-[9px] bg-primary text-bg px-2 py-0.5 rounded-full font-bold uppercase ring-4 ring-primary/10">活跃</span>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] px-2.5 py-1 rounded-lg font-bold border uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm ${
                      v.status === VersionStatus.PUBLISHED ? 'bg-tertiary/10 text-tertiary border-tertiary/30' : 
                      v.status === VersionStatus.COMPILING ? 'bg-secondary/10 text-secondary border-secondary/30 animate-pulse' :
                      v.status === VersionStatus.UPLOADING ? 'bg-primary/10 text-primary border-primary/30 animate-pulse' :
                      v.status === VersionStatus.SUCCESS ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                      v.status === VersionStatus.FAILED ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                      'bg-ink/5 text-ink-muted border-border'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        v.status === VersionStatus.PUBLISHED ? 'bg-tertiary' : 
                        v.status === VersionStatus.COMPILING ? 'bg-secondary' :
                        v.status === VersionStatus.UPLOADING ? 'bg-primary' :
                        v.status === VersionStatus.SUCCESS ? 'bg-emerald-500' :
                        v.status === VersionStatus.FAILED ? 'bg-red-500' :
                        'bg-ink-muted'
                      }`} />
                      {v.status === VersionStatus.PUBLISHED ? '已发布' : 
                       v.status === VersionStatus.COMPILING ? '编译中' :
                       v.status === VersionStatus.UPLOADING ? '上传中' :
                       v.status === VersionStatus.SUCCESS ? '就绪' :
                       v.status === VersionStatus.FAILED ? '失败' : '草稿'}
                    </span>
                    {(v.status === VersionStatus.COMPILING || v.status === VersionStatus.UPLOADING) && (
                      <div className="w-16 h-1 bg-surface-variant rounded-full overflow-hidden border border-border/10">
                        <div className={`h-full animate-progress-indefinite ${v.status === VersionStatus.UPLOADING ? 'bg-primary' : 'bg-secondary'}`} />
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-ink-muted line-clamp-2 h-8 mb-6 opacity-70 italic">
                  {v.description || '该版本暂无描述信息'}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/10 text-[10px] text-ink-muted font-mono uppercase tracking-widest">
                  <span>创建于: {v.createdAt}</span>
                  <div className="flex items-center gap-2 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    进入详情 <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
          {resource.versions.length === 0 && (
            <div className="col-span-full py-32 border-2 border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center text-ink-muted/30">
               <History className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-display font-bold uppercase tracking-[0.2em] italic">暂无版本记录</p>
               <p className="text-[10px] font-mono mt-2 uppercase tracking-widest text-center">点击右上角按钮创建首个版本迭代</p>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* File Management */}
          <div className="m3-card !p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary opacity-60" />
                  文件资产
                </h3>
                <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest opacity-50 mt-1">
                  {selectedVersion?.status === VersionStatus.PUBLISHED ? 'Read-only • 版本已锁定' : 'Edit Mode • 支持文件增删'}
                </p>
              </div>
              {(selectedVersion?.status === VersionStatus.DRAFT || selectedVersion?.status === VersionStatus.UPLOADING) && (
                <button 
                  disabled={selectedVersion.status === VersionStatus.UPLOADING}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-primary/20 transition-all shadow-sm disabled:opacity-50"
                >
                  {selectedVersion.status === VersionStatus.UPLOADING ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 正在同步...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> 选择文件
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {selectedVersion?.files.map((file, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-surface-variant/20 rounded-2xl border border-border/30 hover:border-primary/20 transition-all group shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink-muted">
                    <FileText className="w-5 h-5 opacity-40" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold tracking-tight truncate">{file}</p>
                    <p className="text-[10px] text-ink-muted font-mono opacity-50">Local Source Asset</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 text-ink-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="下载资产">
                       <ArrowRight className="w-4 h-4 rotate-90" />
                     </button>
                     {selectedVersion?.status === VersionStatus.DRAFT && (
                       <button className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all" title="移除资产">
                         <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                  </div>
                </div>
              ))}
              {selectedVersion?.files.length === 0 && (
                <div className="py-24 border-2 border-dashed border-border/20 rounded-3xl flex flex-col items-center justify-center text-ink-muted/30">
                   <Box className="w-10 h-10 mb-4 opacity-10" />
                   <p className="text-[10px] font-mono uppercase tracking-widest">该版本暂无可展示的资产文件</p>
                </div>
              )}
            </div>
          </div>

          {/* Compiled Assets (Renamed to Skill/KB Assets) */}
          <div className="m3-card !p-8">
            <div className="flex flex-col mb-6">
              <h3 className="font-display font-bold text-lg tracking-tight uppercase flex items-center gap-2">
                <Layers className="w-5 h-5 text-tertiary opacity-60" />
                {type === 'skill' ? '技能资产' : '知识库资产'}
              </h3>
              <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest opacity-50 mt-1">
                {selectedVersion?.status === VersionStatus.PUBLISHED ? 'Final Bundle • 已归档产物' : 'Active Build • 动态输出路径'}
              </p>
            </div>

            <div className="space-y-4">
              {selectedVersion?.status === VersionStatus.COMPILING || selectedVersion?.status === VersionStatus.UPLOADING ? (
                <div className="py-20 border border-border/10 rounded-3xl flex flex-col items-center justify-center bg-surface-variant/5">
                   <div className="relative mb-6">
                     <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        {selectedVersion.status === VersionStatus.UPLOADING ? <Upload className="w-5 h-5 text-primary" /> : <Cpu className="w-5 h-5 text-primary" />}
                     </div>
                   </div>
                   <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-primary animate-pulse">
                     {selectedVersion.status === VersionStatus.UPLOADING ? '正在同步云端存储 (Syncing)...' : '正在生成产物目录 (Building)...'}
                   </p>
                </div>
              ) : (selectedVersion?.status === VersionStatus.PUBLISHED || selectedVersion?.status === VersionStatus.SUCCESS) ? (
                <div className="space-y-2">
                  <div className="p-4 bg-tertiary/5 border border-tertiary/10 rounded-2xl flex items-center justify-between text-xs hover:bg-tertiary/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">bundle_core.bin</p>
                        <p className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">Runtime: kernel_v1.0</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-40">1.2 MB</span>
                  </div>
                  <div className="p-4 bg-tertiary/5 border border-tertiary/10 rounded-2xl flex items-center justify-between text-xs hover:bg-tertiary/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">manifest.json</p>
                        <p className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">Descriptor: entity_map</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-40">4 KB</span>
                  </div>
                </div>
              ) : selectedVersion?.status !== VersionStatus.COMPILING && (
                <div className="py-24 border-2 border-dashed border-border/20 rounded-3xl flex flex-col items-center justify-center text-ink-muted/30">
                  <Terminal className="w-10 h-10 mb-4 opacity-10" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-center px-12 leading-relaxed italic opacity-60">
                    等待版本初始化编译任务完成以生成产物目录
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [activePortal, setActivePortal] = useState<PortalMode>('tenant');
  const [activeItem, setActiveItem] = useState('t-agents');
  
  // Business States
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS);
  const [kbs, setKbs] = useState<KnowledgeBase[]>(MOCK_KBS);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);

  // UI States
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<{ id: string, type: 'skill' | 'kb' } | null>(null);
  const [showSK, setShowSK] = useState<Record<string, boolean>>({});
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isCreatingKB, setIsCreatingKB] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  
  const [resourceDraft, setResourceDraft] = useState({ name: '', description: '', type: 'instruction' });
  const [versionDraft, setVersionDraft] = useState({ number: '', description: '' });

  // Handlers
  const simulateUpload = (resourceId: string, versionId: string, type: 'skill' | 'kb', fileName: string) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadFileName(fileName);
    
    const setStatus = (status: VersionStatus) => {
      const updateFn = (v: ResourceVersion) => v.id === versionId ? { ...v, status } : v;
      if (type === 'skill') {
        setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, versions: s.versions.map(updateFn) } : s));
      } else {
        setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, versions: kb.versions.map(updateFn) } : kb));
      }
    };

    setStatus(VersionStatus.UPLOADING);

    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 15;
      if (currentProgress >= 100) {
        setUploadProgress(100);
        clearInterval(interval);
        
        // Handle side effects outside of the interval progress calculation
        handleUploadFile(resourceId, versionId, type, fileName);
        setStatus(VersionStatus.DRAFT);
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
        }, 500);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 200);
  };

  const handleCreateVersion = (resourceId: string, type: 'skill' | 'kb') => {
    const newVersion: ResourceVersion = {
      id: `v${Date.now()}`,
      versionNumber: versionDraft.number,
      description: versionDraft.description,
      status: VersionStatus.DRAFT,
      files: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (type === 'skill') {
      setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, versions: [newVersion, ...s.versions], updatedAt: '刚刚' } : s));
    } else {
      setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, versions: [newVersion, ...kb.versions], updatedAt: '刚刚' } : kb));
    }
    setIsCreatingVersion(false);
    setVersionDraft({ number: '', description: '' });
  };

  const handleCompileVersion = (resourceId: string, versionId: string, type: 'skill' | 'kb') => {
    const updateFn = (v: ResourceVersion) => v.id === versionId ? { ...v, status: VersionStatus.COMPILING, logs: ['[系统] 正在启动编译控制台...', '[编译器] 正在解析源文件结构...', '[优化器] 正在执行向量化压缩...'] } : v;
    
    if (type === 'skill') {
      setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, versions: s.versions.map(updateFn) } : s));
    } else {
      setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, versions: kb.versions.map(updateFn) } : kb));
    }

    // Simulate async compilation
    setTimeout(() => {
      const finishFn = (v: ResourceVersion) => v.id === versionId ? { ...v, status: VersionStatus.SUCCESS, logs: [...(v.logs || []), '[成功] 编译任务已完成，资源包已就绪。'] } : v;
      if (type === 'skill') {
        setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, versions: s.versions.map(finishFn) } : s));
      } else {
        setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, versions: kb.versions.map(finishFn) } : kb));
      }
    }, 3000);
  };

  const handlePublishVersion = (resourceId: string, versionId: string, type: 'skill' | 'kb') => {
    const updateFn = (v: ResourceVersion) => v.id === versionId ? { ...v, status: VersionStatus.PUBLISHED, publishedAt: new Date().toISOString().split('T')[0] } : v;
    
    if (type === 'skill') {
      setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, activeVersionId: versionId, versions: s.versions.map(updateFn) } : s));
    } else {
      setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, activeVersionId: versionId, versions: kb.versions.map(updateFn) } : kb));
    }
  };

  const handleSwitchActiveVersion = (resourceId: string, versionId: string, type: 'skill' | 'kb') => {
    if (type === 'skill') {
      setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, activeVersionId: versionId } : s));
    } else {
      setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, activeVersionId: versionId } : kb));
    }
  };

  const handleUploadFile = (resourceId: string, versionId: string, type: 'skill' | 'kb', fileName: string) => {
    const updateFn = (v: ResourceVersion) => v.id === versionId ? { 
      ...v, 
      files: v.files.includes(fileName) ? v.files : [...v.files, fileName] 
    } : v;
    if (type === 'skill') {
      setSkills(prev => prev.map(s => s.id === resourceId ? { ...s, versions: s.versions.map(updateFn) } : s));
    } else {
      setKbs(prev => prev.map(kb => kb.id === resourceId ? { ...kb, versions: kb.versions.map(updateFn) } : kb));
    }
  };

  const handleCreateAgent = () => {
    const newAgent: Agent = {
      id: `a${Date.now()}`,
      name: resourceDraft.name,
      description: resourceDraft.description,
      status: ResourceStatus.DRAFT,
      boundSkills: [],
      boundKBs: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAgents([...agents, newAgent]);
    setIsCreatingAgent(false);
    setResourceDraft({ name: '', description: '', type: 'instruction' });
  };

  const handleCreateSkill = () => {
    const newSkill: Skill = {
      id: `s${Date.now()}`,
      name: resourceDraft.name,
      description: resourceDraft.description,
      type: resourceDraft.type as any,
      status: ResourceStatus.ACTIVE,
      versions: [],
      updatedAt: '刚刚'
    };
    setSkills([...skills, newSkill]);
    setIsCreatingSkill(false);
    setResourceDraft({ name: '', description: '', type: 'instruction' });
  };

  const handleCreateKB = () => {
    const newKB: KnowledgeBase = {
      id: `k${Date.now()}`,
      name: resourceDraft.name,
      description: resourceDraft.description,
      status: ResourceStatus.ACTIVE,
      size: '0 KB',
      chunkCount: 0,
      versions: [],
      updatedAt: '刚刚'
    };
    setKbs([...kbs, newKB]);
    setIsCreatingKB(false);
    setResourceDraft({ name: '', description: '', type: 'instruction' });
  };

  const toggleResourceBinding = (agentId: string, resourceId: string, type: 'skill' | 'kb') => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      const listField = type === 'skill' ? 'boundSkills' : 'boundKBs';
      const currentList = a[listField] as string[];
      const newList = currentList.includes(resourceId) 
        ? currentList.filter(id => id !== resourceId)
        : [...currentList, resourceId];
      return { ...a, [listField]: newList };
    }));
  };

  const deleteResource = (id: string, type: 'agent'|'skill'|'kb') => {
    if (type === 'agent') setAgents(agents.filter(a => a.id !== id));
    if (type === 'skill') setSkills(skills.filter(s => s.id !== id));
    if (type === 'kb') setKbs(kbs.filter(k => k.id !== id));
  };

  const renderTenantManagement = () => (
    <motion.div 
      key="tenants-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="m3-card !p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-display font-bold flex items-center gap-3 italic uppercase tracking-wider">
            <Key className="w-5 h-5 text-primary" />
            凭据管理器 (Credentials)
          </h2>
          <button className="bg-primary text-bg px-6 py-2.5 text-xs font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary">
            <Plus className="w-4 h-4" /> 生成全新密钥对
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-ink-muted uppercase font-mono tracking-widest opacity-40">
                <th className="pb-4 px-6 font-bold">租户节点 (Tenant)</th>
                <th className="pb-4 px-6 font-bold">Access Key ID</th>
                <th className="pb-4 px-6 font-bold">SHA256 密钥对</th>
                <th className="pb-4 px-6 font-bold">系统状态</th>
                <th className="pb-4 px-6 text-right font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="group transition-all">
                  <td className="py-4 px-6 font-bold bg-surface-variant/20 rounded-l-2xl border-y border-l border-border/30 group-hover:bg-surface-variant/40">{t.name}</td>
                  <td className="py-4 px-6 font-mono text-primary/80 bg-surface-variant/20 border-y border-border/30 group-hover:bg-surface-variant/40 leading-none">{t.accessKeyId}</td>
                  <td className="py-4 px-6 font-mono bg-surface-variant/20 border-y border-border/30 group-hover:bg-surface-variant/40 leading-none">
                    {showSK[t.id] ? t.secretAccessKey : 'SK_••••••••••••••••••••••••'}
                  </td>
                  <td className="py-4 px-6 bg-surface-variant/20 border-y border-border/30 group-hover:bg-surface-variant/40">
                    <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 text-[10px] font-bold uppercase tracking-wider">活跃</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-4 bg-surface-variant/20 rounded-r-2xl border-y border-r border-border/30 group-hover:bg-surface-variant/40">
                    <button 
                      onClick={() => setShowSK(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                      className="text-primary font-bold hover:underline uppercase tracking-tighter"
                    >
                      {showSK[t.id] ? '隐藏' : '显示'}
                    </button>
                    <button className="text-ink-muted hover:text-primary transition-colors inline-block align-middle" title="重置密钥对"><RefreshCcw className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-2xl flex gap-5 text-xs text-secondary/90 shadow-[inset_0_0_20px_rgba(202,155,255,0.05)]">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
           <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="font-display font-bold mb-2 text-sm uppercase tracking-wider">安全加密指南</p>
          <p className="leading-relaxed opacity-70">租户密钥采用高级加密标准存储。我们建议每隔 90 个操作周期轮换一次 SK 密钥对。请避免将 SK 密钥硬编码在环境变量或本地配置缓冲区中。</p>
        </div>
      </div>
    </motion.div>
  );

  const renderAPICenter = () => (
    <motion.div 
      key="api-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="m3-card flex justify-between items-center bg-surface-variant/20 border-border/40">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight italic uppercase">API 服务中心 (Service Center)</h2>
          <p className="text-xs text-ink-muted mt-2 font-medium opacity-60">为租户提供的标准化 API 使用指南与实时接口调试工具</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface-variant/50 border border-border px-4 py-2 text-[10px] font-bold rounded-xl uppercase tracking-widest hover:bg-surface-variant transition-all">
            文档导出 (PDF)
          </button>
          <button className="bg-primary text-bg px-5 py-2 text-[10px] font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary uppercase tracking-widest">
            <Rocket className="w-3.5 h-3.5" /> 访问控制
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API List & Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="m3-card !p-6">
            <h3 className="font-display font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2 opacity-80">
              <Code className="w-4 h-4 text-primary" />
              可用接口列表
            </h3>
            <div className="space-y-2">
              {[
                { method: 'POST', path: '/v1/agent/query', label: '智能体对话接口', active: true },
                { method: 'GET', path: '/v1/resource/list', label: '资源目录查询' },
                { method: 'POST', path: '/v1/kb/search', label: '知识库向量检索' },
              ].map((api, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${api.active ? 'bg-primary/10 border-primary/40' : 'bg-surface-variant/20 border-border/40 hover:border-primary/20'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${api.method === 'POST' ? 'bg-primary text-bg' : 'bg-tertiary text-bg'}`}>{api.method}</span>
                    <span className="text-[10px] font-mono text-ink-muted opacity-50 underline decoration-dotted tracking-tighter">Production v2</span>
                  </div>
                  <p className="text-sm font-bold tracking-tight mt-2">{api.label}</p>
                  <p className="text-[10px] font-mono text-ink-muted mt-1 opacity-60 truncate">{api.path}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-2xl flex gap-4 text-xs text-secondary/90">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold mb-1 uppercase tracking-wider">身份验证 (Security)</p>
              <p className="leading-relaxed opacity-70">所有请求必须在 Header 中包含 X-Nexus-Key 与签名校验码。密钥请在“凭据管理”模块获取。</p>
            </div>
          </div>
        </div>

        {/* Console / Implementation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="m3-card !p-8 bg-surface-dark border-border/60">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold tracking-tight text-white">接口测试控制台 (Playground)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">POST · /v1/agent/query</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-[10px] text-tertiary font-bold bg-tertiary/10 px-3 py-1.5 rounded-lg border border-tertiary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Live System
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Request */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Request Body (JSON)</label>
                  <button className="text-[10px] text-primary hover:underline font-bold">RESET</button>
                </div>
                <div className="bg-zinc-900 rounded-2xl p-4 font-mono text-xs text-zinc-300 border border-zinc-800 shadow-inner min-h-[300px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20 hover:opacity-100 transition-opacity">
                    <Copy className="w-4 h-4 cursor-pointer" />
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-blue-300">
{`{
  "agent_id": "a1",
  "query": "你好，我想了解入职指南",
  "session_id": "sess_${Math.random().toString(16).slice(2, 10)}",
  "stream": true,
  "context_depth": 3
}`}
                  </pre>
                </div>
                <button className="w-full bg-primary text-bg py-3.5 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary flex items-center justify-center gap-3 uppercase tracking-widest">
                  <Play className="w-4 h-4 fill-current" /> 发送测试请求
                </button>
              </div>

              {/* Response */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Response (Output)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-600">STATUS:</span>
                    <span className="text-[9px] font-bold text-tertiary">200 OK</span>
                    <span className="text-[9px] font-bold text-zinc-600 ml-2">TIME:</span>
                    <span className="text-[9px] font-bold text-white">124ms</span>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-2xl p-4 font-mono text-xs text-zinc-500 border border-zinc-800 shadow-inner min-h-[300px] overflow-auto">
                   <div className="space-y-3">
                      <p className="text-zinc-400"># Response Header</p>
                      <p>Content-Type: application/json</p>
                      <p>X-Trace-Id: nexus-rt-82711</p>
                      <p className="text-zinc-400 mt-4"># Response Body</p>
                      <pre className="text-tertiary/70 leading-relaxed">
{`{
  "status": "success",
  "data": {
    "reply": "您好！关于入职指南...",
    "source_nodes": ["kb_hr_01", "kb_hr_04"],
    "usage": {
      "prompt_tokens": 124,
      "completion_tokens": 512
    }
  }
}`}
                      </pre>
                   </div>
                </div>
                <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono italic">
                    <Activity className="w-3.5 h-3.5 text-primary opacity-50" />
                    <span>Real-time streaming enabled. Response latency within cluster SLA (200ms).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="m3-card !p-8">
            <h4 className="text-base font-bold mb-6 tracking-tight flex items-center gap-3 uppercase italic">
              <BookOpen className="w-5 h-5 text-secondary" />
              快速集成示例 (CURL)
            </h4>
            <div className="bg-surface-variant/20 rounded-2xl p-6 font-mono text-xs text-ink/80 border border-border/30 relative">
               <div className="absolute top-0 right-0 p-4">
                 <button className="p-2 hover:bg-surface-variant rounded-lg transition-all text-ink-muted hover:text-primary">
                    <Copy className="w-4 h-4" />
                 </button>
               </div>
               <pre className="whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://api.nexus.ai/v1/agent/query \\
     -H "Content-Type: application/json" \\
     -H "X-Nexus-Key: [YOUR_ACCESS_KEY]" \\
     -H "X-Nexus-Sign: [HASH_SIGNATURE]" \\
     -d '{
       "agent_id": "a1",
       "query": "Hello world"
     }'`}
               </pre>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderKBManagement = () => {
    if (selectedResourceId?.type === 'kb') {
      return (
        <ResourceManagementView 
          resourceId={selectedResourceId.id} 
          type="kb" 
          skills={skills} 
          kbs={kbs} 
          setSelectedResourceId={setSelectedResourceId}
          setVersionDraft={setVersionDraft}
          setIsCreatingVersion={setIsCreatingVersion}
          handleSwitchActiveVersion={handleSwitchActiveVersion}
          handleCompileVersion={handleCompileVersion}
          handlePublishVersion={handlePublishVersion}
          handleUploadFile={handleUploadFile}
          setIsUploading={setIsUploading}
          simulateUpload={simulateUpload}
        />
      );
    }

    return (
      <motion.div 
        key="kbs-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="m3-card flex justify-between items-center bg-surface-variant/20">
          <div>
            <h2 className="text-xl font-display font-bold tracking-tight italic uppercase">知识库中心</h2>
            <p className="text-xs text-ink-muted mt-2 font-medium opacity-60">企业级非结构化数据向量化存储与动态索引管理</p>
          </div>
          <button 
            onClick={() => {
              setResourceDraft({ name: '', description: '', type: 'kb' });
              setIsCreatingKB(true);
            }}
            className="bg-primary text-bg px-6 py-2.5 text-xs font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary"
          >
            <Plus className="w-4 h-4" /> 新建知识库
          </button>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-display"
        >
          <AnimatePresence mode="popLayout">
            {kbs.map((kb, i) => {
              const activeVersion = kb.versions.find(v => v.id === kb.activeVersionId);
              return (
                <motion.div 
                  key={kb.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="m3-card !p-0 overflow-hidden group flex flex-col"
                >
                  <div className="p-6 border-b border-border bg-surface-variant/5 group-hover:bg-surface-variant/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center border border-tertiary/20 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-shadow">
                          <Database className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base tracking-tight">{kb.name}</h3>
                          <p className="text-[10px] text-tertiary/60 font-mono font-bold tracking-tighter mt-0.5">UID: {kb.id.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-widest ${kb.activeVersionId ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-ink/5 text-ink-muted border-border'}`}>
                        {kb.activeVersionId ? '活跃' : '草稿'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-4 line-clamp-2 min-h-[2.5rem] leading-relaxed font-sans opacity-70 italic">{kb.description || '暂无描述信息'}</p>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border/10">
                        <p className="text-[9px] text-ink-muted font-bold uppercase tracking-widest opacity-40 mb-1">活跃版本</p>
                        <p className="text-xs font-mono font-bold">{activeVersion?.versionNumber || 'NONE'}</p>
                      </div>
                      <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border/10">
                        <p className="text-[9px] text-ink-muted font-bold uppercase tracking-widest opacity-40 mb-1">索引规格</p>
                        <p className="text-xs font-mono font-bold truncate">{kb.size} / {kb.chunkCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedResourceId({ id: kb.id, type: 'kb' })}
                        className="flex-1 bg-ink text-bg px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ink/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        管理
                      </button>
                      <button 
                        onClick={() => deleteResource(kb.id, 'kb')}
                        className="p-2.5 text-ink-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {kbs.length === 0 && (
            <div className="col-span-full py-32 border-2 border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center text-ink-muted/30">
               <Database className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-display font-bold uppercase tracking-[0.2em] italic">知识库中心为空</p>
               <p className="text-[10px] font-mono mt-2 uppercase tracking-widest text-center">暂未检测到任何非结构化资产分区</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  const renderSkillManagement = () => {
    if (selectedResourceId?.type === 'skill') {
      return (
        <ResourceManagementView 
          resourceId={selectedResourceId.id} 
          type="skill" 
          skills={skills} 
          kbs={kbs} 
          setSelectedResourceId={setSelectedResourceId}
          setVersionDraft={setVersionDraft}
          setIsCreatingVersion={setIsCreatingVersion}
          handleSwitchActiveVersion={handleSwitchActiveVersion}
          handleCompileVersion={handleCompileVersion}
          handlePublishVersion={handlePublishVersion}
          handleUploadFile={handleUploadFile}
          setIsUploading={setIsUploading}
          simulateUpload={simulateUpload}
        />
      );
    }

    return (
      <motion.div 
        key="skills-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="m3-card flex justify-between items-center bg-surface-variant/20">
          <div>
            <h2 className="text-xl font-display font-bold tracking-tight italic uppercase">技能中心</h2>
            <p className="text-xs text-ink-muted mt-2 font-medium opacity-60">生产级原子能力集与复杂逻辑编排工作流</p>
          </div>
          <button 
            onClick={() => {
              setResourceDraft({ name: '', description: '', type: 'instruction' });
              setIsCreatingSkill(true);
            }}
            className="bg-primary text-bg px-6 py-2.5 text-xs font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary"
          >
            <Plus className="w-4 h-4" /> 新建技能
          </button>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-display"
        >
          <AnimatePresence mode="popLayout">
            {skills.map((skill, i) => {
              const activeVersion = skill.versions.find(v => v.id === skill.activeVersionId);
              return (
                <motion.div 
                  key={skill.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="m3-card !p-0 overflow-hidden group flex flex-col"
                >
                  <div className="p-6 border-b border-border bg-surface-variant/5 group-hover:bg-surface-variant/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-shadow group-hover:shadow-[0_0_15px_rgba(202,155,255,0.2)] ${skill.type === 'instruction' ? 'bg-secondary/10 text-secondary border-secondary/20' : skill.type === 'workflow' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                          <Box className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base tracking-tight">{skill.name}</h3>
                          <p className="text-[10px] text-ink-muted font-mono font-bold tracking-tighter mt-0.5 opacity-50">UID: {skill.id.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-widest ${skill.activeVersionId ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-ink/5 text-ink-muted border-border'}`}>
                        {skill.activeVersionId ? '活跃' : '草稿'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-4 line-clamp-2 min-h-[2.5rem] leading-relaxed font-sans opacity-70 italic">{skill.description || '暂无描述信息'}</p>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border/10">
                        <p className="text-[9px] text-ink-muted font-bold uppercase tracking-widest opacity-40 mb-1">活跃版本</p>
                        <p className="text-xs font-mono font-bold uppercase">{activeVersion?.versionNumber || 'NONE'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedResourceId({ id: skill.id, type: 'skill' })}
                        className="flex-1 bg-ink text-bg px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ink/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        管理
                      </button>
                      <button 
                        onClick={() => deleteResource(skill.id, 'skill')}
                        className="p-2.5 text-ink-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {skills.length === 0 && (
            <div className="col-span-full py-32 border-2 border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center text-ink-muted/30">
               <Box className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-display font-bold uppercase tracking-[0.2em] italic">技能列表为空</p>
               <p className="text-[10px] font-mono mt-2 uppercase tracking-widest text-center">当前无可供挂载的原子技能集</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  const renderAgentManagement = () => {
    if (selectedAgentId) {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (!agent) return null;

      return (
        <motion.div 
          key={`agent-auth-${agent.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="p-3 bg-surface-variant/30 hover:bg-surface-variant rounded-2xl transition-colors border border-border"
            >
              <ArrowRight className="w-5 h-5 rotate-180 text-ink" />
            </button>
            <div>
              <h2 className="text-xl font-display font-bold tracking-tight">资源授权: {agent.name}</h2>
              <p className="text-xs text-ink-muted font-medium opacity-60">为智能体分配来自技能中心与知识库中心的资源</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skill Auth */}
            <div className="m3-card !p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-variant/10">
                <h3 className="text-sm font-display font-bold flex items-center gap-2 text-primary tracking-wide uppercase"><BookOpen className="w-4 h-4" /> 已授权技能 (Skills)</h3>
                <span className="text-[10px] text-ink-muted font-mono">v2.4_同步中</span>
              </div>
              <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {skills.filter(s => s.status === ResourceStatus.ACTIVE).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-surface-variant/20 border border-border/50 rounded-2xl hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={agent.boundSkills.includes(s.id)}
                          onChange={() => toggleResourceBinding(agent.id, s.id, 'skill')}
                          className="w-5 h-5 rounded-lg border-border bg-surface-variant text-primary focus:ring-primary/50 cursor-pointer"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-ink-muted font-mono uppercase opacity-50">关联ID: {s.id} • {s.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {skills.filter(s => s.status === ResourceStatus.ACTIVE).length === 0 && (
                  <div className="py-20 text-center text-xs text-ink-muted italic opacity-40 font-mono tracking-widest leading-loose uppercase">
                    未检测到活跃技能<br/>[等待编译完成]
                  </div>
                )}
              </div>
            </div>

            {/* KB Auth */}
            <div className="m3-card !p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-variant/10">
                <h3 className="text-sm font-display font-bold flex items-center gap-2 text-tertiary tracking-wide uppercase"><Database className="w-4 h-4" /> 已授权知识库 (KB)</h3>
                <span className="text-[10px] text-ink-muted font-mono">v1.1_已索引</span>
              </div>
              <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {kbs.filter(k => k.status === ResourceStatus.ACTIVE).map(kb => (
                  <div key={kb.id} className="flex items-center justify-between p-4 bg-surface-variant/20 border border-border/50 rounded-2xl hover:border-tertiary/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        checked={agent.boundKBs.includes(kb.id)}
                        onChange={() => toggleResourceBinding(agent.id, kb.id, 'kb')}
                        className="w-5 h-5 rounded-lg border-border bg-surface-variant text-tertiary focus:ring-tertiary/50 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold tracking-tight">{kb.name}</p>
                        <p className="text-[10px] text-ink-muted font-mono uppercase opacity-50">{kb.size} • {kb.chunkCount} 条索引</p>
                      </div>
                    </div>
                  </div>
                ))}
                {kbs.filter(k => k.status === ResourceStatus.ACTIVE).length === 0 && (
                  <div className="py-20 text-center text-xs text-ink-muted italic opacity-40 font-mono tracking-widest leading-loose uppercase">
                    未检测到就绪知识库<br/>[等待向量化索引]
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="bg-primary text-bg px-10 py-3 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary uppercase"
            >
              Confirm Authorization
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="agents-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="m3-card flex justify-between items-center bg-surface-variant/20">
          <div>
            <h2 className="text-xl font-display font-bold tracking-tight italic uppercase">智能体中心</h2>
            <p className="text-xs text-ink-muted mt-2 font-medium opacity-60">生产级智能体生命周期管理与动态资源挂载</p>
          </div>
          <button 
            onClick={() => setIsCreatingAgent(true)}
            className="bg-primary text-bg px-6 py-2.5 text-xs font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg glow-primary"
          >
            <Plus className="w-4 h-4" /> 新建智能体
          </button>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-display"
        >
          <AnimatePresence mode="popLayout">
            {agents.map((agent, i) => (
              <motion.div 
                key={agent.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="m3-card !p-0 overflow-hidden group flex flex-col"
              >
                <div className="p-6 border-b border-border bg-surface-variant/5 group-hover:bg-surface-variant/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base tracking-tight">{agent.name}</h3>
                      <p className="text-[10px] text-primary/60 font-mono font-bold tracking-tighter mt-0.5">UID: {agent.id.toUpperCase()}</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-ink-muted hover:bg-surface-variant rounded-xl transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-ink-muted mt-4 line-clamp-2 min-h-[2.5rem] leading-relaxed font-sans">{agent.description}</p>
              </div>
              
              <div className="p-6 flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-variant/30 p-3.5 rounded-2xl border border-border/30">
                    <p className="text-[9px] text-ink-muted uppercase font-bold mb-1.5 tracking-widest opacity-50">已挂载技能</p>
                    <p className="text-base font-bold flex items-center justify-between tracking-tight">
                      {agent.boundSkills.length} <BookOpen className="w-4 h-4 text-primary opacity-60" />
                    </p>
                  </div>
                  <div className="bg-surface-variant/30 p-3.5 rounded-2xl border border-border/30 flex-1">
                    <p className="text-[9px] text-ink-muted uppercase font-bold mb-1.5 tracking-widest opacity-50">关联知识库</p>
                    <p className="text-base font-bold flex items-center justify-between tracking-tight">
                      {agent.boundKBs.length} <Database className="w-4 h-4 text-tertiary opacity-60" />
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-ink-muted uppercase font-mono tracking-tighter opacity-50">Runtime</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ring-4 ring-current/10 ${agent.status === ResourceStatus.ACTIVE ? 'bg-tertiary text-tertiary' : 'bg-ink-muted/30 text-ink-muted/30'}`}></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">{agent.status === ResourceStatus.ACTIVE ? 'Running' : 'Draft'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="w-10 h-10 flex items-center justify-center text-ink-muted hover:bg-primary/20 hover:text-primary rounded-xl transition-all border border-border hover:border-primary/30"
                      title="配置授权"
                    >
                      <Layers className="w-4.5 h-4.5" />
                    </button>
                    <button className="px-5 py-2 border border-border text-xs font-bold rounded-xl hover:bg-surface-variant transition-all tracking-wide uppercase">版本管理</button>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-surface-variant/10 border-t border-border flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                <span className="text-[10px] text-ink-muted font-mono opacity-50 truncate">Release Tag: {agent.publishedVersion || 'Latest Stable'}</span>
                <button className="text-[10px] text-primary flex items-center gap-1.5 hover:underline font-bold uppercase tracking-wider">
                  Open Workbench <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen flex bg-bg overflow-hidden text-ink font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePortal={activePortal} 
        setActivePortal={setActivePortal} 
        activeItem={activeItem} 
        setActiveItem={setActiveItem} 
      />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simplified Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 shrink-0 z-30">
          <div className="flex items-center gap-6">
            <h1 className="font-display text-base font-bold tracking-tight text-ink uppercase">
              <span className="text-primary mr-2 opacity-50">/</span>
              {{
                'p-overview': '总体预览',
                'p-tenants': '租户管理',
                'p-ops': '平台运维',
                'p-audit': '审计日志',
                't-dashboard': '控制面板',
                't-agents': '智能体中心',
                't-skills': '技能中心',
                't-kb': '知识库中心',
                't-credentials': '凭据管理',
                't-audit': '操作审计',
                'a-explorer': 'API 服务中心',
                'a-samples': '集成开发指南'
              }[activeItem] || activeItem.split('-')[1]?.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-tertiary/10 border border-tertiary/20 rounded-full text-[10px] text-tertiary font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              核心集群在线 (Nexus Core Online)
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 border-r border-border pr-6 mr-2 h-8">
              <button className="text-ink-muted hover:text-primary font-medium text-[11px] transition-colors tracking-wide">帮助中心</button>
              <button className="text-ink-muted hover:text-primary font-medium text-[11px] transition-colors tracking-wide">提交工单</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-ink font-bold leading-none mb-1">Joseph Liu</p>
                <p className="text-[9px] text-ink-muted uppercase font-mono tracking-tighter">超级管理员</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-display font-bold text-sm border border-primary/20">
                JL
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative bg-gray-50/30">
          {(activeItem === 'a-explorer' || activeItem === 'a-samples' || activePortal === 'api') && renderAPICenter()}
          {activeItem === 't-credentials' && renderTenantManagement()}
          {activeItem === 't-kb' && renderKBManagement()}
          {activeItem === 't-skills' && renderSkillManagement()}
          {activeItem === 't-agents' && renderAgentManagement()}
          {activeItem === 't-dashboard' && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: '活跃智能体', val: agents.length, icon: Cpu, color: 'text-primary' },
                    { label: '总技能包', val: skills.length, icon: Box, color: 'text-secondary' },
                    { label: '知识库文档', val: kbs.length, icon: Database, color: 'text-tertiary' },
                    { label: '月均调用量', val: '28.4k', icon: Zap, color: 'text-orange-400' },
                  ].map((stat, i) => (
                    <div key={i} className="m3-card !p-5 flex items-center justify-between cursor-default">
                      <div>
                        <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest leading-none mb-2">{stat.label}</p>
                        <p className="text-3xl font-display font-bold tracking-tight">{stat.val}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-current opacity-10 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="m3-card">
                    <h3 className="font-display font-bold text-sm mb-6 flex items-center gap-2 italic uppercase tracking-wider opacity-80">
                      <Activity className="w-4 h-4 text-primary" />
                      系统遥测日志 (System Telemetry)
                    </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-surface-variant/20 rounded-xl text-xs border border-border/30 group hover:border-primary/20 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(165,214,167,0.5)]" />
                      <span className="font-mono text-ink-muted opacity-50">13:42:01</span>
                      <span className="font-medium text-ink tracking-tight">编译器节点: [基础对话策略包] v1.2.0 编译成功</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-surface-variant/20 rounded-xl text-xs border border-border/30 group hover:border-primary/20 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(155,169,255,0.5)]" />
                      <span className="font-mono text-ink-muted opacity-50">13:30:15</span>
                      <span className="font-medium text-ink tracking-tight">索引服务: 任务 KB_IDX_920 已同步到生产环境 BUCKET</span>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {activeItem === 't-audit' && (
            <div className="bg-white border border-border rounded shadow-sm p-6 text-center py-20 italic text-ink-muted text-xs">
              审计日志每月归档。当前仅显示最近 7 天的活跃记录。
            </div>
          )}
        </main>
      </div>

      {/* Modals for lifecycle loop */}
      <Modal 
        isOpen={isCreatingAgent} 
        onClose={() => setIsCreatingAgent(false)} 
        title="新建智能体"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">智能体名称 (Alias)</label>
            <input 
              type="text" 
              value={resourceDraft.name}
              onChange={(e) => setResourceDraft({ ...resourceDraft, name: e.target.value })}
              placeholder="例如：CUSTOMER_SERVICE_O1" 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors hover:bg-surface-variant/50 font-medium font-sans" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">角色定义与指令描述</label>
            <textarea 
              value={resourceDraft.description}
              onChange={(e) => setResourceDraft({ ...resourceDraft, description: e.target.value })}
              placeholder="描述智能体的核心指令、操作边界以及预期行为..." 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:border-primary transition-colors hover:bg-surface-variant/50 font-medium resize-none font-sans" 
            />
          </div>
          <button 
            disabled={!resourceDraft.name}
            onClick={handleCreateAgent}
            className="w-full bg-primary text-bg py-3 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary uppercase tracking-widest disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            立即创建
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        title="上传进展 (Uploading)"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                资源包同步中...
              </span>
              <span className="text-primary font-mono">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden border border-border/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-primary shadow-[0_0_10px_rgba(155,169,255,0.5)]"
              />
            </div>
            <div className="p-4 bg-surface-variant/30 rounded-2xl border border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border/30">
                  <FileText className="w-5 h-5 text-primary opacity-60" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold truncate tracking-tight">{uploadFileName || '正在处理文件...'}</p>
                  <p className="text-[10px] text-ink-muted font-mono uppercase opacity-40 mt-0.5">
                    {uploadProgress < 100 ? '正在加密传输 (E2EE)' : '校验 MD5 哈希完成'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-ink-muted bg-surface-variant/10 p-3 rounded-xl border border-border/10 italic">
               <Activity className="w-4 h-4 text-primary opacity-40" />
               正在建立与 Nexus Core 的专线连接...
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isCreatingKB} 
        onClose={() => setIsCreatingKB(false)} 
        title="创建新知识库"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">名称</label>
            <input 
              type="text" 
              value={resourceDraft.name}
              onChange={(e) => setResourceDraft({ ...resourceDraft, name: e.target.value })}
              placeholder="例如：CORPORATE_WIKI_2024" 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">描述</label>
            <textarea 
              value={resourceDraft.description}
              onChange={(e) => setResourceDraft({ ...resourceDraft, description: e.target.value })}
              placeholder="简要描述该知识库覆盖的范围..." 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm h-24 focus:outline-none focus:border-primary transition-colors font-medium resize-none" 
            />
          </div>
          <button 
            disabled={!resourceDraft.name}
            onClick={handleCreateKB}
            className="w-full bg-primary text-bg py-4 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary uppercase tracking-widest disabled:opacity-50"
          >
            完成创建
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isCreatingSkill} 
        onClose={() => setIsCreatingSkill(false)} 
        title="创建新技能"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">技能名称</label>
            <input 
              type="text" 
              value={resourceDraft.name}
              onChange={(e) => setResourceDraft({ ...resourceDraft, name: e.target.value })}
              placeholder="例如：ORDER_QUERY_SERVICE" 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">功能描述</label>
            <textarea 
              value={resourceDraft.description}
              onChange={(e) => setResourceDraft({ ...resourceDraft, description: e.target.value })}
              placeholder="描述技能逻辑、核心功能以及约束条件..." 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm h-24 focus:outline-none focus:border-primary transition-colors font-medium resize-none" 
            />
          </div>
          <button 
            disabled={!resourceDraft.name}
            onClick={handleCreateSkill}
            className="w-full bg-primary text-bg py-4 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary uppercase tracking-widest disabled:opacity-50"
          >
            立即创建
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isCreatingVersion} 
        onClose={() => setIsCreatingVersion(false)} 
        title={`创建新版本: ${selectedResourceId?.type === 'skill' ? '技能' : '知识库'}`}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">版本号</label>
            <input 
              type="text" 
              value={versionDraft.number}
              onChange={(e) => setVersionDraft({ ...versionDraft, number: e.target.value })}
              placeholder="例如：v1.2.0" 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-muted uppercase block tracking-[0.1em] opacity-60">变更日志 / 描述</label>
            <textarea 
              value={versionDraft.description}
              onChange={(e) => setVersionDraft({ ...versionDraft, description: e.target.value })}
              placeholder="本版本的主要更新内容和错误修复..." 
              className="w-full bg-surface-variant/30 border border-border rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:border-primary transition-colors font-medium resize-none" 
            />
          </div>
          <button 
            disabled={!versionDraft.number}
            onClick={() => selectedResourceId && handleCreateVersion(selectedResourceId.id, selectedResourceId.type)}
            className="w-full bg-primary text-bg py-4 rounded-2xl font-display font-bold text-sm shadow-xl hover:scale-105 transition-all glow-primary uppercase tracking-widest disabled:opacity-50"
          >
            立即创建
          </button>
        </div>
      </Modal>
    </div>
  );
}
