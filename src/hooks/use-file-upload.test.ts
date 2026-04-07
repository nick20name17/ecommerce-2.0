import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { useFileUpload } from './use-file-upload'

// Mock URL.createObjectURL / revokeObjectURL (not available in jsdom)
beforeEach(() => {
  vi.stubGlobal('URL', {
    ...globalThis.URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  })
})

/** Helper to create a fake File */
function makeFile(name: string, size: number, type: string = 'text/plain'): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type })
}

// ── File validation: size limits ────────────────────────────

describe('useFileUpload - size validation', () => {
  it('accepts a file within the size limit', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 1024, multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('small.txt', 500)])
    })

    expect(result.current[0].files).toHaveLength(1)
    expect(result.current[0].errors).toHaveLength(0)
  })

  it('rejects a file that exceeds the size limit', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 1024, multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('big.txt', 2048)])
    })

    expect(result.current[0].files).toHaveLength(0)
    expect(result.current[0].errors.length).toBeGreaterThan(0)
  })

  it('rejects oversized file in single-file mode', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 100 })
    )

    act(() => {
      result.current[1].addFiles([makeFile('huge.txt', 500)])
    })

    expect(result.current[0].files).toHaveLength(0)
    expect(result.current[0].errors.length).toBeGreaterThan(0)
  })
})

// ── File validation: accepted types ─────────────────────────

describe('useFileUpload - type validation', () => {
  it('accepts a file with a matching MIME type', () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: 'image/*', multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('photo.png', 100, 'image/png')])
    })

    expect(result.current[0].files).toHaveLength(1)
    expect(result.current[0].errors).toHaveLength(0)
  })

  it('rejects a file with a non-matching MIME type', () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: 'image/*', multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('doc.pdf', 100, 'application/pdf')])
    })

    expect(result.current[0].files).toHaveLength(0)
    expect(result.current[0].errors.length).toBeGreaterThan(0)
  })

  it('accepts file matching extension-based accept', () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: '.csv,.xlsx', multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('data.csv', 100, 'text/csv')])
    })

    expect(result.current[0].files).toHaveLength(1)
  })

  it('rejects file not matching extension-based accept', () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: '.csv', multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('data.json', 100, 'application/json')])
    })

    expect(result.current[0].files).toHaveLength(0)
    expect(result.current[0].errors.length).toBeGreaterThan(0)
  })

  it('accepts any file when accept is wildcard', () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: '*', multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('anything.xyz', 100, 'application/octet-stream')])
    })

    expect(result.current[0].files).toHaveLength(1)
  })
})

// ── Duplicate detection ─────────────────────────────────────

describe('useFileUpload - duplicate detection', () => {
  it('skips duplicate files in multiple mode (same name and size)', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('report.pdf', 200, 'application/pdf')])
    })

    act(() => {
      result.current[1].addFiles([makeFile('report.pdf', 200, 'application/pdf')])
    })

    expect(result.current[0].files).toHaveLength(1)
  })

  it('allows files with same name but different size', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('report.pdf', 200, 'application/pdf')])
    })

    act(() => {
      result.current[1].addFiles([makeFile('report.pdf', 300, 'application/pdf')])
    })

    expect(result.current[0].files).toHaveLength(2)
  })

  it('replaces file in single mode (no duplicate check)', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: false })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 100)])
    })

    act(() => {
      result.current[1].addFiles([makeFile('b.txt', 100)])
    })

    expect(result.current[0].files).toHaveLength(1)
    expect(result.current[0].files[0].file.name).toBe('b.txt')
  })
})

// ── Max file count enforcement ──────────────────────────────

describe('useFileUpload - max file count', () => {
  it('rejects batch that would exceed maxFiles', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxFiles: 2, multiple: true })
    )

    act(() => {
      result.current[1].addFiles([
        makeFile('a.txt', 10),
        makeFile('b.txt', 10),
        makeFile('c.txt', 10)
      ])
    })

    expect(result.current[0].files).toHaveLength(0)
    expect(result.current[0].errors).toContain('You can only upload a maximum of 2 files.')
  })

  it('rejects when adding to already-full list', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxFiles: 1, multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 10)])
    })

    expect(result.current[0].files).toHaveLength(1)

    act(() => {
      result.current[1].addFiles([makeFile('b.txt', 10)])
    })

    expect(result.current[0].files).toHaveLength(1)
    expect(result.current[0].errors).toContain('You can only upload a maximum of 1 files.')
  })

  it('allows exactly maxFiles', () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxFiles: 3, multiple: true })
    )

    act(() => {
      result.current[1].addFiles([
        makeFile('a.txt', 10),
        makeFile('b.txt', 10),
        makeFile('c.txt', 10)
      ])
    })

    expect(result.current[0].files).toHaveLength(3)
    expect(result.current[0].errors).toHaveLength(0)
  })
})

// ── removeFile / clearFiles ─────────────────────────────────

describe('useFileUpload - removeFile and clearFiles', () => {
  it('removes a file by id', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 10), makeFile('b.txt', 20)])
    })

    const idToRemove = result.current[0].files[0].id

    act(() => {
      result.current[1].removeFile(idToRemove)
    })

    expect(result.current[0].files).toHaveLength(1)
  })

  it('clears all files', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 10)])
    })

    act(() => {
      result.current[1].clearFiles()
    })

    expect(result.current[0].files).toHaveLength(0)
  })

  it('does nothing when removing a non-existent id', () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 10)])
    })

    act(() => {
      result.current[1].removeFile('non-existent-id')
    })

    expect(result.current[0].files).toHaveLength(1)
  })
})

// ── Callbacks ───────────────────────────────────────────────

describe('useFileUpload - callbacks', () => {
  it('calls onError when validation fails', () => {
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 10, multiple: true, onError })
    )

    act(() => {
      result.current[1].addFiles([makeFile('big.txt', 1000)])
    })

    expect(onError).toHaveBeenCalled()
  })

  it('calls onFilesAdded when valid files are added', () => {
    const onFilesAdded = vi.fn()
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true, onFilesAdded })
    )

    act(() => {
      result.current[1].addFiles([makeFile('a.txt', 10)])
    })

    expect(onFilesAdded).toHaveBeenCalledTimes(1)
    expect(onFilesAdded.mock.calls[0][0]).toHaveLength(1)
  })
})
