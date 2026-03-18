import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CircleAlertIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  LoaderIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { TaskAttachment } from '@/api/task/schema'
import { AttachmentLightbox } from '@/components/tasks/attachment-lightbox'
import { taskService } from '@/api/task/service'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatBytes } from '@/helpers/formatters'
import { type FileWithPreview, useFileUpload } from '@/hooks/use-file-upload'
import { cn } from '@/lib/utils'

interface TaskAttachmentsProps {
  taskId?: number
  attachments?: TaskAttachment[]
  mode?: 'immediate' | 'deferred'
  isLoading?: boolean
  showDropZone?: boolean
  onPendingFilesChange?: (hasPending: boolean) => void
}

export interface TaskAttachmentsRef {
  uploadPendingFiles: (taskId?: number) => Promise<void>
  hasPendingFiles: () => boolean
  getPendingFiles: () => File[]
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className='size-3.5' />
  if (type.startsWith('video/')) return <VideoIcon className='size-3.5' />
  if (type.startsWith('audio/')) return <HeadphonesIcon className='size-3.5' />
  if (type.includes('pdf')) return <FileTextIcon className='size-3.5' />
  if (type.includes('word') || type.includes('doc')) return <FileTextIcon className='size-3.5' />
  if (type.includes('excel') || type.includes('sheet'))
    return <FileSpreadsheetIcon className='size-3.5' />
  if (type.includes('zip') || type.includes('rar')) return <FileArchiveIcon className='size-3.5' />
  return <FileTextIcon className='size-3.5' />
}

interface FileTypeInfo {
  label: string
  className: string
}

const getFileTypeInfo = (type: string): FileTypeInfo => {
  if (type.startsWith('image/'))
    return { label: 'Image', className: 'border-purple-200 bg-purple-500/10 text-purple-600 dark:border-purple-700 dark:bg-purple-500/20 dark:text-purple-400' }
  if (type.startsWith('video/'))
    return { label: 'Video', className: 'border-pink-200 bg-pink-500/10 text-pink-600 dark:border-pink-700 dark:bg-pink-500/20 dark:text-pink-400' }
  if (type.startsWith('audio/'))
    return { label: 'Audio', className: 'border-orange-200 bg-orange-500/10 text-orange-600 dark:border-orange-700 dark:bg-orange-500/20 dark:text-orange-400' }
  if (type.includes('pdf'))
    return { label: 'PDF', className: 'border-red-200 bg-red-500/10 text-red-600 dark:border-red-700 dark:bg-red-500/20 dark:text-red-400' }
  if (type.includes('word') || type.includes('doc'))
    return { label: 'Word', className: 'border-blue-200 bg-blue-500/10 text-blue-600 dark:border-blue-700 dark:bg-blue-500/20 dark:text-blue-400' }
  if (type.includes('excel') || type.includes('sheet'))
    return { label: 'Excel', className: 'border-green-200 bg-green-500/10 text-green-600 dark:border-green-700 dark:bg-green-500/20 dark:text-green-400' }
  if (type.includes('zip') || type.includes('rar'))
    return { label: 'Archive', className: 'border-amber-200 bg-amber-500/10 text-amber-600 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-400' }
  if (type.includes('json'))
    return { label: 'JSON', className: 'border-yellow-200 bg-yellow-500/10 text-yellow-600 dark:border-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' }
  if (type.includes('text'))
    return { label: 'Text', className: 'border-slate-200 bg-slate-500/10 text-slate-600 dark:border-slate-700 dark:bg-slate-500/20 dark:text-slate-400' }
  return { label: 'File', className: 'border-border bg-bg-secondary text-text-tertiary' }
}

interface UploadingFile {
  id: string
  name: string
  type: string
  size: number
}

