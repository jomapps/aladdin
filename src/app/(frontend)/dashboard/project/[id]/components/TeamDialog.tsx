'use client';

/**
 * Team Management Dialog Component
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TeamRole } from '@/lib/collaboration/types';

export interface TeamDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TeamDialog({ open, onClose }: TeamDialogProps) {
  const params = useParams();
  const projectId = params.id as string;

  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<TeamRole>(TeamRole.COLLABORATOR);

  useEffect(() => {
    if (open) {
      fetchTeam();
    }
  }, [open]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/team`);
      const data = await response.json();
      setTeam(data.team || []);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    }
  };

  const handleAddMember = async () => {
    if (!newUserEmail) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUserEmail, // In production, resolve email to userId
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      setTeam(data.team);
      setNewUserEmail('');
      setNewUserRole(TeamRole.COLLABORATOR);
    } catch (err: any) {
      console.error('Add member error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/team/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setTeam(data.team);
    } catch (err: any) {
      console.error('Remove member error:', err);
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/team/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setTeam(data.team);
    } catch (err: any) {
      console.error('Update role error:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Team Members</h2>

        {/* Add Member Form */}
        <div className="mb-6 p-4 border rounded-md">
          <h3 className="text-sm font-medium mb-3">Add Team Member</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as TeamRole)}
              className="px-3 py-2 border rounded-md"
            >
              <option value={TeamRole.VIEWER}>Viewer</option>
              <option value={TeamRole.COLLABORATOR}>Collaborator</option>
              <option value={TeamRole.EDITOR}>Editor</option>
            </select>
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !newUserEmail}
            >
              Add
            </button>
          </div>
        </div>

        {/* Team List */}
        <div className="space-y-3">
          {team.map((member: any) => (
            <div
              key={member.user?.id || member.user}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div>
                <div className="font-medium">
                  {member.user?.email || member.user?.name || member.user}
                </div>
                <div className="text-sm text-gray-500">
                  Added {new Date(member.addedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleUpdateRole(member.user?.id || member.user, e.target.value as TeamRole)
                  }
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value={TeamRole.VIEWER}>Viewer</option>
                  <option value={TeamRole.COLLABORATOR}>Collaborator</option>
                  <option value={TeamRole.EDITOR}>Editor</option>
                  <option value={TeamRole.OWNER}>Owner</option>
                </select>
                <button
                  onClick={() => handleRemoveMember(member.user?.id || member.user)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {team.length === 0 && (
            <div className="text-center py-8 text-gray-500">No team members yet</div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
