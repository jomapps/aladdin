# User Guide - Aladdin Agent Monitoring Platform

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Agent Monitoring](#agent-monitoring)
- [Department Management](#department-management)
- [Real-Time Updates](#real-time-updates)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

## Overview

Aladdin is a real-time agent execution monitoring platform that helps you track, analyze, and manage AI agents organized by departments. Monitor agent performance, view execution timelines, analyze quality metrics, and track activity across your organization.

### Key Features

- **Real-Time Monitoring**: Live WebSocket updates for agent execution
- **Department Organization**: Agents grouped by functional departments
- **Quality Metrics**: Track agent performance and output quality
- **Execution Timeline**: Visual timeline of agent events and actions
- **Audit Trail**: Complete history of all agent executions
- **Tool Call Tracking**: Monitor which tools agents use
- **Output Streaming**: Real-time agent output display

## Getting Started

### Accessing the Platform

1. Navigate to the Aladdin dashboard
2. Log in with your credentials
3. You'll land on the main dashboard showing all departments

### First-Time Setup

1. **Review Departments**: Familiarize yourself with available departments
2. **Explore Agents**: View agents in each department
3. **Check Recent Activity**: See what agents have been working on
4. **Test Real-Time**: Start an agent execution to see live updates

## Dashboard Overview

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Department Cards                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Research │  │ Coding   │  │ Testing  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  Recent Activity                                        │
│  ┌─────────────────────────────────────────────┐       │
│  │ Agent X completed task...                   │       │
│  │ Agent Y started execution...                │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Department Card

Each department card shows:

- **Department Icon**: Visual identifier
- **Department Name**: e.g., "Research", "Coding", "Testing"
- **Description**: Brief department overview
- **Agent Count**: Number of agents in the department
- **Recent Activity**: Latest executions from this department

**Click a department card** to view the department dashboard.

## Agent Monitoring

### Agent Status Dashboard

When you click on an agent execution, you see:

#### 1. Agent Card

Shows agent information:
- **Agent Name**: e.g., "Research Lead"
- **Agent ID**: Unique identifier
- **Department**: Which department the agent belongs to
- **Status Badge**: Current execution status
  - 🕒 **Pending**: Waiting to start
  - 🔄 **Running**: Currently executing
  - ✅ **Completed**: Successfully finished
  - ❌ **Failed**: Encountered an error
  - ⛔ **Cancelled**: Manually stopped
- **Quality Score**: Performance metric (if available)
- **Execution Time**: How long the task took

#### 2. Execution Timeline

Visual timeline showing:
- **Start Event**: When execution began
- **Tool Calls**: Each tool the agent used
- **Output Events**: Agent responses and outputs
- **Error Events**: Any errors encountered
- **Complete Event**: Final result

**Timeline Features**:
- Hover over events for details
- Events color-coded by type
- Timestamps for each event
- Auto-scrolls to latest event

#### 3. Agent Output Stream

Real-time output display:
- **Live Updates**: New output appears instantly
- **Syntax Highlighting**: Code formatted for readability
- **Auto-Scroll**: Follows latest output
- **Copy Button**: Copy output to clipboard

#### 4. Tool Calls Log

Track which tools the agent used:
- **Tool Name**: e.g., "web_search", "code_editor"
- **Input**: What was passed to the tool
- **Output**: Tool's response
- **Duration**: How long the tool call took
- **Status**: Success or failure

#### 5. Quality Metrics

Performance breakdown:
- **Overall Score**: 0-100 quality rating
- **Accuracy**: How correct the output is
- **Completeness**: How thorough the result is
- **Coherence**: How well-structured the output is
- **Creativity**: Innovation in the solution

#### 6. Task Details

Complete task information:
- **Prompt**: Original task given to agent
- **Output**: Final result (if completed)
- **Metadata**:
  - Start time
  - End time
  - Duration
  - Token usage

### Connection Status

At the top of the dashboard:

- **🟢 Live Updates Active**: WebSocket connected, receiving real-time updates
- **🟡 WebSocket Disconnected**: Connection lost, data may be stale
  - Click "Reconnect" to restore connection
- **🔴 Error**: Failed to load execution data
  - Click "Retry" to try again

## Department Management

### Department Dashboard

View all agents in a department:

#### Department Header

- **Department Icon & Name**
- **Description**: What this department does
- **Metrics**:
  - Average Quality Score
  - Average Execution Time
  - Total Executions
- **Status Filter**: Filter by execution status

#### Department Head

Shows the lead agent for this department:
- Special "Head" badge
- Current status
- Performance metrics

#### Specialist Agents

Grid of all other agents in the department:
- Agent cards with current status
- Click any agent to view details
- Color-coded by department

#### Recent Activity

Timeline of recent executions:
- Latest tasks completed
- Agents involved
- Execution outcomes

### Department Metrics

**Average Quality Score**: Mean quality across all executions
**Average Duration**: Mean time to complete tasks
**Total Executions**: Number of times agents ran

## Real-Time Updates

### WebSocket Connection

Aladdin uses WebSocket for instant updates:

**What Updates in Real-Time**:
- Agent status changes (pending → running → completed)
- New events on the timeline
- Tool calls as they happen
- Output as it's generated
- Quality scores when available

**Connection Management**:
- Auto-reconnect if disconnected
- Exponential backoff for retries
- Visual indicator of connection status
- Manual reconnect button

### Live Features

1. **Status Changes**: Badge updates instantly
2. **Timeline Growth**: Events appear as they occur
3. **Output Streaming**: Text appears character-by-character
4. **Tool Call Logging**: Calls logged immediately
5. **Metric Updates**: Scores update on completion

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl/Cmd + K`: Quick search (coming soon)
- `Ctrl/Cmd + /`: Show keyboard shortcuts
- `Esc`: Close modals/dialogs

### Navigation Shortcuts

- `G D`: Go to Dashboard
- `G A`: Go to Agents
- `G R`: Go to Recent Activity

### Dashboard Shortcuts

- `R`: Refresh current view
- `F`: Toggle filters
- `N`: New execution (if applicable)

### Monitoring Shortcuts

- `Space`: Pause/resume auto-scroll
- `↓/↑`: Navigate timeline events
- `C`: Copy current output
- `E`: Export execution data (coming soon)

## Tips and Tricks

### 1. Monitoring Active Executions

**Tip**: Keep the dashboard open to see live progress
- WebSocket automatically updates status
- No need to refresh the page
- Watch the timeline grow in real-time

### 2. Analyzing Performance

**Tip**: Compare quality scores across agents
- Sort by quality score to find top performers
- Review tool call patterns of high-quality executions
- Check execution times to optimize tasks

### 3. Debugging Failed Executions

**Tip**: Use the timeline and tool calls to diagnose issues
1. Check timeline for error events
2. Review tool calls that failed
3. Examine output for error messages
4. Look at task details for context

### 4. Using Filters

**Tip**: Filter by status to focus on what matters
- **Running**: See active executions
- **Failed**: Debug problems
- **Completed**: Review successful tasks
- **All**: Overview of everything

### 5. Department Organization

**Tip**: Organize agents by function for clarity
- Research agents in Research department
- Coding agents in Coding department
- Testing agents in Testing department
- Clear separation of concerns

### 6. Quality Metrics

**Tip**: Use quality breakdown to improve prompts
- Low accuracy → Be more specific
- Low completeness → Add more detail
- Low coherence → Simplify the task
- Low creativity → Allow more freedom

### 7. Tool Call Analysis

**Tip**: Understand which tools agents use most
- Frequent web_search → Research-heavy task
- Many code_editor calls → Development work
- Calculator usage → Mathematical operations
- Pattern recognition for optimization

### 8. Output Streaming

**Tip**: Watch output to catch issues early
- Pause auto-scroll to review specific sections
- Copy output for further analysis
- Look for patterns in successful executions

## Troubleshooting

### WebSocket Connection Issues

**Problem**: "WebSocket disconnected" banner appears

**Solutions**:
1. Click "Reconnect" button
2. Check your internet connection
3. Refresh the page
4. Clear browser cache
5. Try a different browser

**Prevention**:
- Stable internet connection
- Modern browser (Chrome, Firefox, Safari, Edge)
- Disable aggressive ad blockers

### Loading Issues

**Problem**: Dashboard shows loading spinner indefinitely

**Solutions**:
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache and cookies
4. Check if API is accessible
5. Contact support if persists

### Missing Data

**Problem**: Execution data not showing

**Solutions**:
1. Verify execution ID is correct
2. Check if execution exists in database
3. Ensure you have permission to view
4. Wait a few seconds for data to load
5. Check API endpoint status

### Real-Time Updates Not Working

**Problem**: Changes don't appear automatically

**Solutions**:
1. Check WebSocket connection status
2. Click reconnect if disconnected
3. Refresh the page
4. Verify execution is actually running
5. Check browser console for errors

### Performance Issues

**Problem**: Dashboard feels slow or laggy

**Solutions**:
1. Close unused browser tabs
2. Disable browser extensions temporarily
3. Clear browser cache
4. Check CPU/memory usage
5. Use Chrome for best performance

### Display Issues

**Problem**: Layout looks broken or text overlaps

**Solutions**:
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Update browser to latest version
4. Check browser zoom level (should be 100%)
5. Try different browser

## Getting Help

### Support Resources

- **Documentation**: Check other docs in `/mnt/d/Projects/aladdin/docs/ui/`
- **Developer Guide**: For technical details
- **API Reference**: For integration help
- **Component Docs**: For UI component details

### Reporting Issues

When reporting issues, include:
1. What you were trying to do
2. What happened instead
3. Steps to reproduce
4. Browser and version
5. Screenshots if applicable
6. Console errors (F12 → Console tab)

### Feature Requests

Submit feature requests with:
1. Description of desired feature
2. Use case / why it's needed
3. How it should work
4. Examples from other tools (if applicable)

## Best Practices

### Daily Usage

1. **Start of Day**: Review recent activity
2. **During Work**: Monitor running executions
3. **End of Day**: Check completed tasks
4. **Weekly**: Analyze quality trends

### Team Collaboration

1. **Share Execution URLs**: Send links to specific executions
2. **Department Reviews**: Regular department performance checks
3. **Quality Standards**: Define minimum quality thresholds
4. **Documentation**: Document successful patterns

### Optimization

1. **Monitor Quality**: Track trends over time
2. **Analyze Tools**: See which tools are most effective
3. **Execution Times**: Optimize long-running tasks
4. **Error Patterns**: Fix recurring issues

## Next Steps

- Explore [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for technical details
- Review [API Reference](/mnt/d/Projects/aladdin/docs/ui/API_REFERENCE.md) for integration
- Check [Accessibility Guide](/mnt/d/Projects/aladdin/docs/ui/ACCESSIBILITY.md) for inclusive usage
