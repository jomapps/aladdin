/**
 * Not Found Component
 *
 * 404 page component
 */

'use client'

import React from 'react'
import Link from 'next/link'

interface NotFoundProps {
  title?: string
  message?: string
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export function NotFound({
  title = 'Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved.",
  showBackButton = true,
  backUrl = '/',
  backLabel = 'Go to Home',
}: NotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>

        {/* Message */}
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {showBackButton && (
            <Link
              href={backUrl}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {backLabel}
            </Link>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Search suggestion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/projects"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse Projects
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/help"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Resource Not Found (for specific entities)
 */
export function ResourceNotFound({
  resourceType = 'Resource',
  resourceId,
}: {
  resourceType?: string
  resourceId?: string
}) {
  return (
    <div className="p-8 text-center">
      <svg
        className="w-16 h-16 mx-auto text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {resourceType} Not Found
      </h3>
      <p className="text-gray-600 mb-6">
        {resourceId
          ? `${resourceType} with ID "${resourceId}" doesn't exist.`
          : `The ${resourceType.toLowerCase()} you're looking for doesn't exist.`}
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Go Back
      </button>
    </div>
  )
}
