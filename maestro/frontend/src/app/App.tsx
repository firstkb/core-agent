import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { MaestroAPI, apiBaseURL } from '../api/client';
import type {
  AgentCapability,
  AgentLaunch,
  AgentLaunchInput,
  AgentRun,
  AgentRunCheckpointInput,
  AgentRunInput,
  ArtifactReadResult,
  Approval,
  Attempt,
  AttemptInput,
  AttemptSubmitInput,
  CockpitState,
  Evidence,
  EvidenceAttachmentInput,
  Stage,
  StageInput,
  Task,
  TaskDetail,
  TaskInput,
  TaskPacket,
  TaskPacketGenerateInput,
  Work
} from '../api/types';
import { MetricStrip } from '../components/MetricStrip';
import { StatusChip } from '../components/StatusChip';
import {
  filterTasks,
  formatDate,
  latestEvidence,
  riskTone,
  shortID,
  stageProgress,
  statusTone,
  taskGateSignal,
  workTitle
} from './viewModel';

type MainView = 'dashboard' | 'table' | 'agent-runs' | 'artifacts';
type DetailTab = 'overview' | 'evidence' | 'artifacts' | 'agent';
type StageAction = 'start' | 'pause' | 'resume' | 'cancel';
type StageReviewDecision = 'accept' | 'revise' | 'block' | 'cancel';
type ApprovalDecision = 'approved' | 'rejected';
type AgentRunAction = 'start' | 'pause' | 'resume' | 'cancel';
type LoadOptions = {
  silent?: boolean;
};

type IntakeInput = {
  workTitle: string;
  taskTitle: string;
  description: string;
  workType: string;
  riskLevel: string;
  priority: string;
  stackScope: string;
  agentRole: string;
  stageName: string;
  checkpointPolicy: string;
};

type AgentRunCreateInput = {
  stageID: string;
  agentRole: string;
  checkpoint: string;
};

type AttemptCreateInput = {
  stageID: string;
  agentRole: string;
};

type PacketGenerateInput = {
  stageID: string;
  agentRole: string;
};

type ArtifactItem = {
  id: string;
  title: string;
  kind: 'artifact' | 'json' | 'markdown';
  source: string;
  uri?: string;
  content?: string;
  contentType?: string;
  createdAt?: string;
};

type WorkGroup = {
  work: Work;
  tasks: Task[];
  currentTask: Task | null;
  activeRun: AgentRun | null;
  requestedApproval: Approval | null;
  updatedAt: string;
  needsAttention: boolean;
};

const initialState: CockpitState = {
  health: null,
  work: [],
  tasks: [],
  approvals: [],
  agentCapabilities: [],
  agentRuns: [],
  runEvents: []
};

const COCKPIT_POLL_MS = 5000;
const DETAIL_POLL_MS = 3000;
const TASK_STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'Running' },
  { value: 'awaiting_review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' }
] as const;

export function App() {
  const api = useMemo(() => new MaestroAPI(), []);
  const [state, setState] = useState<CockpitState>(initialState);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [packetPreview, setPacketPreview] = useState<TaskPacket | null>(null);
  const [selectedTaskID, setSelectedTaskID] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeBusy, setIntakeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => state.tasks.find((task) => task.id === selectedTaskID) ?? null,
    [selectedTaskID, state.tasks]
  );
  const visibleTasks = useMemo(
    () => filterTasks(state.tasks, query, statusFilter),
    [query, state.tasks, statusFilter]
  );
  const openTask = useCallback((taskID: string, nextTab: DetailTab = 'overview') => {
    setSelectedTaskID(taskID);
    setDetailTab(nextTab);
  }, []);

  const load = useCallback(async (options: LoadOptions = {}) => {
    const silent = Boolean(options.silent);
    if (!silent) {
      setLoading(true);
    }
    try {
      const next = await api.loadCockpit();
      setState(next);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [api]);

  const loadDetail = useCallback(
    async (taskID: string, options: LoadOptions = {}) => {
      const silent = Boolean(options.silent);
      if (!silent) {
        setDetailLoading(true);
      }
      try {
        setDetail(await api.loadTaskDetail(taskID));
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        if (!silent) {
          setDetailLoading(false);
        }
      }
    },
    [api]
  );

  const refreshAfterCommand = useCallback(
    async (taskID: string | null) => {
      const [nextState, nextDetail] = await Promise.all([
        api.loadCockpit(),
        taskID ? api.loadTaskDetail(taskID) : Promise.resolve(null)
      ]);
      setState(nextState);
      setDetail(nextDetail);
    },
    [api]
  );

  const runCommand = useCallback(
    async (key: string, command: () => Promise<unknown>) => {
      setActionKey(key);
      setError(null);
      try {
        await command();
        await refreshAfterCommand(selectedTaskID);
      } catch (commandError) {
        setError(commandError instanceof Error ? commandError.message : String(commandError));
      } finally {
        setActionKey(null);
      }
    },
    [refreshAfterCommand, selectedTaskID]
  );

  const handleStageAction = useCallback(
    async (stage: Stage, action: StageAction) => {
      const commands: Record<StageAction, () => Promise<Stage>> = {
        start: () => api.startStage(stage.id),
        pause: () => api.pauseStage(stage.id),
        resume: () => api.resumeStage(stage.id),
        cancel: () => api.cancelStage(stage.id)
      };
      await runCommand(`stage:${stage.id}:${action}`, commands[action]);
    },
    [api, runCommand]
  );

  const handleStageReview = useCallback(
    async (stage: Stage, decision: StageReviewDecision) => {
      await runCommand(`stage:${stage.id}:review:${decision}`, () => api.reviewStage(stage.id, decision));
    },
    [api, runCommand]
  );

  const handleCreateAttempt = useCallback(
    async (task: Task, input: AttemptCreateInput) => {
      if (!input.stageID) {
        return;
      }
      const attemptInput: AttemptInput = {
        stage_id: input.stageID,
        agent_role: input.agentRole.trim() || task.agent_role || 'mason'
      };
      await runCommand(`attempt:${task.id}:create`, () => api.createAttempt(task.id, attemptInput));
    },
    [api, runCommand]
  );

  const handleSubmitAttempt = useCallback(
    async (attempt: Attempt, input: AttemptSubmitInput) => {
      if (!input.summary.trim()) {
        return;
      }
      await runCommand(`attempt:${attempt.id}:submit`, () => api.submitAttempt(attempt.id, input));
    },
    [api, runCommand]
  );

  const handleGenerateTaskPacket = useCallback(
    async (task: Task, input: PacketGenerateInput) => {
      const payload: TaskPacketGenerateInput = {
        task_id: task.id,
        stage_id: input.stageID,
        agent_role: input.agentRole.trim() || task.agent_role || 'mason'
      };
      setActionKey(`packet:${task.id}:generate`);
      setError(null);
      try {
        setPacketPreview(await api.generateTaskPacket(payload));
      } catch (packetError) {
        setError(packetError instanceof Error ? packetError.message : String(packetError));
      } finally {
        setActionKey(null);
      }
    },
    [api]
  );

  const handleLaunchTaskPacket = useCallback(
    async (task: Task, input: PacketGenerateInput) => {
      const payload: AgentLaunchInput = {
        task_id: task.id,
        stage_id: input.stageID,
        agent_role: input.agentRole.trim() || task.agent_role || 'mason',
        current_checkpoint: 'packet-ready',
        start: false
      };
      setActionKey(`packet:${task.id}:launch`);
      setError(null);
      try {
        const launch: AgentLaunch = await api.launchTaskPacket(payload);
        setPacketPreview(launch.packet);
        await refreshAfterCommand(task.id);
        setDetailTab('agent');
      } catch (launchError) {
        setError(launchError instanceof Error ? launchError.message : String(launchError));
      } finally {
        setActionKey(null);
      }
    },
    [api, refreshAfterCommand]
  );

  const handleApprovalDecision = useCallback(
    async (approval: Approval, decision: ApprovalDecision) => {
      await runCommand(`approval:${approval.id}:${decision}`, () => api.decideApproval(approval.id, decision));
    },
    [api, runCommand]
  );

  const handleCreateAgentRun = useCallback(
    async (task: Task, input: AgentRunCreateInput) => {
      const agentRole = input.agentRole.trim();
      if (!agentRole) {
        return;
      }
      const runInput: AgentRunInput = {
        work_id: task.work_id,
        task_id: task.id,
        stage_id: input.stageID || undefined,
        agent_role: agentRole,
        status: 'queued',
        current_checkpoint: input.checkpoint.trim(),
        metadata_json: {
          source: 'cockpit'
        }
      };
      await runCommand(`agent-run:${task.id}:create`, () => api.createAgentRun(runInput));
    },
    [api, runCommand]
  );

  const handleAgentRunAction = useCallback(
    async (run: AgentRun, action: AgentRunAction) => {
      const commands: Record<AgentRunAction, () => Promise<AgentRun>> = {
        start: () => api.startAgentRun(run.id),
        pause: () => api.pauseAgentRun(run.id),
        resume: () => api.resumeAgentRun(run.id),
        cancel: () => api.cancelAgentRun(run.id)
      };
      await runCommand(`agent-run:${run.id}:${action}`, commands[action]);
    },
    [api, runCommand]
  );

  const handleAgentRunCheckpoint = useCallback(
    async (run: AgentRun, input: AgentRunCheckpointInput) => {
      const checkpoint = input.checkpoint.trim();
      if (!checkpoint) {
        return;
      }
      await runCommand(`agent-run:${run.id}:checkpoint`, () =>
        api.checkpointAgentRun(run.id, {
          checkpoint,
          metadata_json: input.metadata_json ?? {
            source: 'cockpit'
          }
        })
      );
    },
    [api, runCommand]
  );

  const handleAttachEvidence = useCallback(
    async (input: EvidenceAttachmentInput) => {
      if (!selectedTaskID) {
        return;
      }
      await runCommand(`evidence:${selectedTaskID}:attach`, () => api.attachTaskEvidence(selectedTaskID, input));
    },
    [api, runCommand, selectedTaskID]
  );

  const handleReadArtifact = useCallback(
    async (uri: string) => api.readArtifact(uri),
    [api]
  );

  const handleCreateIntake = useCallback(
    async (input: IntakeInput) => {
      setIntakeBusy(true);
      setError(null);
      try {
        const description = input.description.trim();
        const work = await api.createWork({
          title: input.workTitle.trim(),
          description,
          type: input.workType,
          status: 'draft',
          artifact_shape: input.stageName === 'none' ? 'lightweight' : 'staged_task',
          risk_level: input.riskLevel,
          priority: input.priority,
          owner: 'owner'
        });

        const taskInput: TaskInput = {
          work_id: work.id,
          title: input.taskTitle.trim(),
          description,
          status: 'draft',
          lane: 'intake',
          stack_scope: input.stackScope,
          risk_level: input.riskLevel,
          priority: input.priority,
          assignee_type: 'agent',
          agent_role: input.agentRole
        };
        const task = await api.createTask(taskInput);

        if (input.stageName !== 'none') {
          const stageInput: StageInput = {
            name: input.stageName,
            status: 'pending',
            sequence: 1,
            agent_role: input.agentRole,
            checkpoint_policy: input.checkpointPolicy
          };
          await api.createStage(task.id, stageInput);
        }

        setSelectedTaskID(task.id);
        setDetailTab('overview');
        await refreshAfterCommand(task.id);
        setIntakeOpen(false);
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : String(createError));
      } finally {
        setIntakeBusy(false);
      }
    },
    [api, refreshAfterCommand]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void load({ silent: true });
      }
    };
    const interval = window.setInterval(refresh, COCKPIT_POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  useEffect(() => {
    if (selectedTaskID) {
      void loadDetail(selectedTaskID);
    } else {
      setDetail(null);
    }
    setPacketPreview(null);
  }, [loadDetail, selectedTaskID]);

  useEffect(() => {
    if (!selectedTaskID) {
      return undefined;
    }
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void loadDetail(selectedTaskID, { silent: true });
      }
    };
    const interval = window.setInterval(refresh, DETAIL_POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadDetail, selectedTaskID]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 64 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900
            }}
          >
            M
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h1" noWrap>
              Maestro Cockpit
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {apiBaseURL() || 'same-origin /api'}
            </Typography>
          </Box>
          <StatusChip label={state.health?.ok ? 'API Online' : 'API Unknown'} tone={state.health?.ok ? 'success' : 'warning'} />
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setIntakeOpen(true)}>
            New Work
          </Button>
          <Tooltip title="Refresh state">
            <IconButton aria-label="Refresh state" onClick={() => void load()}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex' }}>
        <Box
          component="nav"
          sx={{
            width: 68,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            minHeight: 'calc(100vh - 65px)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            py: 1.5,
            gap: 1
          }}
        >
          <Tooltip title="Dashboard" placement="right">
            <IconButton color={mainView === 'dashboard' ? 'primary' : 'default'} aria-label="Dashboard" onClick={() => setMainView('dashboard')}>
              <DashboardRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="New work" placement="right">
            <IconButton aria-label="New work" onClick={() => setIntakeOpen(true)}>
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Work queue" placement="right">
            <IconButton color={mainView === 'table' ? 'primary' : 'default'} aria-label="Work queue" onClick={() => setMainView('table')}>
              <TableRowsRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Agent runs" placement="right">
            <IconButton color={mainView === 'agent-runs' ? 'primary' : 'default'} aria-label="Agent runs" onClick={() => setMainView('agent-runs')}>
              <AccountTreeRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Artifacts" placement="right">
            <IconButton color={mainView === 'artifacts' ? 'primary' : 'default'} aria-label="Artifacts" onClick={() => setMainView('artifacts')}>
              <ArticleRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {mainView === 'dashboard' && (
              <DashboardView
                state={state}
                approvals={state.approvals}
                onOpenTable={() => setMainView('table')}
                onOpenRuns={() => setMainView('agent-runs')}
                onSelectTask={(task) => openTask(task.id)}
              />
            )}
            {mainView === 'table' && (
              <TaskWorkspace
                loading={loading}
                query={query}
                statusFilter={statusFilter}
                tasks={visibleTasks}
                work={state.work}
                approvals={state.approvals}
                runs={state.agentRuns}
                selectedTaskID={selectedTaskID}
                onQueryChange={setQuery}
                onStatusFilterChange={setStatusFilter}
                onSelectTask={(task) => openTask(task.id)}
              />
            )}
            {mainView === 'agent-runs' && (
              <AgentRunsWorkspace
                loading={loading}
                capabilities={state.agentCapabilities}
                runs={state.agentRuns}
                tasks={state.tasks}
                work={state.work}
                onSelectTask={(taskID) => openTask(taskID, 'agent')}
              />
            )}
            {mainView === 'artifacts' && (
              <ArtifactsWorkspace
                tasks={state.tasks}
                runs={state.agentRuns}
                onReadArtifact={handleReadArtifact}
              />
            )}
          </Stack>
        </Box>
      </Box>

      <TaskDrawer
        open={Boolean(selectedTask)}
        task={selectedTask}
        work={state.work}
        detail={detail}
        capabilities={state.agentCapabilities}
        packetPreview={packetPreview}
        loading={detailLoading}
        tab={detailTab}
        actionKey={actionKey}
        onTabChange={setDetailTab}
        onStageAction={handleStageAction}
        onStageReview={handleStageReview}
        onCreateAttempt={handleCreateAttempt}
        onSubmitAttempt={handleSubmitAttempt}
        onGenerateTaskPacket={handleGenerateTaskPacket}
        onLaunchTaskPacket={handleLaunchTaskPacket}
        onApprovalDecision={handleApprovalDecision}
        onCreateAgentRun={handleCreateAgentRun}
        onAgentRunAction={handleAgentRunAction}
        onAgentRunCheckpoint={handleAgentRunCheckpoint}
        onAttachEvidence={handleAttachEvidence}
        onReadArtifact={handleReadArtifact}
        onClose={() => setSelectedTaskID(null)}
      />
      <IntakeDialog
        open={intakeOpen}
        busy={intakeBusy}
        capabilities={state.agentCapabilities}
        onClose={() => setIntakeOpen(false)}
        onCreate={handleCreateIntake}
      />
    </Box>
  );
}