export const TaskAttachments = forwardRef<TaskAttachmentsRef, TaskAttachmentsProps>(
  function TaskAttachments(
    { taskId, attachments = [], mode = 'immediate', isLoading = false, showDropZone = true, onPendingFilesChange },
    ref
  ) {
    const queryClient = useQueryClient()
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
    const [recentlyUploaded, setRecentlyUploaded] = useState<TaskAttachment[]>([])
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

    const existingIds = new Set(attachments.map((a) => a.id))
    const optimisticAttachments = recentlyUploaded.filter((a) => !existingIds.has(a.id))
    const allAttachments = [...attachments, ...optimisticAttachments]
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)

    const imageAttachments = useMemo(
      () => allAttachments.filter((a) => a.file_type.startsWith('image/')),
      [allAttachments]
    )

    const openPreview = (attachment: TaskAttachment) => {
      const idx = imageAttachments.findIndex((a) => a.id === attachment.id)
      if (idx !== -1) setPreviewIndex(idx)
    }

    // Clean up recentlyUploaded once server data includes them
    useEffect(() => {
      if (recentlyUploaded.length > 0 && recentlyUploaded.every((a) => existingIds.has(a.id))) {
        setRecentlyUploaded([])
      }
    }, [existingIds, recentlyUploaded])

    const uploadMutation = useMutation({
      mutationFn: async ({ file, tempId }: { file: File; tempId: string }) => {
        if (!taskId) throw new Error('Todo ID is required for immediate upload')
        const result = await taskService.uploadAttachment(taskId, file)
        return { result, tempId }
      },
      onMutate: ({ file, tempId }) => {
        setUploadingFiles((prev) => [
          ...prev,
          { id: tempId, name: file.name, type: file.type, size: file.size }
        ])
      },
      onSuccess: ({ result, tempId }) => {
        setUploadingFiles((prev) => {
          const next = prev.filter((f) => f.id !== tempId)
          if (next.length === 0) {
            if (taskId) {
              queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
            }
            queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
          }
          return next
        })
        setRecentlyUploaded((prev) => [...prev, result])
      },
      onError: (_, { tempId }) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
      }
    })

    const deleteMutation = useMutation({
      mutationFn: async (attachmentId: number) => {
        if (!taskId) throw new Error('Todo ID is required for delete')
        await taskService.deleteAttachment(taskId, attachmentId)
        return attachmentId
      },
      onMutate: (attachmentId) => {
        setDeletingIds((prev) => new Set(prev).add(attachmentId))
        setRecentlyUploaded((prev) => prev.filter((a) => a.id !== attachmentId))
      },
      onSettled: (_, __, attachmentId) => {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(attachmentId)
          return next
        })
      },
      onSuccess: () => {
        if (taskId) {
          queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
        }
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      },
      meta: {
        successMessage: 'Attachment deleted'
      }
    })

    const filesToUploadRef = useRef<Array<{ file: File; tempId: string }>>([])

    const [
      { files: pendingFiles, isDragging, errors },
      {
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        openFileDialog,
        getInputProps,
        clearErrors,
        removeFile,
        clearFiles
      }
    ] = useFileUpload({
      maxSize: 10 * 1024 * 1024,
      multiple: true,
      onFilesAdded: (addedFiles) => {
        if (mode === 'immediate') {
          for (const fileWithPreview of addedFiles) {
            if (fileWithPreview.file instanceof File) {
              filesToUploadRef.current.push({
                file: fileWithPreview.file,
                tempId: fileWithPreview.id
              })
            }
          }
        }
      },
      onFilesChange: () => {
        if (mode === 'immediate' && filesToUploadRef.current.length > 0) {
          const files = filesToUploadRef.current
          filesToUploadRef.current = []

          for (const { file, tempId } of files) {
            uploadMutation.mutate({ file, tempId })
          }

          setTimeout(() => clearFiles(), 0)
        }
      }
    })

    const prevPendingCountRef = useRef(pendingFiles.length)
    useEffect(() => {
      const hasPending = pendingFiles.length > 0
      const hadPending = prevPendingCountRef.current > 0
      if (hasPending !== hadPending) {
        onPendingFilesChange?.(hasPending)
      }
      prevPendingCountRef.current = pendingFiles.length
    }, [pendingFiles.length, onPendingFilesChange])

    useImperativeHandle(ref, () => ({
      uploadPendingFiles: async (overrideTaskId?: number) => {
        const targetTaskId = overrideTaskId ?? taskId
        if (!targetTaskId) {
          throw new Error('Todo ID is required to upload files')
        }

        const filesToUpload = pendingFiles.filter(
          (f): f is FileWithPreview & { file: File } => f.file instanceof File
        )

        for (const fileWithPreview of filesToUpload) {
          await taskService.uploadAttachment(targetTaskId, fileWithPreview.file)
        }

        if (filesToUpload.length > 0) {
          queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(targetTaskId) })
          queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
        }

        clearFiles()
      },
      hasPendingFiles: () => pendingFiles.length > 0,
      getPendingFiles: () =>
        pendingFiles
          .filter((f): f is FileWithPreview & { file: File } => f.file instanceof File)
          .map((f) => f.file)
    }))

    const showPendingFiles = mode === 'deferred' && pendingFiles.length > 0

    return (
      <div className='space-y-3'>
        <p className='text-[13px] font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
          Attachments
        </p>

        {showDropZone ? (
          <div
            className={cn(
              'relative flex items-center gap-3 rounded-[8px] border border-dashed px-4 py-3 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border-heavy'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              {...getInputProps()}
              className='sr-only'
            />

            <div className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-secondary transition-colors',
              isDragging && 'bg-primary/10'
            )}>
              <UploadIcon className='size-3.5 text-text-tertiary' />
            </div>

            <div className='min-w-0 flex-1'>
              <p className='text-[13px] text-text-secondary'>
                Drop files here or{' '}
                <button
                  type='button'
                  onClick={openFileDialog}
                  className='cursor-pointer font-medium text-primary hover:underline'
                >
                  browse
                </button>
              </p>
              <p className='text-[12px] text-text-tertiary'>Max 10MB</p>
            </div>
          </div>
        ) : (
          <>
            <input
              {...getInputProps()}
              className='sr-only'
            />
            <button
              type='button'
              onClick={openFileDialog}
              className='inline-flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-border px-2.5 py-2 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
            >
              <UploadIcon className='size-3.5' />
              Add attachment
            </button>
          </>
        )}

        {errors.length > 0 && (
          <div className='flex items-start gap-2 rounded-[6px] border border-red-200 bg-red-500/5 px-3 py-2 text-[12px] text-destructive dark:border-red-800'>
            <CircleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
            <div className='min-w-0 flex-1 space-y-0.5'>
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              <button
                type='button'
                onClick={clearErrors}
                className='text-destructive/70 hover:text-destructive text-[11px] underline'
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pending files (deferred mode) */}
        {showPendingFiles && (
          <div className='space-y-1.5'>
            <p className='text-[12px] text-text-tertiary'>
              {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} ready to upload
            </p>
            <div className='divide-y divide-border-light rounded-[8px] border border-border'>
              {pendingFiles.map((fileItem) => {
                const file = fileItem.file
                const fileName = file instanceof File ? file.name : file.name
                const fileType = file instanceof File ? file.type : file.type
                const fileSize = file instanceof File ? file.size : file.size
                const typeInfo = getFileTypeInfo(fileType)

                return (
                  <div key={fileItem.id} className='flex items-center gap-2.5 px-3 py-2'>
                    <span className='shrink-0 text-text-tertiary'>
                      {getFileIcon(fileType)}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
                          {fileName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{fileName}</TooltipContent>
                    </Tooltip>
                    <span className={cn(
                      'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                      typeInfo.className
                    )}>
                      {typeInfo.label}
                    </span>
                    <span className='inline-flex shrink-0 rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary'>
                      New
                    </span>
                    <span className='shrink-0 text-[12px] tabular-nums text-text-tertiary'>
                      {formatBytes(fileSize)}
                    </span>
                    <button
                      type='button'
                      onClick={() => removeFile(fileItem.id)}
                      className='shrink-0 rounded-[4px] p-1 text-text-tertiary transition-colors duration-75 hover:bg-bg-hover hover:text-destructive'
                    >
                      <Trash2Icon className='size-3' />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Existing + uploading files */}
        {(allAttachments.length > 0 || uploadingFiles.length > 0 || isLoading) && (
          <div className='divide-y divide-border-light rounded-[8px] border border-border'>
            {isLoading && (
              <>
                {[1, 2].map((k) => (
                  <div key={k} className='flex items-center gap-2.5 px-3 py-2'>
                    <Skeleton className='size-3.5 shrink-0' />
                    <Skeleton className='h-3.5 w-32 flex-1' />
                    <Skeleton className='h-4 w-12' />
                    <Skeleton className='h-3.5 w-14' />
                  </div>
                ))}
              </>
            )}

            {!isLoading && uploadingFiles.map((file) => {
              const typeInfo = getFileTypeInfo(file.type)
              return (
                <div key={file.id} className='flex items-center gap-2.5 px-3 py-2'>
                  <span className='shrink-0 text-text-tertiary'>
                    {getFileIcon(file.type)}
                  </span>
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium text-text-secondary'>
                    {file.name}
                  </span>
                  <LoaderIcon className='size-3 shrink-0 animate-spin text-text-tertiary' />
                  <span className={cn(
                    'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                    typeInfo.className
                  )}>
                    {typeInfo.label}
                  </span>
                  <span className='shrink-0 text-[12px] tabular-nums text-text-tertiary'>
                    {formatBytes(file.size)}
                  </span>
                </div>
              )
            })}

            {!isLoading && allAttachments.map((attachment) => {
              const isDeleting = deletingIds.has(attachment.id)
              const isImage = attachment.file_type.startsWith('image/')
              const typeInfo = getFileTypeInfo(attachment.file_type)

              return (
                <div
                  key={attachment.id}
                  className={cn(
                    'group/file flex items-center gap-2.5 px-3 py-2 transition-colors duration-75 hover:bg-bg-hover/50',
                    isDeleting && 'opacity-40'
                  )}
                >
                  {isImage ? (
                    <img
                      src={attachment.download_url}
                      alt={attachment.file_name}
                      className='size-7 shrink-0 cursor-pointer rounded-[4px] object-cover'
                      onClick={() => openPreview(attachment)}
                    />
                  ) : (
                    <span className='shrink-0 text-text-tertiary'>
                      {getFileIcon(attachment.file_type)}
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[13px] font-medium',
                          isImage && 'cursor-pointer'
                        )}
                        onClick={isImage ? () => openPreview(attachment) : undefined}
                      >
                        {attachment.file_name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{attachment.file_name}</TooltipContent>
                  </Tooltip>
                  <span className={cn(
                    'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                    typeInfo.className
                  )}>
                    {typeInfo.label}
                  </span>
                  <span className='shrink-0 text-[12px] tabular-nums text-text-tertiary'>
                    {formatBytes(attachment.file_size)}
                  </span>
                  <div className='flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-75 group-hover/file:opacity-100'>
                    <a
                      href={attachment.download_url}
                      download={attachment.file_name}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='rounded-[4px] p-1 text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
                    >
                      <DownloadIcon className='size-3' />
                    </a>
                    <button
                      type='button'
                      onClick={() => deleteMutation.mutate(attachment.id)}
                      disabled={isDeleting}
                      className='rounded-[4px] p-1 text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-destructive disabled:pointer-events-none'
                    >
                      {isDeleting ? (
                        <LoaderIcon className='size-3 animate-spin' />
                      ) : (
                        <Trash2Icon className='size-3' />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {previewIndex !== null && imageAttachments.length > 0 && (
          <AttachmentLightbox
            images={imageAttachments}
            currentIndex={previewIndex}
            onIndexChange={setPreviewIndex}
            onClose={() => setPreviewIndex(null)}
          />
        )}
      </div>
    )
  }
)
