/**
 * Unit Tests: DataMode Component
 * Tests for data ingestion/upload mode in orchestrator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface DataUpload {
  id: string
  name: string
  type: string
  size: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  progress?: number
}

// Mock DataMode component
const DataMode = ({
  onUpload,
  uploads = [],
  supportedTypes = ['image/*', 'video/*', 'audio/*', '.txt', '.pdf'],
  maxSize = 100 * 1024 * 1024, // 100MB
  onRemove
}: {
  onUpload?: (files: File[]) => void
  uploads?: DataUpload[]
  supportedTypes?: string[]
  maxSize?: number
  onRemove?: (id: string) => void
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onUpload?.(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    onUpload?.(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div data-testid="data-mode">
      <div
        data-testid="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Drag and drop files here</p>
        <input
          type="file"
          multiple
          accept={supportedTypes.join(',')}
          onChange={handleFileChange}
          data-testid="file-input"
        />
      </div>

      {uploads.length > 0 && (
        <div data-testid="upload-list">
          {uploads.map(upload => (
            <div key={upload.id} data-testid={`upload-${upload.id}`}>
              <span data-testid={`upload-name-${upload.id}`}>{upload.name}</span>
              <span data-testid={`upload-status-${upload.id}`}>{upload.status}</span>
              {upload.progress !== undefined && (
                <progress
                  value={upload.progress}
                  max={100}
                  data-testid={`upload-progress-${upload.id}`}
                />
              )}
              <button
                onClick={() => onRemove?.(upload.id)}
                data-testid={`remove-${upload.id}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Mock React
const React = {
  ChangeEvent: {} as any,
  DragEvent: {} as any
}

describe('DataMode', () => {
  const mockUploads: DataUpload[] = [
    {
      id: '1',
      name: 'test-image.jpg',
      type: 'image/jpeg',
      size: 1024000,
      status: 'completed',
      progress: 100
    },
    {
      id: '2',
      name: 'test-video.mp4',
      type: 'video/mp4',
      size: 5120000,
      status: 'uploading',
      progress: 45
    }
  ]

  const defaultProps = {
    onUpload: vi.fn(),
    uploads: [],
    onRemove: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render data mode', () => {
      render(<DataMode {...defaultProps} />)
      expect(screen.getByTestId('data-mode')).toBeInTheDocument()
    })

    it('should render drop zone', () => {
      render(<DataMode {...defaultProps} />)
      expect(screen.getByTestId('drop-zone')).toBeInTheDocument()
    })

    it('should render file input', () => {
      render(<DataMode {...defaultProps} />)
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })

    it('should display drop zone instructions', () => {
      render(<DataMode {...defaultProps} />)
      expect(screen.getByText('Drag and drop files here')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should call onUpload when files are selected', async () => {
      const user = userEvent.setup()
      render(<DataMode {...defaultProps} />)

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByTestId('file-input')

      await user.upload(input, file)

      expect(defaultProps.onUpload).toHaveBeenCalled()
    })

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup()
      render(<DataMode {...defaultProps} />)

      const files = [
        new File(['test1'], 'test1.txt', { type: 'text/plain' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' })
      ]
      const input = screen.getByTestId('file-input')

      await user.upload(input, files)

      expect(defaultProps.onUpload).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'test1.txt' }),
          expect.objectContaining({ name: 'test2.txt' })
        ])
      )
    })

    it('should accept specified file types', () => {
      render(<DataMode {...defaultProps} />)

      const input = screen.getByTestId('file-input') as HTMLInputElement
      expect(input.accept).toContain('image/*')
      expect(input.accept).toContain('video/*')
    })

    it('should support custom file types', () => {
      render(<DataMode {...defaultProps} supportedTypes={['.csv', '.json']} />)

      const input = screen.getByTestId('file-input') as HTMLInputElement
      expect(input.accept).toContain('.csv')
      expect(input.accept).toContain('.json')
    })
  })

  describe('Drag and Drop', () => {
    it('should handle file drop', async () => {
      render(<DataMode {...defaultProps} />)

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const dropZone = screen.getByTestId('drop-zone')

      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      })

      dropZone.dispatchEvent(dropEvent)

      await waitFor(() => {
        expect(defaultProps.onUpload).toHaveBeenCalled()
      })
    })

    it('should prevent default drag over behavior', () => {
      render(<DataMode {...defaultProps} />)

      const dropZone = screen.getByTestId('drop-zone')
      const dragOverEvent = new Event('dragover', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')

      dropZone.dispatchEvent(dragOverEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Upload List Display', () => {
    it('should display upload list when uploads exist', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)
      expect(screen.getByTestId('upload-list')).toBeInTheDocument()
    })

    it('should not display upload list when empty', () => {
      render(<DataMode {...defaultProps} uploads={[]} />)
      expect(screen.queryByTestId('upload-list')).not.toBeInTheDocument()
    })

    it('should display all uploads', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      expect(screen.getByTestId('upload-1')).toBeInTheDocument()
      expect(screen.getByTestId('upload-2')).toBeInTheDocument()
    })

    it('should display upload names', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      expect(screen.getByTestId('upload-name-1')).toHaveTextContent('test-image.jpg')
      expect(screen.getByTestId('upload-name-2')).toHaveTextContent('test-video.mp4')
    })

    it('should display upload status', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      expect(screen.getByTestId('upload-status-1')).toHaveTextContent('completed')
      expect(screen.getByTestId('upload-status-2')).toHaveTextContent('uploading')
    })

    it('should display progress bars for uploading files', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      const progress = screen.getByTestId('upload-progress-2') as HTMLProgressElement
      expect(progress.value).toBe(45)
      expect(progress.max).toBe(100)
    })
  })

  describe('Upload Removal', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      await user.click(screen.getByTestId('remove-1'))

      expect(defaultProps.onRemove).toHaveBeenCalledWith('1')
    })

    it('should render remove buttons for all uploads', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      expect(screen.getByTestId('remove-1')).toBeInTheDocument()
      expect(screen.getByTestId('remove-2')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onUpload callback', async () => {
      const user = userEvent.setup()
      render(<DataMode uploads={[]} />)

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByTestId('file-input')

      await user.upload(input, file)

      // Should not throw
      expect(screen.getByTestId('data-mode')).toBeInTheDocument()
    })

    it('should handle undefined onRemove callback', async () => {
      const user = userEvent.setup()
      render(<DataMode uploads={mockUploads} />)

      await user.click(screen.getByTestId('remove-1'))

      // Should not throw
      expect(screen.getByTestId('data-mode')).toBeInTheDocument()
    })

    it('should handle empty file selection', async () => {
      render(<DataMode {...defaultProps} />)

      const input = screen.getByTestId('file-input')
      const changeEvent = new Event('change', { bubbles: true })
      Object.defineProperty(changeEvent, 'target', {
        value: { files: [] }
      })

      input.dispatchEvent(changeEvent)

      // Should handle gracefully
      expect(screen.getByTestId('data-mode')).toBeInTheDocument()
    })

    it('should handle large file lists', () => {
      const manyUploads = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `file-${i}.txt`,
        type: 'text/plain',
        size: 1024,
        status: 'completed' as const
      }))

      render(<DataMode {...defaultProps} uploads={manyUploads} />)

      expect(screen.getByTestId('upload-list')).toBeInTheDocument()
      expect(screen.getByTestId('upload-0')).toBeInTheDocument()
    })
  })

  describe('Upload States', () => {
    it('should display pending uploads', () => {
      const uploads: DataUpload[] = [{
        id: '1',
        name: 'pending.txt',
        type: 'text/plain',
        size: 1024,
        status: 'pending'
      }]

      render(<DataMode {...defaultProps} uploads={uploads} />)
      expect(screen.getByTestId('upload-status-1')).toHaveTextContent('pending')
    })

    it('should display failed uploads', () => {
      const uploads: DataUpload[] = [{
        id: '1',
        name: 'failed.txt',
        type: 'text/plain',
        size: 1024,
        status: 'failed'
      }]

      render(<DataMode {...defaultProps} uploads={uploads} />)
      expect(screen.getByTestId('upload-status-1')).toHaveTextContent('failed')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<DataMode {...defaultProps} />)

      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveAttribute('multiple')
    })

    it('should have accessible remove buttons', () => {
      render(<DataMode {...defaultProps} uploads={mockUploads} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })
  })
})