const defaultIntakeInput: IntakeInput = {
  workTitle: '',
  taskTitle: '',
  description: '',
  workType: 'task',
  riskLevel: 'low',
  priority: 'normal',
  stackScope: 'full-stack',
  agentRole: 'mason',
  stageName: 'implementation',
  checkpointPolicy: 'before-tests'
};

function DashboardView({
  state,
  approvals,
  onOpenTable,
  onOpenRuns,
  onSelectTask
}: {
  state: CockpitState;
  approvals: Approval[];
  onOpenTable: () => void;
  onOpenRuns: () => void;
  onSelectTask: (task: Task) => void;
}) {
  const requestedApprovals = approvals.filter((approval) => approval.status === 'requested');
  const activeRuns = state.agentRuns.filter(isActiveRun);
  const groups = workGroups(state.work, state.tasks, approvals, state.agentRuns);
  const attentionGroups = groups.filter((group) => group.needsAttention);
  const visibleGroups = (attentionGroups.length > 0 ? attentionGroups : groups).slice(0, 5);
  const queueTitle = attentionGroups.length > 0 ? 'Needs Attention' : 'Current Work';
  const dashboardMetrics = [
    { label: 'Work', value: groups.length, tone: 'info' as const, badge: 'owner' },
    { label: 'Agent Tasks', value: state.tasks.length, tone: 'info' as const, badge: 'slices' },
    { label: 'Active Runs', value: activeRuns.length, tone: activeRuns.length > 0 ? 'success' as const : 'default' as const, badge: 'live' },
    { label: 'Approvals', value: requestedApprovals.length, tone: requestedApprovals.length > 0 ? 'warning' as const : 'success' as const, badge: 'owner' },
    { label: 'Blocked', value: groups.filter((group) => group.work.status === 'blocked' || group.currentTask?.status === 'blocked').length, tone: 'error' as const, badge: 'risk' }
  ];

  return (
    <Stack spacing={2}>
      <MetricStrip metrics={dashboardMetrics} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.5fr) minmax(340px, 1fr)' },
          gap: 2
        }}
      >
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <PanelHeader title={queueTitle} actionLabel="Open Queue" onAction={onOpenTable} />
          {visibleGroups.length === 0 ? (
            <EmptyPanel compact />
          ) : (
            <Stack divider={<Divider />} sx={{ p: 1 }}>
              {visibleGroups.map((group) => (
                <WorkSummaryRow
                  key={group.work.id}
                  group={group}
                  onSelect={() => {
                    if (group.currentTask) {
                      onSelectTask(group.currentTask);
                    }
                  }}
                />
              ))}
            </Stack>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <PanelHeader title="Agent Runs" actionLabel="Open Runs" onAction={onOpenRuns} />
          <Stack spacing={1} sx={{ p: 1 }}>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <StatusChip label={`${activeRuns.length} active`} tone={activeRuns.length > 0 ? 'info' : 'default'} />
              <StatusChip label={`${requestedApprovals.length} approvals`} tone={requestedApprovals.length > 0 ? 'warning' : 'success'} />
            </Stack>
            {activeRuns.length === 0 ? (
              <EmptyPanel compact />
            ) : (
              <Stack divider={<Divider />}>
                {activeRuns.slice(0, 5).map((run) => (
                  <AgentRunSummaryRow key={run.id} run={run} tasks={state.tasks} />
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}

function PanelHeader({
  title,
  actionLabel,
  onAction
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="h3" sx={{ flex: 1 }}>
        {title}
      </Typography>
      {actionLabel && onAction && (
        <Button size="small" variant="outlined" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

function WorkSummaryRow({ group, onSelect }: { group: WorkGroup; onSelect: () => void }) {
  const taskCountLabel = `${group.tasks.length} agent ${group.tasks.length === 1 ? 'task' : 'tasks'}`;
  return (
    <Stack
      role="button"
      tabIndex={0}
      spacing={0.75}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect();
        }
      }}
      sx={{
        p: 1,
        cursor: 'pointer',
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography sx={{ flex: 1, fontWeight: 800 }} noWrap>
          {group.work.title}
        </Typography>
        <StatusChip label={group.work.status} tone={statusTone(group.work.status)} />
      </Stack>
      <Typography variant="body2" color="text.secondary" noWrap>
        {group.currentTask?.title ?? 'No agent task yet'}
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <StatusChip label={group.work.type || 'work'} />
        <StatusChip label={group.work.risk_level} tone={riskTone(group.work.risk_level)} />
        <StatusChip label={taskCountLabel} tone="info" />
        {group.currentTask?.agent_role && <StatusChip label={group.currentTask.agent_role} />}
        {group.activeRun && <StatusChip label={group.activeRun.status} tone={statusTone(group.activeRun.status)} />}
        {group.requestedApproval && <StatusChip label={group.requestedApproval.approval_type} tone="warning" />}
      </Stack>
    </Stack>
  );
}

function AgentRunSummaryRow({ run, tasks }: { run: AgentRun; tasks: Task[] }) {
  const task = run.task_id ? tasks.find((item) => item.id === run.task_id) : undefined;
  return (
    <Stack spacing={0.5} sx={{ p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography sx={{ flex: 1, fontWeight: 800 }} noWrap>
          {run.agent_role}
        </Typography>
        <StatusChip label={run.status} tone={statusTone(run.status)} />
      </Stack>
      <Typography variant="body2" color="text.secondary" noWrap>
        {task?.title ?? 'No task linked'} / {run.current_checkpoint || 'checkpoint n/a'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatDate(run.last_heartbeat_at ?? run.started_at)}
      </Typography>
    </Stack>
  );
}

function TaskWorkspace({
  loading,
  query,
  statusFilter,
  tasks,
  work,
  approvals,
  runs,
  selectedTaskID,
  onQueryChange,
  onStatusFilterChange,
  onSelectTask
}: {
  loading: boolean;
  query: string;
  statusFilter: string;
  tasks: Task[];
  work: Work[];
  approvals: Approval[];
  runs: AgentRun[];
  selectedTaskID: string | null;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSelectTask: (task: Task) => void;
}) {
  const groups = workGroups(work, tasks, approvals, runs);
  const activeCount = groups.filter((group) => Boolean(group.activeRun)).length;
  const approvalCount = groups.filter((group) => Boolean(group.requestedApproval)).length;
  const blockedCount = groups.filter((group) => group.work.status === 'blocked' || group.currentTask?.status === 'blocked').length;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          alignItems: { xs: 'stretch', lg: 'center' }
        }}
      >
        <Box sx={{ minWidth: { xs: '100%', lg: 180 } }}>
          <Typography variant="h3">Work Queue</Typography>
          <Typography variant="caption" color="text.secondary">
            Work is what you asked Maestro to do. Agent tasks are execution slices inside it.
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.75 }}>
            <StatusChip label={`${groups.length} work`} tone="info" />
            <StatusChip label={`${activeCount} active`} tone={activeCount > 0 ? 'info' : 'default'} />
            <StatusChip label={`${approvalCount} approvals`} tone={approvalCount > 0 ? 'warning' : 'success'} />
            <StatusChip label={`${blockedCount} blocked`} tone={blockedCount > 0 ? 'error' : 'success'} />
          </Stack>
        </Box>
        <TextField
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search work or agent tasks"
          size="small"
          sx={{ minWidth: { xs: '100%', lg: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
              )
            }
          }}
        />
        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 190 } }}
        >
          {TASK_STATUS_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      {loading ? (
        <Box sx={{ p: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <WorkQueueTable groups={groups} selectedTaskID={selectedTaskID} onSelect={onSelectTask} />
      )}
    </Paper>
  );
}

function AgentRunsWorkspace({
  loading,
  capabilities,
  runs,
  tasks,
  work,
  onSelectTask
}: {
  loading: boolean;
  capabilities: AgentCapability[];
  runs: AgentRun[];
  tasks: Task[];
  work: Work[];
  onSelectTask: (taskID: string) => void;
}) {
  const taskByID = new Map(tasks.map((task) => [task.id, task]));
  const activeRuns = runs.filter(isActiveRun);
  const queuedRuns = runs.filter((run) => run.status === 'queued');
  const pausedRuns = runs.filter((run) => ['pause_requested', 'pausing_at_checkpoint', 'paused'].includes(run.status));
  const terminalRuns = runs.filter((run) => isTerminalRun(run.status));

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" sx={{ flex: 1 }}>
          Agents & Runs
        </Typography>
        <StatusChip label={`${activeRuns.length} active`} tone={activeRuns.length > 0 ? 'info' : 'default'} />
        <StatusChip label={`${queuedRuns.length} queued`} />
        <StatusChip label={`${pausedRuns.length} paused`} tone={pausedRuns.length > 0 ? 'warning' : 'default'} />
        <StatusChip label={`${terminalRuns.length} closed`} />
      </Stack>
      {loading ? (
        <Box sx={{ p: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          <AgentRoleLoadStrip capabilities={capabilities} runs={runs} />
          {runs.length === 0 ? (
            <EmptyPanel compact />
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 330px)', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table stickyHeader size="small" aria-label="Maestro agent runs">
                <TableHead>
                  <TableRow>
                    <TableCell>Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Task</TableCell>
                    <TableCell>Work</TableCell>
                    <TableCell>Checkpoint</TableCell>
                    <TableCell>Heartbeat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((run) => {
                    const task = run.task_id ? taskByID.get(run.task_id) : undefined;
                    return (
                      <TableRow
                        key={run.id}
                        hover={Boolean(task)}
                        onClick={() => {
                          if (task) {
                            onSelectTask(task.id);
                          }
                        }}
                        sx={{ cursor: task ? 'pointer' : 'default' }}
                      >
                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography noWrap sx={{ fontWeight: 800 }}>
                            {run.agent_role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {shortID(run.id)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip label={run.status} tone={statusTone(run.status)} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" noWrap>
                            {task?.title ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" noWrap>
                            {task ? workTitle(work, task) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{run.current_checkpoint || '-'}</TableCell>
                        <TableCell>{formatDate(run.last_heartbeat_at ?? run.started_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}
    </Paper>
  );
}

function ArtifactsWorkspace({
  tasks,
  runs,
  onReadArtifact
}: {
  tasks: Task[];
  runs: AgentRun[];
  onReadArtifact: (uri: string) => Promise<ArtifactReadResult>;
}) {
  const artifacts = workspaceArtifacts(tasks, runs);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" sx={{ flex: 1 }}>
          Artifacts
        </Typography>
        <StatusChip label={`${artifacts.length} artifacts`} tone="info" />
        <StatusChip label={`${runs.filter((run) => packetFromRun(run)).length} packets`} />
        <StatusChip label={`${tasks.filter((task) => task.artifact_path).length} task paths`} />
      </Stack>
      <Stack spacing={1.5} sx={{ p: 1.5 }}>
        <ArtifactPanel artifacts={artifacts} onReadArtifact={onReadArtifact} layout="split" />
      </Stack>
    </Paper>
  );
}

function AgentRoleLoadStrip({ capabilities, runs }: { capabilities: AgentCapability[]; runs: AgentRun[] }) {
  if (capabilities.length === 0) {
    return <EmptyPanel compact />;
  }
  const runCounts = runs.reduce<Record<string, number>>((counts, run) => {
    counts[run.agent_role] = (counts[run.agent_role] ?? 0) + 1;
    return counts;
  }, {});
  const visibleCapabilities = capabilities.filter((capability) => capability.formal_chain_role || capability.independent_helper);

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {visibleCapabilities.map((capability) => {
          const count = runCounts[capability.role] ?? 0;
          return (
            <StatusChip
              key={capability.role}
              label={`${capability.display_name} ${count}`}
              tone={count > 0 ? 'info' : capability.independent_helper ? 'success' : 'default'}
            />
          );
        })}
      </Stack>
    </Paper>
  );
}

function IntakeDialog({
  open,
  busy,
  capabilities,
  onClose,
  onCreate
}: {
  open: boolean;
  busy: boolean;
  capabilities: AgentCapability[];
  onClose: () => void;
  onCreate: (input: IntakeInput) => Promise<void>;
}) {
  const [form, setForm] = useState<IntakeInput>(defaultIntakeInput);
  const canSubmit = Boolean(form.workTitle.trim() && form.taskTitle.trim());
  const agentOptions = capabilities.length > 0
    ? capabilities.filter((capability) => capability.formal_chain_role && capability.role !== 'maestro')
    : [];

  useEffect(() => {
    if (open) {
      setForm(defaultIntakeInput);
    }
  }, [open]);

  const update =
    (key: keyof IntakeInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || busy) {
      return;
    }
    await onCreate(form);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>New Work</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <TextField
              value={form.workTitle}
              onChange={update('workTitle')}
              label="Work title"
              autoFocus
              required
              size="small"
            />
            <TextField value={form.taskTitle} onChange={update('taskTitle')} label="Task title" required size="small" />
            <TextField
              value={form.description}
              onChange={update('description')}
              label="Description"
              minRows={3}
              multiline
              size="small"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <TextField select value={form.workType} onChange={update('workType')} label="Work type" size="small" sx={{ flex: 1 }}>
                <MenuItem value="task">Task</MenuItem>
                <MenuItem value="feature">Feature</MenuItem>
                <MenuItem value="module">Module-sized work</MenuItem>
                <MenuItem value="high_risk">High-risk work</MenuItem>
              </TextField>
              <TextField select value={form.riskLevel} onChange={update('riskLevel')} label="Risk" size="small" sx={{ flex: 1 }}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <TextField select value={form.priority} onChange={update('priority')} label="Priority" size="small" sx={{ flex: 1 }}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
              <TextField
                select
                value={form.stackScope}
                onChange={update('stackScope')}
                label="Stack"
                size="small"
                sx={{ flex: 1 }}
              >
                <MenuItem value="frontend">Frontend</MenuItem>
                <MenuItem value="backend">Backend</MenuItem>
                <MenuItem value="full-stack">Full-stack</MenuItem>
                <MenuItem value="docs">Docs</MenuItem>
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <TextField select value={form.agentRole} onChange={update('agentRole')} label="Agent" size="small" sx={{ flex: 1 }}>
                {agentOptions.length > 0 ? (
                  agentOptions.map((capability) => (
                    <MenuItem key={capability.role} value={capability.role}>
                      {capability.display_name}
                    </MenuItem>
                  ))
                ) : (
                  [
                    <MenuItem key="mason" value="mason">Mason</MenuItem>,
                    <MenuItem key="charlie" value="charlie">Charlie</MenuItem>,
                    <MenuItem key="scout" value="scout">Scout</MenuItem>,
                    <MenuItem key="lens" value="lens">Lens</MenuItem>,
                    <MenuItem key="scribe" value="scribe">Scribe</MenuItem>
                  ]
                )}
              </TextField>
              <TextField
                select
                value={form.stageName}
                onChange={update('stageName')}
                label="Initial stage"
                size="small"
                sx={{ flex: 1 }}
              >
                <MenuItem value="implementation">Implementation</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="verification">Verification</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="none">No stage</MenuItem>
              </TextField>
            </Stack>
            <TextField
              select
              value={form.checkpointPolicy}
              onChange={update('checkpointPolicy')}
              label="Checkpoint"
              size="small"
              disabled={form.stageName === 'none'}
            >
              <MenuItem value="before-implementation">Before implementation</MenuItem>
              <MenuItem value="before-tests">Before tests</MenuItem>
              <MenuItem value="before-browser-pass">Before browser pass</MenuItem>
              <MenuItem value="before-review">Before review</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />} disabled={!canSubmit || busy}>
            Create
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

type WorkQueueTableProps = {
  groups: WorkGroup[];
  selectedTaskID: string | null;
  onSelect: (task: Task) => void;
};

function WorkQueueTable({ groups, selectedTaskID, onSelect }: WorkQueueTableProps) {
  if (groups.length === 0) {
    return <EmptyPanel />;
  }
  return (
    <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
      <Table stickyHeader size="small" aria-label="Maestro work queue">
        <TableHead>
          <TableRow>
            <TableCell>Work</TableCell>
            <TableCell>Agent Tasks</TableCell>
            <TableCell>Current Gate</TableCell>
            <TableCell>Owner Signal</TableCell>
            <TableCell>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => {
            const task = group.currentTask;
            const selected = Boolean(task && task.id === selectedTaskID);
            const taskCountLabel = `${group.tasks.length} ${group.tasks.length === 1 ? 'task' : 'tasks'}`;
            const ownerSignal = group.requestedApproval
              ? group.requestedApproval.approval_type
              : group.activeRun
                ? group.activeRun.status
                : group.needsAttention
                  ? 'attention'
                  : 'clear';
            return (
              <TableRow
                key={group.work.id}
                hover={Boolean(task)}
                selected={selected}
                onClick={() => {
                  if (task) {
                    onSelect(task);
                  }
                }}
                sx={{ cursor: task ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ minWidth: 260 }}>
                  <Typography noWrap sx={{ fontWeight: 800 }}>
                    {group.work.title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                    <StatusChip label={shortID(group.work.id)} />
                    <StatusChip label={group.work.type || 'work'} />
                    <StatusChip label={group.work.priority || 'normal'} />
                    <StatusChip label={group.work.risk_level} tone={riskTone(group.work.risk_level)} />
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography variant="body2" noWrap>
                    {task?.title ?? 'No agent task yet'}
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                    <StatusChip label={taskCountLabel} tone="info" />
                    {task?.agent_role && <StatusChip label={task.agent_role} />}
                    {task?.stack_scope && <StatusChip label={task.stack_scope} />}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <StatusChip label={group.work.status} tone={statusTone(group.work.status)} />
                    {task && task.status !== group.work.status && <StatusChip label={task.status} tone={statusTone(task.status)} />}
                  </Stack>
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={ownerSignal}
                    tone={group.requestedApproval ? 'warning' : group.activeRun ? statusTone(group.activeRun.status) : group.needsAttention ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell>{formatDate(group.updatedAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type TaskDrawerProps = {
  open: boolean;
  task: Task | null;
  work: Work[];
  detail: TaskDetail | null;
  capabilities: AgentCapability[];
  packetPreview: TaskPacket | null;
  loading: boolean;
  tab: DetailTab;
  actionKey: string | null;
  onTabChange: (tab: DetailTab) => void;
  onStageAction: (stage: Stage, action: StageAction) => void;
  onStageReview: (stage: Stage, decision: StageReviewDecision) => void;
  onCreateAttempt: (task: Task, input: AttemptCreateInput) => void;
  onSubmitAttempt: (attempt: Attempt, input: AttemptSubmitInput) => void;
  onGenerateTaskPacket: (task: Task, input: PacketGenerateInput) => void;
  onLaunchTaskPacket: (task: Task, input: PacketGenerateInput) => void;
  onApprovalDecision: (approval: Approval, decision: ApprovalDecision) => void;
  onCreateAgentRun: (task: Task, input: AgentRunCreateInput) => void;
  onAgentRunAction: (run: AgentRun, action: AgentRunAction) => void;
  onAgentRunCheckpoint: (run: AgentRun, input: AgentRunCheckpointInput) => void;
  onAttachEvidence: (input: EvidenceAttachmentInput) => void;
  onReadArtifact: (uri: string) => Promise<ArtifactReadResult>;
  onClose: () => void;
};

function TaskDrawer({
  open,
  task,
  work,
  detail,
  capabilities,
  packetPreview,
  loading,
  tab,
  actionKey,
  onTabChange,
  onStageAction,
  onStageReview,
  onCreateAttempt,
  onSubmitAttempt,
  onGenerateTaskPacket,
  onLaunchTaskPacket,
  onApprovalDecision,
  onCreateAgentRun,
  onAgentRunAction,
  onAgentRunCheckpoint,
  onAttachEvidence,
  onReadArtifact,
  onClose
}: TaskDrawerProps) {
  const gateSignal = task
    ? taskGateSignal(task, detail?.stages ?? [], detail?.evidence ?? [], detail?.approvals ?? [], detail?.agentRuns ?? [])
    : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 640 },
            maxWidth: '100%',
            borderLeft: 1,
            borderColor: 'divider'
          }
        }
      }}
    >
      {task && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h2">{workTitle(work, task)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Agent task: {task.title} / {shortID(task.id)}
                </Typography>
              </Box>
              <Tooltip title="Close">
                <IconButton aria-label="Close task drawer" onClick={onClose}>
                  <CloseRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <StatusChip label={task.status} tone={statusTone(task.status)} />
              <StatusChip label={task.risk_level} tone={riskTone(task.risk_level)} />
              <StatusChip label={task.priority} />
              <StatusChip label={task.agent_role || 'unassigned'} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {task.description || 'No description'}
            </Typography>
          </Stack>

          <Box sx={{ px: 2, pt: 1.5 }}>
            <Stack spacing={1}>
              {gateSignal && <GatePanel signal={gateSignal} />}
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <FactCheckRoundedIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Agent Task Progress
                    </Typography>
                    <Typography variant="h3">{stageProgress(detail?.stages ?? [])}</Typography>
                  </Box>
                  <WarningAmberRoundedIcon color={task.risk_level === 'high' ? 'error' : 'disabled'} />
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, next: DetailTab) => onTabChange(next)}
            variant="scrollable"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider', mt: 1 }}
          >
            <Tab value="overview" label="Overview" />
            <Tab value="evidence" label="Evidence" />
            <Tab value="artifacts" label="Artifacts" />
            <Tab value="agent" label="Agent" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', height: 180 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                {tab === 'overview' && (
                  <TaskOverviewPanel task={task} work={work} detail={detail} onTabChange={onTabChange} />
                )}
                {tab === 'evidence' && (
                  <EvidencePanel
                    evidence={detail?.evidence ?? []}
                    busy={actionKey === `evidence:${task.id}:attach`}
                    onAttach={onAttachEvidence}
                  />
                )}
                {tab === 'artifacts' && (
                  <ArtifactPanel
                    artifacts={taskArtifacts(task, detail)}
                    onReadArtifact={onReadArtifact}
                  />
                )}
                {tab === 'agent' && (
                  <TaskAgentPanel
                    task={task}
                    stages={detail?.stages ?? []}
                    attempts={detail?.attempts ?? []}
                    runs={detail?.agentRuns ?? []}
                    capabilities={capabilities}
                    packet={packetPreview}
                    actionKey={actionKey}
                    onGenerate={onGenerateTaskPacket}
                    onLaunch={onLaunchTaskPacket}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

function GatePanel({ signal }: { signal: ReturnType<typeof taskGateSignal> }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 700 }}>
            Current Gate
          </Typography>
          <StatusChip label={signal.currentGate} tone={signal.tone} />
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {signal.missingEvidence.length === 0 ? (
            <StatusChip label="Evidence ok" tone="success" />
          ) : (
            signal.missingEvidence.map((item) => <StatusChip key={item} label={`Missing ${item}`} tone="warning" />)
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {signal.nextAllowedActions.join(' / ')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function TaskOverviewPanel({
  task,
  work,
  detail,
  onTabChange
}: {
  task: Task;
  work: Work[];
  detail: TaskDetail | null;
  onTabChange: (tab: DetailTab) => void;
}) {
  const stages = detail?.stages ?? [];
  const attempts = detail?.attempts ?? [];
  const evidence = detail?.evidence ?? [];
  const approvals = detail?.approvals ?? [];
  const runs = detail?.agentRuns ?? [];
  const artifacts = taskArtifacts(task, detail);
  const requestedApprovals = approvals.filter((approval) => approval.status === 'requested');
  const activeRuns = runs.filter(isActiveRun);
  const latestAttempt = [...attempts].sort((left, right) =>
    (right.submitted_at ?? right.created_at).localeCompare(left.submitted_at ?? left.created_at)
  )[0];

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: 1
        }}
      >
        <SignalTile label="Stages" value={stageProgress(stages)} />
        <SignalTile label="Attempts" value={String(attempts.length)} />
        <SignalTile label="Evidence" value={String(evidence.length)} tone={evidence.length > 0 ? 'success' : 'default'} />
        <SignalTile label="Artifacts" value={String(artifacts.length)} tone={artifacts.length > 0 ? 'info' : 'default'} />
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ flex: 1, fontWeight: 800 }}>Current State</Typography>
            <StatusChip label={task.status} tone={statusTone(task.status)} />
          </Stack>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <StatusChip label={workTitle(work, task)} />
            <StatusChip label={task.agent_role || 'unassigned'} />
            <StatusChip label={task.stack_scope || 'stack n/a'} />
            <StatusChip label={task.risk_level} tone={riskTone(task.risk_level)} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {task.description || 'No description'}
          </Typography>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.25
        }}
      >
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>Runs</Typography>
              <Button size="small" variant="text" onClick={() => onTabChange('agent')}>
                Open
              </Button>
            </Stack>
            {activeRuns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No active runs</Typography>
            ) : (
              activeRuns.slice(0, 3).map((run) => (
                <Stack key={run.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ flex: 1, fontWeight: 700 }} noWrap>{run.agent_role}</Typography>
                  <StatusChip label={run.status} tone={statusTone(run.status)} />
                </Stack>
              ))
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>Approvals</Typography>
              <StatusChip label={requestedApprovals.length > 0 ? 'needs decision' : 'clear'} tone={requestedApprovals.length > 0 ? 'warning' : 'success'} />
            </Stack>
            {requestedApprovals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Clear</Typography>
            ) : (
              requestedApprovals.slice(0, 3).map((approval) => (
                <Stack key={approval.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ flex: 1, fontWeight: 700 }} noWrap>{approval.approval_type}</Typography>
                  <StatusChip label={approval.status} tone="warning" />
                </Stack>
              ))
            )}
          </Stack>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ flex: 1, fontWeight: 800 }}>Latest Handoff</Typography>
            <Button size="small" variant="text" onClick={() => onTabChange('agent')}>
              Open
            </Button>
          </Stack>
          {latestAttempt ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">{latestAttempt.summary || 'No summary'}</Typography>
              <Typography variant="caption" color="text.secondary">
                Attempt {latestAttempt.attempt_no} / {latestAttempt.agent_role || 'unassigned'} / {formatDate(latestAttempt.submitted_at ?? latestAttempt.created_at)}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No attempts</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function SignalTile({
  label,
  value,
  tone = 'default'
}: {
  label: string;
  value: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'error';
}) {
  const toneColor = {
    default: 'divider',
    info: 'primary.main',
    success: 'success.main',
    warning: 'warning.main',
    error: 'error.main'
  }[tone];
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderTop: 3, borderTopColor: toneColor }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function StagePanel({
  stages,
  actionKey,
  onAction,
  onReview
}: {
  stages: Stage[];
  actionKey: string | null;
  onAction: (stage: Stage, action: StageAction) => void;
  onReview: (stage: Stage, decision: StageReviewDecision) => void;
}) {
  if (stages.length === 0) {
    return <EmptyPanel compact />;
  }
  return (
    <List disablePadding>
      {stages.map((stage, index) => (
        <Box key={stage.id}>
          <ListItem disableGutters alignItems="flex-start" sx={{ py: 1.25 }}>
            <Stack spacing={0.5} sx={{ width: '100%' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 800 }}>{stage.name}</Typography>
                <StatusChip label={stage.status} tone={statusTone(stage.status)} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {stage.agent_role || 'unassigned'} / checkpoint: {stage.checkpoint_policy || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Started {formatDate(stage.started_at)} / Completed {formatDate(stage.completed_at)}
              </Typography>
              <StageControls stage={stage} actionKey={actionKey} onAction={onAction} onReview={onReview} />
            </Stack>
          </ListItem>
          {index < stages.length - 1 && <Divider />}
        </Box>
      ))}
    </List>
  );
}

function StageControls({
  stage,
  actionKey,
  onAction,
  onReview
}: {
  stage: Stage;
  actionKey: string | null;
  onAction: (stage: Stage, action: StageAction) => void;
  onReview: (stage: Stage, decision: StageReviewDecision) => void;
}) {
  const busy = Boolean(actionKey?.startsWith(`stage:${stage.id}:`));
  const canStart = ['pending', 'ready', 'revise_requested'].includes(stage.status);
  const canPause = stage.status === 'in_progress';
  const canResume = stage.status === 'paused';
  const canReview = ['in_progress', 'awaiting_review', 'paused', 'revise_requested'].includes(stage.status);
  const canCancel = ['pending', 'ready', 'in_progress', 'paused', 'revise_requested'].includes(stage.status);

  if (!canStart && !canPause && !canResume && !canReview && !canCancel) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', pt: 0.75 }}>
      {canStart && (
        <Button
          size="small"
          variant="contained"
          startIcon={<PlayArrowRoundedIcon />}
          disabled={busy}
          onClick={() => onAction(stage, 'start')}
        >
          Start
        </Button>
      )}
      {canPause && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<PauseRoundedIcon />}
          disabled={busy}
          onClick={() => onAction(stage, 'pause')}
        >
          Pause
        </Button>
      )}
      {canResume && (
        <Button
          size="small"
          variant="contained"
          startIcon={<ReplayRoundedIcon />}
          disabled={busy}
          onClick={() => onAction(stage, 'resume')}
        >
          Resume
        </Button>
      )}
      {canReview && (
        <>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckCircleRoundedIcon />}
            disabled={busy}
            onClick={() => onReview(stage, 'accept')}
          >
            Accept
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ReplayRoundedIcon />}
            disabled={busy}
            onClick={() => onReview(stage, 'revise')}
          >
            Revise
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<BlockRoundedIcon />}
            disabled={busy}
            onClick={() => onReview(stage, 'block')}
          >
            Block
          </Button>
        </>
      )}
      {canCancel && (
        <Button size="small" variant="text" color="error" disabled={busy} onClick={() => onAction(stage, 'cancel')}>
          Cancel
        </Button>
      )}
    </Stack>
  );
}

function AttemptPanel({
  task,
  stages,
  attempts,
  actionKey,
  onCreate,
  onSubmit
}: {
  task: Task;
  stages: Stage[];
  attempts: Attempt[];
  actionKey: string | null;
  onCreate: (task: Task, input: AttemptCreateInput) => void;
  onSubmit: (attempt: Attempt, input: AttemptSubmitInput) => void;
}) {
  return (
    <Stack spacing={1.25}>
      <AttemptCreatePanel
        task={task}
        stages={stages}
        busy={actionKey === `attempt:${task.id}:create`}
        onCreate={onCreate}
      />
      {attempts.length === 0 && <EmptyPanel compact />}
      {attempts.map((attempt) => (
        <AttemptCard
          key={attempt.id}
          attempt={attempt}
          stage={stages.find((item) => item.id === attempt.stage_id)}
          busy={actionKey === `attempt:${attempt.id}:submit`}
          onSubmit={onSubmit}
        />
      ))}
    </Stack>
  );
}

function AttemptCreatePanel({
  task,
  stages,
  busy,
  onCreate
}: {
  task: Task;
  stages: Stage[];
  busy: boolean;
  onCreate: (task: Task, input: AttemptCreateInput) => void;
}) {
  const stageSignature = stages.map((stage) => `${stage.id}:${stage.agent_role}`).join('|');
  const [stageID, setStageID] = useState('');
  const [agentRole, setAgentRole] = useState(task.agent_role || 'mason');

  useEffect(() => {
    const firstStage = stages[0];
    setStageID(firstStage?.id ?? '');
    setAgentRole(firstStage?.agent_role || task.agent_role || 'mason');
  }, [stageSignature, task.agent_role, task.id]);

  const selectedStage = stages.find((stage) => stage.id === stageID);
  const canCreate = Boolean(stageID && agentRole.trim());

  return (
    <Paper
      component="form"
      variant="outlined"
      sx={{ p: 1.5 }}
      onSubmit={(event) => {
        event.preventDefault();
        if (canCreate && !busy) {
          onCreate(task, { stageID, agentRole });
        }
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontWeight: 800 }}>
            Create attempt
          </Typography>
          <StatusChip label={selectedStage?.status ?? 'stage'} tone={statusTone(selectedStage?.status ?? '')} />
        </Stack>
        <TextField
          select
          value={stageID}
          onChange={(event) => {
            const nextStageID = event.target.value;
            const nextStage = stages.find((stage) => stage.id === nextStageID);
            setStageID(nextStageID);
            setAgentRole(nextStage?.agent_role || task.agent_role || agentRole || 'mason');
          }}
          label="Stage"
          size="small"
          disabled={stages.length === 0}
        >
          {stages.map((stage) => (
            <MenuItem key={stage.id} value={stage.id}>
              {stage.name} / {stage.agent_role || task.agent_role || 'unassigned'}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            value={agentRole}
            onChange={(event) => setAgentRole(event.target.value)}
            label="Agent role"
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={!canCreate || busy}
          >
            Create Attempt
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function AttemptCard({
  attempt,
  stage,
  busy,
  onSubmit
}: {
  attempt: Attempt;
  stage?: Stage;
  busy: boolean;
  onSubmit: (attempt: Attempt, input: AttemptSubmitInput) => void;
}) {
  const [summary, setSummary] = useState(attempt.summary || '');
  const isSubmitted = attempt.status === 'submitted' || Boolean(attempt.submitted_at);
  const effectiveSummary = summary.trim();
  const canSubmit = Boolean(effectiveSummary) && !isSubmitted;

  useEffect(() => {
    setSummary(attempt.summary || '');
  }, [attempt.id, attempt.summary]);

  const submitAttempt = () => {
    if (!canSubmit || busy) {
      return;
    }
    onSubmit(attempt, buildAttemptSubmitInput(attempt, stage, effectiveSummary));
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontWeight: 800 }}>
            Attempt {attempt.attempt_no}
          </Typography>
          <StatusChip label={attempt.status} tone={statusTone(attempt.status)} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {stage?.name ?? 'Unknown stage'} / {attempt.agent_role || 'unassigned'}
        </Typography>
        {isSubmitted ? (
          <Stack spacing={0.5}>
            <Typography variant="body2">{attempt.summary || 'Submitted handoff'}</Typography>
            {attempt.handoff_path && (
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                handoff: {attempt.handoff_path}
              </Typography>
            )}
            {attempt.readme_path && (
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                readme: {attempt.readme_path}
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={1}>
            <TextField
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              label="Handoff summary"
              minRows={3}
              multiline
              size="small"
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                Generates handoff.json and README.md artifacts.
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                disabled={!canSubmit || busy}
                onClick={submitAttempt}
              >
                Submit Handoff
              </Button>
            </Stack>
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary">
          Created {formatDate(attempt.created_at)} / Submitted {formatDate(attempt.submitted_at)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function buildAttemptSubmitInput(attempt: Attempt, stage: Stage | undefined, summary: string): AttemptSubmitInput {
  const handoff = {
    result: 'complete',
    summary,
    task_id: attempt.task_id,
    stage_id: attempt.stage_id,
    attempt_id: attempt.id,
    stage: stage?.name ?? '',
    evidence: []
  };
  const readme = [
    `# Attempt ${attempt.attempt_no}`,
    '',
    `Stage: ${stage?.name ?? attempt.stage_id}`,
    `Agent: ${attempt.agent_role || 'unassigned'}`,
    '',
    summary,
    ''
  ].join('\n');

  return {
    summary,
    files_changed_json: [],
    commands_run_json: [],
    evidence_json: [],
    handoff_file: {
      name: 'handoff.json',
      content: JSON.stringify(handoff, null, 2),
      encoding: 'text'
    },
    readme_file: {
      name: 'README.md',
      content: readme,
      encoding: 'text'
    }
  };
}

function TaskAgentPanel({
  task,
  stages,
  attempts,
  runs,
  capabilities,
  packet,
  actionKey,
  onGenerate,
  onLaunch
}: {
  task: Task;
  stages: Stage[];
  attempts: Attempt[];
  runs: AgentRun[];
  capabilities: AgentCapability[];
  packet: TaskPacket | null;
  actionKey: string | null;
  onGenerate: (task: Task, input: PacketGenerateInput) => void;
  onLaunch: (task: Task, input: PacketGenerateInput) => void;
}) {
  return (
    <Stack spacing={1.25}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>Agent Runtime</Typography>
          <Typography variant="body2" color="text.secondary">
            This area is for preparing the native agent handoff. The main Cockpit view stays read-only and owner-focused.
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <StatusChip label={`${stages.length} stages`} />
            <StatusChip label={`${attempts.length} attempts`} />
            <StatusChip label={`${runs.length} runs`} tone={runs.some(isActiveRun) ? 'info' : 'default'} />
          </Stack>
        </Stack>
      </Paper>
      <PacketPanel
        task={task}
        stages={stages}
        capabilities={capabilities}
        packet={packet}
        actionKey={actionKey}
        onGenerate={onGenerate}
        onLaunch={onLaunch}
      />
      <AgentRunReadOnlyPanel runs={runs} />
      <AttemptReadOnlyPanel attempts={attempts} stages={stages} />
    </Stack>
  );
}

function PacketPanel({
  task,
  stages,
  capabilities,
  packet,
  actionKey,
  onGenerate,
  onLaunch
}: {
  task: Task;
  stages: Stage[];
  capabilities: AgentCapability[];
  packet: TaskPacket | null;
  actionKey: string | null;
  onGenerate: (task: Task, input: PacketGenerateInput) => void;
  onLaunch: (task: Task, input: PacketGenerateInput) => void;
}) {
  const stageSignature = stages.map((stage) => `${stage.id}:${stage.agent_role}`).join('|');
  const [stageID, setStageID] = useState('');
  const [agentRole, setAgentRole] = useState(task.agent_role || 'mason');
  const roleOptions = capabilities.filter((capability) => capability.formal_chain_role && capability.role !== 'maestro');

  useEffect(() => {
    const firstStage = stages[0];
    setStageID(firstStage?.id ?? '');
    setAgentRole(firstStage?.agent_role || task.agent_role || 'mason');
  }, [stageSignature, task.agent_role, task.id]);

  const selectedCapability = capabilities.find((capability) => capability.role === agentRole);
  const canGenerate = Boolean(agentRole.trim());
  const canLaunch = Boolean(stageID && agentRole.trim());
  const generateBusy = actionKey === `packet:${task.id}:generate`;
  const launchBusy = actionKey === `packet:${task.id}:launch`;

  return (
    <Stack spacing={1.25}>
      <Paper
        component="form"
        variant="outlined"
        sx={{ p: 1.5 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (canGenerate && !generateBusy && !launchBusy) {
            onGenerate(task, { stageID, agentRole });
          }
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ flex: 1, fontWeight: 800 }}>
              Generate launch packet
            </Typography>
            <StatusChip label={selectedCapability?.type ?? 'custom'} tone="info" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              select
              value={stageID}
              onChange={(event) => {
                const nextStageID = event.target.value;
                const nextStage = stages.find((stage) => stage.id === nextStageID);
                setStageID(nextStageID);
                setAgentRole(nextStage?.agent_role || task.agent_role || agentRole || 'mason');
              }}
              label="Stage"
              size="small"
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Task only</MenuItem>
              {stages.map((stage) => (
                <MenuItem key={stage.id} value={stage.id}>
                  {stage.name} / {stage.agent_role || task.agent_role || 'unassigned'}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select={roleOptions.length > 0}
              value={agentRole}
              onChange={(event) => setAgentRole(event.target.value)}
              label="Agent"
              size="small"
              sx={{ flex: 1 }}
            >
              {roleOptions.map((capability) => (
                <MenuItem key={capability.role} value={capability.role}>
                  {capability.display_name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Packet includes role scope, skills, checks, and handoff. Queue creates an attempt and agent run.
            </Typography>
            <Button type="submit" variant="outlined" startIcon={<FactCheckRoundedIcon />} disabled={!canGenerate || generateBusy || launchBusy}>
              Generate Packet
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowRoundedIcon />}
              disabled={!canLaunch || generateBusy || launchBusy}
              onClick={() => onLaunch(task, { stageID, agentRole })}
            >
              Queue Agent Run
            </Button>
          </Stack>
        </Stack>
      </Paper>
      {packet ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>
                {packet.agent_display_name} packet
              </Typography>
              <StatusChip label={packet.route_tier} tone={packet.route_tier === 'high_risk' ? 'warning' : 'info'} />
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {packet.recommended_skills.map((skill) => (
                <StatusChip key={skill} label={skill} />
              ))}
            </Stack>
            <TextField
              value={packet.packet_markdown}
              multiline
              minRows={16}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

function EvidencePanel({
  evidence,
  busy,
  onAttach
}: {
  evidence: Evidence[];
  busy: boolean;
  onAttach: (input: EvidenceAttachmentInput) => Promise<void> | void;
}) {
  const [type, setType] = useState('test');
  const [title, setTitle] = useState('');
  const [uri, setURI] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const latest = latestEvidence(evidence);
  const effectiveTitle = title.trim() || file?.name || '';
  const canSubmit = Boolean(effectiveTitle && (uri.trim() || file));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const input: EvidenceAttachmentInput = {
      type,
      title: effectiveTitle,
      metadata_json: {
        source: 'cockpit'
      }
    };
    if (file) {
      input.file = {
        name: file.name,
        content: await file.text(),
        encoding: 'text'
      };
    } else {
      input.uri = uri.trim();
    }

    await onAttach(input);
    setTitle('');
    setURI('');
    setFile(null);
  };

  return (
    <Stack spacing={1.25}>
      <Paper component="form" variant="outlined" onSubmit={handleSubmit} sx={{ p: 1.5 }}>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Select value={type} onChange={(event) => setType(event.target.value)} size="small" sx={{ minWidth: 130 }}>
              <MenuItem value="test">Test</MenuItem>
              <MenuItem value="command">Command</MenuItem>
              <MenuItem value="browser">Browser</MenuItem>
              <MenuItem value="visual">Visual</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="artifact">Artifact</MenuItem>
              <MenuItem value="note">Note</MenuItem>
            </Select>
            <TextField
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={file?.name ?? 'Evidence title'}
              size="small"
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            value={uri}
            onChange={(event) => setURI(event.target.value)}
            placeholder="artifact://, https://, or local note URI"
            size="small"
            disabled={Boolean(file)}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" component="label">
              Choose Text File
              <Box
                component="input"
                type="file"
                hidden
                accept=".txt,.log,.md,.json,.yaml,.yml,.csv,text/*,application/json"
                onChange={handleFileChange}
              />
            </Button>
            {file && (
              <Button size="small" variant="text" onClick={() => setFile(null)}>
                {file.name}
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button type="submit" size="small" variant="contained" disabled={!canSubmit || busy}>
              Attach
            </Button>
          </Stack>
        </Stack>
      </Paper>
      {!latest && <EmptyPanel compact />}
      {evidence.map((item) => (
        <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>
                {item.title}
              </Typography>
              <StatusChip label={item.type} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {item.uri}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.created_at)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function ArtifactPanel({
  artifacts,
  onReadArtifact,
  layout = 'stack'
}: {
  artifacts: ArtifactItem[];
  onReadArtifact: (uri: string) => Promise<ArtifactReadResult>;
  layout?: 'stack' | 'split';
}) {
  const [selectedID, setSelectedID] = useState('');
  const [content, setContent] = useState<ArtifactReadResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedID) ?? artifacts[0] ?? null;
  const selectedArtifactID = selectedArtifact?.id ?? '';
  const selectedArtifactURI = selectedArtifact?.uri ?? '';

  useEffect(() => {
    setSelectedID((current) => {
      if (current && artifacts.some((artifact) => artifact.id === current)) {
        return current;
      }
      return artifacts[0]?.id ?? '';
    });
  }, [artifacts]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setContent(null);
    if (!selectedArtifactID) {
      return undefined;
    }
    if (!selectedArtifactURI) {
      return undefined;
    }
    void onReadArtifact(selectedArtifactURI)
      .then((result) => {
        if (!cancelled) {
          setContent(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [onReadArtifact, selectedArtifactID, selectedArtifactURI]);

  if (artifacts.length === 0) {
    return <EmptyPanel compact />;
  }

  const list = (
    <Stack spacing={0.75}>
      {artifacts.map((artifact) => (
        <Paper
          key={artifact.id}
          variant="outlined"
          onClick={() => setSelectedID(artifact.id)}
          sx={{
            p: 1.25,
            cursor: 'pointer',
            borderColor: artifact.id === selectedArtifact?.id ? 'primary.main' : 'divider',
            bgcolor: artifact.id === selectedArtifact?.id ? alpha('#2454a6', 0.06) : 'background.paper'
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }} noWrap>
                {artifact.title}
              </Typography>
              <StatusChip label={artifact.kind} tone={artifact.kind === 'json' ? 'info' : artifact.kind === 'markdown' ? 'success' : 'default'} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {artifact.uri ?? artifact.source}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
  const viewer = (
    <Stack spacing={1}>
      {loadError && <Alert severity="error">{loadError}</Alert>}
      {selectedArtifact && (
        <ArtifactViewer artifact={selectedArtifact} content={content} />
      )}
    </Stack>
  );

  if (layout === 'split') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' },
          gap: 1.5,
          alignItems: 'start'
        }}
      >
        <Paper variant="outlined" sx={{ p: 1, maxHeight: { lg: 'calc(100vh - 300px)' }, overflow: 'auto' }}>
          {list}
        </Paper>
        <Box sx={{ minWidth: 0 }}>
          {viewer}
        </Box>
      </Box>
    );
  }

  return (
    <Stack spacing={1.25}>
      {list}
      {viewer}
    </Stack>
  );
}

function ArtifactViewer({ artifact, content }: { artifact: ArtifactItem; content: ArtifactReadResult | null }) {
  const body = content?.content ?? artifact.content ?? '';
  const contentType = content?.content_type ?? artifact.contentType ?? '';
  const encoding = content?.encoding ?? 'text';
  const kind = artifact.kind === 'artifact' ? artifactKindFromContent(artifact.uri ?? '', contentType, body) : artifact.kind;

  if (encoding === 'base64') {
    return (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }}>{artifact.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {content?.content_type ?? 'binary'} / {content?.size ?? 0} bytes
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (kind === 'json') {
    return <CodeBlock title={artifact.title} code={prettyJSON(body)} />;
  }
  if (kind === 'markdown') {
    return (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{artifact.title}</Typography>
          <MarkdownPreview text={body} />
        </Stack>
      </Paper>
    );
  }
  return <CodeBlock title={artifact.title} code={body || '-'} />;
}

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        nodes.push(<CodeBlock key={`code-${index}`} code={codeLines.join('\n')} compact />);
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (line.startsWith('# ')) {
      nodes.push(<Typography key={index} variant="h3">{line.slice(2)}</Typography>);
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(<Typography key={index} sx={{ fontWeight: 800 }}>{line.slice(3)}</Typography>);
      return;
    }
    if (line.startsWith('- ')) {
      nodes.push(
        <Typography key={index} variant="body2" sx={{ pl: 1.5 }}>
          {line}
        </Typography>
      );
      return;
    }
    if (line.trim() === '') {
      nodes.push(<Box key={index} sx={{ height: 4 }} />);
      return;
    }
    nodes.push(<Typography key={index} variant="body2">{line}</Typography>);
  });
  if (codeLines.length > 0) {
    nodes.push(<CodeBlock key="code-tail" code={codeLines.join('\n')} compact />);
  }

  return <Stack spacing={0.5}>{nodes}</Stack>;
}

function CodeBlock({ title, code, compact = false }: { title?: string; code: string; compact?: boolean }) {
  return (
    <Paper variant="outlined" sx={{ p: compact ? 1 : 1.5, bgcolor: '#f8fafc' }}>
      <Stack spacing={1}>
        {title && <Typography sx={{ fontWeight: 800 }}>{title}</Typography>}
        <Box
          component="pre"
          sx={{
            m: 0,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            lineHeight: 1.55
          }}
        >
          {code}
        </Box>
      </Stack>
    </Paper>
  );
}

function ApprovalPanel({
  approvals,
  actionKey,
  onDecision
}: {
  approvals: Approval[];
  actionKey: string | null;
  onDecision: (approval: Approval, decision: ApprovalDecision) => void;
}) {
  if (approvals.length === 0) {
    return <EmptyPanel compact />;
  }
  return (
    <Stack spacing={1.25}>
      {approvals.map((approval) => (
        <Paper key={approval.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>
                {approval.approval_type}
              </Typography>
              <StatusChip label={approval.status} tone={statusTone(approval.status)} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {approval.reason || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Requested by {approval.requested_by || '-'} / Approved by {approval.approved_by || '-'}
            </Typography>
            {approval.status === 'requested' && (
              <Stack direction="row" spacing={0.75} sx={{ pt: 0.75 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleRoundedIcon />}
                  disabled={actionKey === `approval:${approval.id}:approved`}
                  onClick={() => onDecision(approval, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<BlockRoundedIcon />}
                  disabled={actionKey === `approval:${approval.id}:rejected`}
                  onClick={() => onDecision(approval, 'rejected')}
                >
                  Reject
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function AgentRunReadOnlyPanel({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return <EmptyPanel compact />;
  }
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <PanelHeader title="Runs" />
      <Stack divider={<Divider />} sx={{ p: 1 }}>
        {runs.map((run) => (
          <Stack key={run.id} spacing={0.5} sx={{ p: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>{run.agent_role}</Typography>
              <StatusChip label={run.status} tone={statusTone(run.status)} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {run.current_checkpoint || 'No checkpoint'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              heartbeat {formatDate(run.last_heartbeat_at ?? run.started_at)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function AttemptReadOnlyPanel({ attempts, stages }: { attempts: Attempt[]; stages: Stage[] }) {
  if (attempts.length === 0) {
    return null;
  }
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <PanelHeader title="Handoffs" />
      <Stack divider={<Divider />} sx={{ p: 1 }}>
        {attempts.map((attempt) => {
          const stage = stages.find((item) => item.id === attempt.stage_id);
          return (
            <Stack key={attempt.id} spacing={0.5} sx={{ p: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{ flex: 1, fontWeight: 800 }}>Attempt {attempt.attempt_no}</Typography>
                <StatusChip label={attempt.status} tone={statusTone(attempt.status)} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {stage?.name ?? 'Unknown stage'} / {attempt.agent_role || 'unassigned'}
              </Typography>
              <Typography variant="body2">{attempt.summary || 'No summary'}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

function AgentRunPanel({
  task,
  stages,
  runs,
  actionKey,
  onCreate,
  onAction,
  onCheckpoint
}: {
  task: Task;
  stages: Stage[];
  runs: AgentRun[];
  actionKey: string | null;
  onCreate: (task: Task, input: AgentRunCreateInput) => void;
  onAction: (run: AgentRun, action: AgentRunAction) => void;
  onCheckpoint: (run: AgentRun, input: AgentRunCheckpointInput) => void;
}) {
  return (
    <Stack spacing={1.25}>
      <AgentRunCreatePanel
        task={task}
        stages={stages}
        busy={actionKey === `agent-run:${task.id}:create`}
        onCreate={onCreate}
      />
      {runs.length === 0 && <EmptyPanel compact />}
      {runs.map((run) => (
        <Paper key={run.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>
                {run.agent_role}
              </Typography>
              <StatusChip label={run.status} tone={statusTone(run.status)} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              checkpoint: {run.current_checkpoint || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              heartbeat {formatDate(run.last_heartbeat_at)}
            </Typography>
            <AgentRunControls
              run={run}
              actionKey={actionKey}
              onAction={onAction}
              onCheckpoint={onCheckpoint}
            />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function AgentRunCreatePanel({
  task,
  stages,
  busy,
  onCreate
}: {
  task: Task;
  stages: Stage[];
  busy: boolean;
  onCreate: (task: Task, input: AgentRunCreateInput) => void;
}) {
  const stageSignature = stages
    .map((stage) => `${stage.id}:${stage.agent_role}:${stage.checkpoint_policy}`)
    .join('|');
  const [stageID, setStageID] = useState('');
  const [agentRole, setAgentRole] = useState(task.agent_role || 'mason');
  const [checkpoint, setCheckpoint] = useState('');

  useEffect(() => {
    const defaultStage = stages[0];
    setStageID(defaultStage?.id ?? '');
    setAgentRole(defaultStage?.agent_role || task.agent_role || 'mason');
    setCheckpoint(defaultStage?.checkpoint_policy || 'created');
  }, [stageSignature, task.agent_role, task.id]);

  const handleStageChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextStageID = event.target.value;
    const nextStage = stages.find((stage) => stage.id === nextStageID);
    setStageID(nextStageID);
    setAgentRole(nextStage?.agent_role || task.agent_role || agentRole || 'mason');
    setCheckpoint(nextStage?.checkpoint_policy || checkpoint || 'created');
  };

  const canCreate = Boolean(agentRole.trim());
  const submitCreate = () => {
    if (!canCreate || busy) {
      return;
    }
    onCreate(task, { stageID, agentRole, checkpoint });
  };

  return (
    <Paper
      component="form"
      variant="outlined"
      sx={{ p: 1.5 }}
      onSubmit={(event) => {
        event.preventDefault();
        submitCreate();
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontWeight: 800 }}>
            Create agent run
          </Typography>
          <StatusChip label="queued" tone="default" />
        </Stack>
        <TextField select value={stageID} onChange={handleStageChange} label="Stage" size="small">
          <MenuItem value="">Task only</MenuItem>
          {stages.map((stage) => (
            <MenuItem key={stage.id} value={stage.id}>
              {stage.name} / {stage.agent_role || task.agent_role || 'unassigned'}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            value={agentRole}
            onChange={(event) => setAgentRole(event.target.value)}
            label="Agent role"
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            value={checkpoint}
            onChange={(event) => setCheckpoint(event.target.value)}
            label="Checkpoint"
            size="small"
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            type="submit"
            disabled={!canCreate || busy}
          >
            Create Run
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function AgentRunControls({
  run,
  actionKey,
  compact = false,
  onAction,
  onCheckpoint
}: {
  run: AgentRun;
  actionKey: string | null;
  compact?: boolean;
  onAction: (run: AgentRun, action: AgentRunAction) => void;
  onCheckpoint?: (run: AgentRun, input: AgentRunCheckpointInput) => void;
}) {
  const [checkpoint, setCheckpoint] = useState(run.current_checkpoint || '');

  useEffect(() => {
    setCheckpoint(run.current_checkpoint || '');
  }, [run.current_checkpoint, run.id]);

  const isTerminal = isTerminalRun(run.status);
  const canStart = run.status === 'queued';
  const canPause = ['running', 'resuming', 'resume_requested'].includes(run.status);
  const canResume = ['pause_requested', 'pausing_at_checkpoint', 'paused'].includes(run.status);
  const canCancel = !isTerminal && !['cancel_requested', 'cancelling_at_checkpoint'].includes(run.status);
  const canCheckpoint = Boolean(onCheckpoint && checkpoint.trim());
  const busyForRun = Boolean(actionKey?.startsWith(`agent-run:${run.id}:`));
  const checkpointBusy = actionKey === `agent-run:${run.id}:checkpoint`;

  const actionButton = (action: AgentRunAction, label: string, icon: ReactNode, enabled: boolean) => {
    const busy = actionKey === `agent-run:${run.id}:${action}`;
    if (compact) {
      return (
        <Tooltip key={action} title={label}>
          <span>
            <IconButton
              size="small"
              color={busy ? 'primary' : 'default'}
              disabled={!enabled || busyForRun}
              aria-label={`${label} agent run`}
              onClick={() => onAction(run, action)}
            >
              {icon}
            </IconButton>
          </span>
        </Tooltip>
      );
    }
    return (
      <Button
        key={action}
        size="small"
        variant="outlined"
        startIcon={icon}
        disabled={!enabled || busyForRun}
        onClick={() => onAction(run, action)}
      >
        {label}
      </Button>
    );
  };

  return (
    <Stack spacing={1} onClick={(event) => event.stopPropagation()}>
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ justifyContent: compact ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
        {actionButton('start', 'Start', <PlayArrowRoundedIcon fontSize="small" />, canStart)}
        {actionButton('pause', 'Pause', <PauseRoundedIcon fontSize="small" />, canPause)}
        {actionButton('resume', 'Resume', <ReplayRoundedIcon fontSize="small" />, canResume)}
        {actionButton('cancel', 'Cancel', <BlockRoundedIcon fontSize="small" />, canCancel)}
      </Stack>
      {!compact && onCheckpoint && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            value={checkpoint}
            onChange={(event) => setCheckpoint(event.target.value)}
            label="Checkpoint"
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            disabled={!canCheckpoint || busyForRun || checkpointBusy}
            onClick={() =>
              onCheckpoint(run, {
                checkpoint: checkpoint.trim(),
                metadata_json: {
                  source: 'cockpit'
                }
              })
            }
          >
            Checkpoint
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

function workGroups(work: Work[], tasks: Task[], approvals: Approval[], runs: AgentRun[]): WorkGroup[] {
  const workByID = new Map(work.map((item) => [item.id, item]));
  const tasksByWork = tasks.reduce<Map<string, Task[]>>((groups, task) => {
    const current = groups.get(task.work_id) ?? [];
    current.push(task);
    groups.set(task.work_id, current);
    return groups;
  }, new Map());

  return [...tasksByWork.entries()]
    .map(([workID, groupedTasks]) => {
      const ownerWork = workByID.get(workID) ?? fallbackWork(workID, groupedTasks[0]);
      const activeRun = runs.find((run) => run.work_id === workID && isActiveRun(run)) ??
        runs.find((run) => groupedTasks.some((task) => task.id === run.task_id) && isActiveRun(run)) ??
        null;
      const requestedApproval = approvals.find((approval) => approval.work_id === workID && approval.status === 'requested') ??
        approvals.find((approval) => groupedTasks.some((task) => task.id === approval.task_id) && approval.status === 'requested') ??
        null;
      const currentTask =
        (activeRun?.task_id ? groupedTasks.find((task) => task.id === activeRun.task_id) : null) ??
        (requestedApproval?.task_id ? groupedTasks.find((task) => task.id === requestedApproval.task_id) : null) ??
        groupedTasks.find((task) => !['done', 'cancelled'].includes(task.status)) ??
        groupedTasks[0] ??
        null;
      const updatedAt = [ownerWork.updated_at, ...groupedTasks.map((task) => task.updated_at)]
        .filter(Boolean)
        .sort()
        .at(-1) ?? ownerWork.updated_at;
      const needsAttention = Boolean(
        requestedApproval ||
        activeRun ||
        ownerWork.status === 'blocked' ||
        ownerWork.risk_level === 'high' ||
        groupedTasks.some((task) => taskNeedsAttention(task, approvals, runs))
      );

      return {
        work: ownerWork,
        tasks: groupedTasks,
        currentTask,
        activeRun,
        requestedApproval,
        updatedAt,
        needsAttention
      };
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function fallbackWork(workID: string, task?: Task): Work {
  return {
    id: workID,
    title: task ? workTitle([], task) : 'Current work',
    description: '',
    type: 'work',
    status: task?.status ?? 'draft',
    artifact_shape: 'lightweight',
    risk_level: task?.risk_level ?? 'low',
    priority: task?.priority ?? 'normal',
    owner: 'owner',
    branch: '',
    pr_url: '',
    artifact_root: '',
    created_at: task?.created_at ?? '',
    updated_at: task?.updated_at ?? ''
  };
}

function isActiveRun(run: AgentRun): boolean {
  return !isTerminalRun(run.status);
}

function isTerminalRun(status: string): boolean {
  return ['completed', 'cancelled', 'failed', 'stale'].includes(status);
}

function taskNeedsAttention(task: Task, approvals: Approval[], runs: AgentRun[]): boolean {
  const hasRequestedApproval = approvals.some((approval) => approval.task_id === task.id && approval.status === 'requested');
  const hasInterruptedRun = runs.some(
    (run) =>
      run.task_id === task.id &&
      ['pause_requested', 'pausing_at_checkpoint', 'paused', 'cancel_requested', 'cancelling_at_checkpoint', 'failed', 'stale'].includes(run.status)
  );
  return hasRequestedApproval || hasInterruptedRun || task.status === 'blocked' || task.risk_level === 'high';
}

function workspaceArtifacts(tasks: Task[], runs: AgentRun[]): ArtifactItem[] {
  const taskByID = new Map(tasks.map((task) => [task.id, task]));
  const artifacts: ArtifactItem[] = [];

  for (const run of runs) {
    const packet = runPacketArtifact(run);
    if (packet) {
      const task = run.task_id ? taskByID.get(run.task_id) : undefined;
      artifacts.push({
        ...packet,
        title: task ? `${task.title} packet` : packet.title,
        source: task ? `${task.title} / ${shortID(run.id)}` : packet.source
      });
    }
  }

  for (const task of tasks) {
    if (!task.artifact_path) {
      continue;
    }
    artifacts.push({
      id: `workspace-task-artifact-${task.id}`,
      title: `${task.title} artifact path`,
      kind: isArtifactURI(task.artifact_path) ? 'artifact' : 'markdown',
      source: task.id,
      uri: isArtifactURI(task.artifact_path) ? task.artifact_path : undefined,
      content: isArtifactURI(task.artifact_path) ? undefined : task.artifact_path,
      contentType: isArtifactURI(task.artifact_path) ? undefined : 'text/markdown',
      createdAt: task.updated_at
    });
  }

  return artifacts.sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''));
}

function taskArtifacts(task: Task, detail: TaskDetail | null): ArtifactItem[] {
  const artifacts: ArtifactItem[] = [];
  for (const attempt of detail?.attempts ?? []) {
    if (attempt.handoff_path) {
      artifacts.push({
        id: `attempt-handoff-${attempt.id}`,
        title: `Attempt ${attempt.attempt_no} handoff`,
        kind: 'artifact',
        source: attempt.id,
        uri: attempt.handoff_path,
        createdAt: attempt.submitted_at ?? attempt.created_at
      });
    }
    if (attempt.readme_path) {
      artifacts.push({
        id: `attempt-readme-${attempt.id}`,
        title: `Attempt ${attempt.attempt_no} README`,
        kind: 'artifact',
        source: attempt.id,
        uri: attempt.readme_path,
        createdAt: attempt.submitted_at ?? attempt.created_at
      });
    }
  }
  for (const evidence of detail?.evidence ?? []) {
    if (isArtifactURI(evidence.uri)) {
      artifacts.push({
        id: `evidence-${evidence.id}`,
        title: evidence.title,
        kind: 'artifact',
        source: evidence.type,
        uri: evidence.uri,
        createdAt: evidence.created_at
      });
    }
    artifacts.push({
      id: `evidence-metadata-${evidence.id}`,
      title: `${evidence.title} metadata`,
      kind: 'json',
      source: evidence.type,
      content: JSON.stringify(evidence.metadata_json ?? {}, null, 2),
      contentType: 'application/json',
      createdAt: evidence.created_at
    });
  }
  for (const run of detail?.agentRuns ?? []) {
    const packet = runPacketArtifact(run);
    if (packet) {
      artifacts.push(packet);
    }
  }
  if (task.artifact_path) {
    artifacts.push({
      id: `task-artifact-path-${task.id}`,
      title: 'Task artifact path',
      kind: 'markdown',
      source: task.id,
      content: task.artifact_path,
      contentType: 'text/markdown',
      createdAt: task.updated_at
    });
  }
  return artifacts.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

function runPacketArtifact(run: AgentRun): ArtifactItem | null {
  const packet = packetFromRun(run);
  if (!packet) {
    return null;
  }
  return {
    id: `run-packet-${run.id}`,
    title: `${packet.agent_display_name || run.agent_role} packet`,
    kind: 'markdown',
    source: run.id,
    content: packet.packet_markdown || JSON.stringify(packet, null, 2),
    contentType: packet.packet_markdown ? 'text/markdown' : 'application/json',
    createdAt: run.started_at ?? run.last_heartbeat_at
  };
}

function packetFromRun(run: AgentRun): TaskPacket | null {
  if (!run.metadata_json || typeof run.metadata_json !== 'object') {
    return null;
  }
  const packet = (run.metadata_json as { launch_packet?: unknown }).launch_packet;
  if (!packet || typeof packet !== 'object') {
    return null;
  }
  return packet as TaskPacket;
}

function isArtifactURI(uri: string): boolean {
  return uri.startsWith('artifact://current/');
}

function artifactKindFromContent(uri: string, contentType: string, body: string): 'json' | 'markdown' | 'artifact' {
  if (contentType.includes('json') || uri.endsWith('.json')) {
    return 'json';
  }
  if (contentType.includes('markdown') || uri.endsWith('.md')) {
    return 'markdown';
  }
  const trimmed = body.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }
  return 'artifact';
}

function prettyJSON(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function EmptyPanel({ compact = false }: { compact?: boolean }) {
  return (
    <Box
      sx={{
        p: compact ? 2 : 5,
        minHeight: compact ? 120 : 280,
        display: 'grid',
        placeItems: 'center',
        color: 'text.secondary'
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <FactCheckRoundedIcon color="disabled" />
        <Typography sx={{ fontWeight: 700 }}>No records</Typography>
      </Stack>
    </Box>
  );
}
