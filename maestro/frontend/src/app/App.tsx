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
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
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
  Approval,
  Attempt,
  AttemptInput,
  AttemptSubmitInput,
  CockpitState,
  Evidence,
  EvidenceAttachmentInput,
  Stage,
  RunEventEntry,
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
  boardColumns,
  filterTasks,
  formatDate,
  groupTasks,
  latestEvidence,
  metrics,
  riskTone,
  shortID,
  stageProgress,
  statusTone,
  taskGateSignal,
  workTitle
} from './viewModel';

type ViewMode = 'table' | 'kanban';
type MainView = 'dashboard' | 'table' | 'kanban' | 'agent-runs';
type DetailTab = 'stages' | 'attempts' | 'packet' | 'evidence' | 'approvals' | 'runs' | 'events';
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

export function App() {
  const api = useMemo(() => new MaestroAPI(), []);
  const [state, setState] = useState<CockpitState>(initialState);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [packetPreview, setPacketPreview] = useState<TaskPacket | null>(null);
  const [selectedTaskID, setSelectedTaskID] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [detailTab, setDetailTab] = useState<DetailTab>('stages');
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
  const groupedTasks = useMemo(() => groupTasks(visibleTasks), [visibleTasks]);

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
        setDetailTab('runs');
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
        setDetailTab('stages');
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
          <Tooltip title="Task table" placement="right">
            <IconButton color={mainView === 'table' ? 'primary' : 'default'} aria-label="Task table" onClick={() => setMainView('table')}>
              <TableRowsRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kanban" placement="right">
            <IconButton color={mainView === 'kanban' ? 'primary' : 'default'} aria-label="Kanban" onClick={() => setMainView('kanban')}>
              <ViewKanbanRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Agent runs" placement="right">
            <IconButton color={mainView === 'agent-runs' ? 'primary' : 'default'} aria-label="Agent runs" onClick={() => setMainView('agent-runs')}>
              <AccountTreeRoundedIcon />
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
                onSelectTask={(task) => setSelectedTaskID(task.id)}
              />
            )}
            {(mainView === 'table' || mainView === 'kanban') && (
              <TaskWorkspace
                loading={loading}
                mode={mainView}
                query={query}
                statusFilter={statusFilter}
                tasks={visibleTasks}
                groupedTasks={groupedTasks}
                work={state.work}
                selectedTaskID={selectedTaskID}
                onModeChange={setMainView}
                onQueryChange={setQuery}
                onStatusFilterChange={setStatusFilter}
                onSelectTask={(task) => setSelectedTaskID(task.id)}
              />
            )}
            {mainView === 'agent-runs' && (
              <AgentRunsWorkspace
                loading={loading}
                capabilities={state.agentCapabilities}
                runs={state.agentRuns}
                runEvents={state.runEvents}
                tasks={state.tasks}
                work={state.work}
                actionKey={actionKey}
                onRunAction={handleAgentRunAction}
                onSelectTask={(taskID) => setSelectedTaskID(taskID)}
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
  const recentTasks = state.tasks.slice(0, 5);
  const recentRuns = state.agentRuns.slice(0, 5);

  return (
    <Stack spacing={2}>
      <MetricStrip metrics={metrics(state.tasks, approvals, state.agentRuns)} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(320px, 1fr)' },
          gap: 2
        }}
      >
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <PanelHeader title="Recent Tasks" actionLabel="Open Table" onAction={onOpenTable} />
          {recentTasks.length === 0 ? (
            <EmptyPanel compact />
          ) : (
            <Stack divider={<Divider />} sx={{ p: 1 }}>
              {recentTasks.map((task) => (
                <TaskSummaryRow key={task.id} task={task} work={state.work} onSelect={() => onSelectTask(task)} />
              ))}
            </Stack>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <PanelHeader title="Agent Runs" actionLabel="Open Runs" onAction={onOpenRuns} />
          {recentRuns.length === 0 ? (
            <EmptyPanel compact />
          ) : (
            <Stack divider={<Divider />} sx={{ p: 1 }}>
              {recentRuns.map((run) => (
                <AgentRunSummaryRow key={run.id} run={run} tasks={state.tasks} />
              ))}
            </Stack>
          )}
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
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="h3" sx={{ flex: 1 }}>
        {title}
      </Typography>
      <Button size="small" variant="outlined" onClick={onAction}>
        {actionLabel}
      </Button>
    </Stack>
  );
}

function TaskSummaryRow({ task, work, onSelect }: { task: Task; work: Work[]; onSelect: () => void }) {
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
          {task.title}
        </Typography>
        <StatusChip label={task.status} tone={statusTone(task.status)} />
      </Stack>
      <Typography variant="body2" color="text.secondary" noWrap>
        {workTitle(work, task)} / {shortID(task.id)}
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <StatusChip label={task.risk_level} tone={riskTone(task.risk_level)} />
        <StatusChip label={task.agent_role || 'unassigned'} />
        <StatusChip label={task.stack_scope || 'stack n/a'} />
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
  mode,
  query,
  statusFilter,
  tasks,
  groupedTasks,
  work,
  selectedTaskID,
  onModeChange,
  onQueryChange,
  onStatusFilterChange,
  onSelectTask
}: {
  loading: boolean;
  mode: ViewMode;
  query: string;
  statusFilter: string;
  tasks: Task[];
  groupedTasks: Record<string, Task[]>;
  work: Work[];
  selectedTaskID: string | null;
  onModeChange: (mode: ViewMode) => void;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSelectTask: (task: Task) => void;
}) {
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
        <TextField
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search tasks"
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
          <MenuItem value="all">All Statuses</MenuItem>
          {boardColumns.map((column) => (
            <MenuItem key={column.key} value={column.key}>
              {column.label}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next: ViewMode | null) => {
            if (next) {
              onModeChange(next);
            }
          }}
          aria-label="View mode"
        >
          <ToggleButton value="table" aria-label="Table view">
            <TableRowsRoundedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="kanban" aria-label="Kanban view">
            <ViewKanbanRoundedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {loading ? (
        <Box sx={{ p: 4 }}>
          <LinearProgress />
        </Box>
      ) : mode === 'table' ? (
        <TaskTable tasks={tasks} work={work} selectedTaskID={selectedTaskID} onSelect={onSelectTask} />
      ) : (
        <KanbanBoard groupedTasks={groupedTasks} work={work} selectedTaskID={selectedTaskID} onSelect={onSelectTask} />
      )}
    </Paper>
  );
}

