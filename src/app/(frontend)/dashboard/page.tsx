'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, BarChart3 } from 'lucide-react'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  // TODO: Get user from session/auth
  const displayName = 'User'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {displayName}!</h1>
        <p className="text-gray-600">Ready to create amazing movies with AI? Let's get started.</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest project updates and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Film className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity yet.</p>
            <p className="text-sm">Create your first project to get started!</p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">Getting Started</CardTitle>
          <CardDescription className="text-indigo-700">
            New to Aladdin? Here's how to get started with AI movie production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-indigo-900">Create a Project</h4>
                <p className="text-sm text-indigo-700">Start with a new movie production project</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-indigo-900">Define Your Story</h4>
                <p className="text-sm text-indigo-700">
                  Use AI to develop your script and characters
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-indigo-900">Generate Content</h4>
                <p className="text-sm text-indigo-700">Create videos, images, and audio with AI</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-indigo-900">Collaborate</h4>
                <p className="text-sm text-indigo-700">Work with your team to refine and produce</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
