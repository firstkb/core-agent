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
import type { ChangeEvent, FormEvent } from 'react';
import { MaestroAPI, apiBaseURL } from '../api/client';
import type {
  AgentRun,
  Approval,
  CockpitState,
  Evidence,
  EvidenceAttachmentInput,
  Stage,
  StageInput,
  Task,
  TaskDetail,
  TaskInput,
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
type DetailTab = 'stages' | 'evidence' | 'approvals' | 'runs';
type StageAction = 'start' | 'pause' | 'resume' | 'cancel';
type StageReviewDecision = 'accept' | 'revise' | 'block' | 'cancel';
type ApprovalDecision = 'approved' | 'rejected';

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

const initialState: CockpitState = {
  health: null,
  work: [],
  tasks: [],
  approvals: [],
  agentRuns: []
};

export function App() {
  const api = useMemo(() => new MaestroAPI(), []);
  const [state, setState] = useState<CockpitState>(initialState);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.loadCockpit();
      setState(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadDetail = useCallback(
    async (taskID: string) => {
      setDetailLoading(true);
      try {
        setDetail(await api.loadTaskDetail(taskID));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        setDetailLoading(false);
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

  const handleApprovalDecision = useCallback(
    async (approval: Approval, decision: ApprovalDecision) => {
      await runCommand(`approval:${approval.id}:${decision}`, () => api.decideApproval(approval.id, decision));
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
    if (selectedTaskID) {
      void loadDetail(selectedTaskID);
    } else {
      setDetail(null);
    }
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
                runs={state.agentRuns}
                tasks={state.tasks}
                work={state.work}
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
        loading={detailLoading}
        tab={detailTab}
        actionKey={actionKey}
        onTabChange={setDetailTab}
        onStageAction={handleStageAction}
        onStageReview={handleStageReview}
        onApprovalDecision={handleApprovalDecision}
        onAttachEvidence={handleAttachEvidence}
        onClose={() => setSelectedTaskID(null)}
      />
      <IntakeDialog
        open={intakeOpen}
        busy={intakeBusy}
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
  runs,
  tasks,
  work,
  onSelectTask
}: {
  loading: boolean;
  runs: AgentRun[];
  tasks: Task[];
  work: Work[];
  onSelectTask: (taskID: string) => void;
}) {
  const taskByID = new Map(tasks.map((task) => [task.id, task]));

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" sx={{ flex: 1 }}>
          Agent Runs
        </Typography>
        <StatusChip label={String(runs.length)} />
      </Stack>
      {loading ? (
        <Box sx={{ p: 4 }}>
          <LinearProgress />
        </Box>
      ) : runs.length === 0 ? (
        <EmptyPanel />
      ) : (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
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
    </Paper>
  );
}

function IntakeDialog({
  open,
  busy,
  onClose,
  onCreate
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (input: IntakeInput) => Promise<void>;
}) {
  const [form, setForm] = useState<IntakeInput>(defaultIntakeInput);
  const canSubmit = Boolean(form.workTitle.trim() && form.taskTitle.trim());

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
                <MenuItem value="mason">Mason</MenuItem>
                <MenuItem value="charlie">Charlie</MenuItem>
                <MenuItem value="scout">Scout</MenuItem>
                <MenuItem value="lens">Lens</MenuItem>
                <MenuItem value="scribe">Scribe</MenuItem>
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
  loading: boolean;
  tab: DetailTab;
  actionKey: string | null;
  onTabChange: (tab: DetailTab) => void;
  onStageAction: (stage: Stage, action: StageAction) => void;
  onStageReview: (stage: Stage, decision: StageReviewDecision) => void;
  onApprovalDecision: (approval: Approval, decision: ApprovalDecision) => void;
  onAttachEvidence: (input: EvidenceAttachmentInput) => void;
  onClose: () => void;
};

function TaskDrawer({
  open,
  task,
  work,
  detail,
  loading,
  tab,
  actionKey,
  onTabChange,
  onStageAction,
  onStageReview,
  onApprovalDecision,
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
            <Tab value="evidence" label="Evidence" />
            <Tab value="approvals" label="Approvals" />
            <Tab value="runs" label="Agent Runs" />
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
                {tab === 'runs' && <AgentRunPanel runs={detail?.agentRuns ?? []} />}
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

function AgentRunPanel({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return <EmptyPanel compact />;
  }
  return (
    <Stack spacing={1.25}>
      {runs.map((run) => (
        <Paper key={run.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={0.75}>
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
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
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