function AgentRunsWorkspace({
  loading,
  capabilities,
  runs,
  runEvents,
  tasks,
  work,
  actionKey,
  onRunAction,
  onSelectTask
}: {
  loading: boolean;
  capabilities: AgentCapability[];
  runs: AgentRun[];
  runEvents: RunEventEntry[];
  tasks: Task[];
  work: Work[];
  actionKey: string | null;
  onRunAction: (run: AgentRun, action: AgentRunAction) => void;
  onSelectTask: (taskID: string) => void;
}) {
  const taskByID = new Map(tasks.map((task) => [task.id, task]));

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" sx={{ flex: 1 }}>
          Agents & Runs
        </Typography>
        <StatusChip label={`${capabilities.length} roles`} />
        <StatusChip label={String(runs.length)} />
      </Stack>
      {loading ? (
        <Box sx={{ p: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          <AgentCapabilityOverview capabilities={capabilities} runs={runs} />
          <RunEventTrail events={runEvents.slice(0, 6)} />
          {runs.length === 0 ? (
            <EmptyPanel compact />
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 420px)', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table stickyHeader size="small" aria-label="Maestro agent runs">
                <TableHead>
                  <TableRow>
                    <TableCell>Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Task</TableCell>
                    <TableCell>Work</TableCell>
                    <TableCell>Checkpoint</TableCell>
                    <TableCell>Heartbeat</TableCell>
                    <TableCell align="right">Control</TableCell>
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
                        <TableCell align="right">
                          <AgentRunControls
                            run={run}
                            actionKey={actionKey}
                            compact
                            onAction={onRunAction}
                          />
                        </TableCell>
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

function AgentCapabilityOverview({ capabilities, runs }: { capabilities: AgentCapability[]; runs: AgentRun[] }) {
  if (capabilities.length === 0) {
    return <EmptyPanel compact />;
  }
  const runCounts = runs.reduce<Record<string, number>>((counts, run) => {
    counts[run.agent_role] = (counts[run.agent_role] ?? 0) + 1;
    return counts;
  }, {});
  const visibleCapabilities = capabilities.filter((capability) => capability.formal_chain_role || capability.independent_helper);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
        gap: 1
      }}
    >
      {visibleCapabilities.map((capability) => (
        <Paper
          key={capability.role}
          variant="outlined"
          sx={{
            p: 1.25,
            minHeight: 168,
            bgcolor: capability.independent_helper ? alpha('#19736b', 0.05) : 'background.paper'
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 900 }} noWrap>
                {capability.display_name}
              </Typography>
              <StatusChip label={String(runCounts[capability.role] ?? 0)} tone={runCounts[capability.role] ? 'info' : 'default'} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
              {capability.type}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>
              {capability.purpose}
            </Typography>
            <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <StatusChip label={`code: ${capability.writes_code}`} tone={capability.writes_code === 'no' ? 'default' : 'warning'} />
              <StatusChip label={`browser: ${capability.browser_access}`} />
              <StatusChip label={capability.independent_helper ? 'helper' : 'chain'} tone={capability.independent_helper ? 'success' : 'info'} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              skills: {capability.recommended_skills.slice(0, 3).join(', ') || '-'}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
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

type TaskListProps = {
  tasks: Task[];
  work: Work[];
  selectedTaskID: string | null;
  onSelect: (task: Task) => void;
};

function TaskTable({ tasks, work, selectedTaskID, onSelect }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyPanel />;
  }
  return (
    <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
      <Table stickyHeader size="small" aria-label="Maestro tasks">
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Work</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Risk</TableCell>
            <TableCell>Agent</TableCell>
            <TableCell>Stack</TableCell>
            <TableCell>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              hover
              selected={task.id === selectedTaskID}
              onClick={() => onSelect(task)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell sx={{ minWidth: 240 }}>
                <Typography noWrap sx={{ fontWeight: 800 }}>
                  {task.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {shortID(task.id)}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                <Typography variant="body2" noWrap>
                  {workTitle(work, task)}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip label={task.status} tone={statusTone(task.status)} />
              </TableCell>
              <TableCell>
                <StatusChip label={task.risk_level} tone={riskTone(task.risk_level)} />
              </TableCell>
              <TableCell>{task.agent_role || '-'}</TableCell>
              <TableCell>{task.stack_scope || '-'}</TableCell>
              <TableCell>{formatDate(task.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type KanbanProps = {
  groupedTasks: Record<string, Task[]>;
  work: Work[];
  selectedTaskID: string | null;
  onSelect: (task: Task) => void;
};

function KanbanBoard({ groupedTasks, work, selectedTaskID, onSelect }: KanbanProps) {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'grid' },
        gridTemplateColumns: { lg: 'repeat(5, minmax(0, 1fr))' },
        gap: 1.5,
        overflowX: { xs: 'auto', lg: 'visible' },
        p: 1.5,
        minHeight: 400
      }}
    >
      {boardColumns.map((column) => (
        <Box
          key={column.key}
          sx={{
            width: { xs: 240, lg: 'auto' },
            minWidth: { xs: 240, lg: 0 },
            flex: '0 0 240px',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: '#fbfcfe'
          }}
        >
          <Stack direction="row" spacing={1} sx={{ p: 1.25, borderBottom: 1, borderColor: 'divider', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ flex: 1 }}>
              {column.label}
            </Typography>
            <StatusChip label={String(groupedTasks[column.key]?.length ?? 0)} />
          </Stack>
          <Stack spacing={1} sx={{ p: 1 }}>
            {(groupedTasks[column.key] ?? []).map((task) => (
              <Paper
                key={task.id}
                variant="outlined"
                onClick={() => onSelect(task)}
                sx={{
                  p: 1.25,
                  cursor: 'pointer',
                  borderColor: task.id === selectedTaskID ? 'primary.main' : 'divider',
                  bgcolor: task.id === selectedTaskID ? alpha('#2454a6', 0.06) : 'background.paper'
                }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800 }}>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {workTitle(work, task)}
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <StatusChip label={task.risk_level} tone={riskTone(task.risk_level)} />
                    <StatusChip label={task.agent_role || 'unassigned'} />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
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
            width: { xs: '100%', sm: 560 },
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
                <Typography variant="h2">{task.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {workTitle(work, task)} / {shortID(task.id)}
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
                      Stage Progress
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
            <Tab value="stages" label="Stages" />
            <Tab value="attempts" label="Attempts" />
            <Tab value="packet" label="Packet" />
            <Tab value="evidence" label="Evidence" />
            <Tab value="approvals" label="Approvals" />
            <Tab value="runs" label="Agent Runs" />
            <Tab value="events" label="Events" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', height: 180 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                {tab === 'stages' && (
                  <StagePanel
                    stages={detail?.stages ?? []}
                    actionKey={actionKey}
                    onAction={onStageAction}
                    onReview={onStageReview}
                  />
                )}
                {tab === 'attempts' && (
                  <AttemptPanel
                    task={task}
                    stages={detail?.stages ?? []}
                    attempts={detail?.attempts ?? []}
                    actionKey={actionKey}
                    onCreate={onCreateAttempt}
                    onSubmit={onSubmitAttempt}
                  />
                )}
                {tab === 'packet' && (
                  <PacketPanel
                    task={task}
                    stages={detail?.stages ?? []}
                    capabilities={capabilities}
                    packet={packetPreview}
                    actionKey={actionKey}
                    onGenerate={onGenerateTaskPacket}
                    onLaunch={onLaunchTaskPacket}
                  />
                )}
                {tab === 'evidence' && (
                  <EvidencePanel
                    evidence={detail?.evidence ?? []}
                    busy={actionKey === `evidence:${task.id}:attach`}
                    onAttach={onAttachEvidence}
                  />
                )}
                {tab === 'approvals' && (
                  <ApprovalPanel approvals={detail?.approvals ?? []} actionKey={actionKey} onDecision={onApprovalDecision} />
                )}
                {tab === 'runs' && (
                  <AgentRunPanel
                    task={task}
                    stages={detail?.stages ?? []}
                    runs={detail?.agentRuns ?? []}
                    actionKey={actionKey}
                    onCreate={onCreateAgentRun}
                    onAction={onAgentRunAction}
                    onCheckpoint={onAgentRunCheckpoint}
                  />
                )}
                {tab === 'events' && <RunEventTimeline events={detail?.runEvents ?? []} />}
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
      ) : (
        <EmptyPanel compact />
      )}
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

function RunEventTrail({ events }: { events: RunEventEntry[] }) {
  if (events.length === 0) {
    return null;
  }
  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ flex: 1, fontWeight: 800 }}>
            Recent Events
          </Typography>
          <StatusChip label={String(events.length)} />
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {events.map((event) => (
            <StatusChip
              key={event.id}
              label={`${eventCommandLabel(event.command)} ${eventStatusLabel(event)}`}
              tone={eventTone(event)}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function RunEventTimeline({ events }: { events: RunEventEntry[] }) {
  if (events.length === 0) {
    return <EmptyPanel compact />;
  }
  return (
    <Stack spacing={1.25}>
      {events.map((event) => (
        <Paper key={event.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 800 }}>
                {eventCommandLabel(event.command)}
              </Typography>
              <StatusChip label={eventStatusLabel(event)} tone={eventTone(event)} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {event.reason || `${event.actor_type}:${event.actor_id}`}
            </Typography>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <StatusChip label={event.actor_type} />
              {event.task_id && <StatusChip label={`task ${shortID(event.task_id)}`} />}
              {event.stage_id && <StatusChip label={`stage ${shortID(event.stage_id)}`} />}
              {event.attempt_id && <StatusChip label={`attempt ${shortID(event.attempt_id)}`} />}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatDate(event.created_at)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
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

  const isTerminal = ['completed', 'cancelled', 'failed', 'stale'].includes(run.status);
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

function eventCommandLabel(command: string): string {
  return command
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function eventStatusLabel(event: RunEventEntry): string {
  const nextStatus = statusFromState(event.next_state_json);
  const previousStatus = statusFromState(event.previous_state_json);
  if (nextStatus && previousStatus && nextStatus !== previousStatus) {
    return `${previousStatus} -> ${nextStatus}`;
  }
  return nextStatus || previousStatus || 'recorded';
}

function eventTone(event: RunEventEntry) {
  return statusTone(statusFromState(event.next_state_json) || event.command);
}

function statusFromState(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const status = (value as { status?: unknown }).status;
  return typeof status === 'string' ? status : '';
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
