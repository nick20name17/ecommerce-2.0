import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CircleAlertIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Loader2,
  Paperclip,
  Trash2Icon,
  UploadIcon,
  VideoIcon
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { orderService } from '@/api/order/service'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { proposalService } from '@/api/proposal/service'
import type { EntityAttachment } from '@/api/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes } from '@/helpers/formatters'
import { type FileWithPreview, useFileUpload } from '@/hooks/use-file-upload'
import { cn } from '@/lib/utils'

export type EntityAttachmentType = 'order' | 'proposal'

interface EntityAttachmentsProps {
  entityType: EntityAttachmentType
  entityId?: string
  projectId?: number | null
  attachments?: EntityAttachment[]
  mode?: 'immediate' | 'deferred'
  isLoading?: boolean
  onPendingFilesChange?: (hasPending: boolean) => void
}

export interface EntityAttachmentsRef {
  uploadPendingFiles: (autoid: string, entityType: EntityAttachmentType) => Promise<void>
  hasPendingFiles: () => boolean
  getPendingFiles: () => File[]
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className='size-4' />
  if (type.startsWith('video/')) return <VideoIcon className='size-4' />
  if (type.startsWith('audio/')) return <HeadphonesIcon className='size-4' />
  if (type.includes('pdf')) return <FileTextIcon className='size-4' />
  if (type.includes('word') || type.includes('doc')) return <FileTextIcon className='size-4' />
  if (type.includes('excel') || type.includes('sheet'))
    return <FileSpreadsheetIcon className='size-4' />
  if (type.includes('zip') || type.includes('rar')) return <FileArchiveIcon className='size-4' />
  return <FileTextIcon className='size-4' />
}

interface FileTypeInfo {
  label: string
  className: string
}

const getFileTypeInfo = (type: string): FileTypeInfo => {
  if (type.startsWith('image/'))
    return { label: 'Image', className: 'text-purple-600 bg-purple-500/10 dark:text-purple-400' }
  if (type.startsWith('video/'))
    return { label: 'Video', className: 'text-pink-600 bg-pink-500/10 dark:text-pink-400' }
  if (type.startsWith('audio/'))
    return { label: 'Audio', className: 'text-orange-600 bg-orange-500/10 dark:text-orange-400' }
  if (type.includes('pdf'))
    return { label: 'PDF', className: 'text-red-600 bg-red-500/10 dark:text-red-400' }
  if (type.includes('word') || type.includes('doc'))
    return { label: 'Word', className: 'text-blue-600 bg-blue-500/10 dark:text-blue-400' }
  if (type.includes('excel') || type.includes('sheet'))
    return { label: 'Excel', className: 'text-green-600 bg-green-500/10 dark:text-green-400' }
  if (type.includes('zip') || type.includes('rar'))
    return { label: 'Archive', className: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' }
  if (type.includes('json'))
    return { label: 'JSON', className: 'text-yellow-600 bg-yellow-500/10 dark:text-yellow-400' }
  if (type.includes('text'))
    return { label: 'Text', className: 'text-slate-600 bg-slate-500/10 dark:text-slate-400' }
  return { label: 'File', className: 'text-gray-600 bg-gray-500/10 dark:text-gray-400' }
}

interface UploadingFile {
  id: string
  name: string
  type: string
  size: number
}

const uploadAttachment =
  (entityType: EntityAttachmentType) => (autoid: string, file: File, projectId?: number | null) => {
    if (entityType === 'order') return orderService.uploadAttachment(autoid, file, projectId)
    return proposalService.uploadAttachment(autoid, file, projectId)
  }

const deleteAttachmentFn =
  (entityType: EntityAttachmentType) =>
  (autoid: string, attachmentId: number, projectId?: number | null) => {
    if (entityType === 'order')
      return orderService.deleteAttachment(autoid, attachmentId, projectId)
    return proposalService.deleteAttachment(autoid, attachmentId, projectId)
  }

export const EntityAttachments = forwardRef<EntityAttachmentsRef, EntityAttachmentsProps>(
  function EntityAttachments(
    {
      entityType,
      entityId,
      projectId,
      attachments = [],
      mode = 'immediate',
      isLoading = false,
      onPendingFilesChange
    },
    ref
  ) {
    const queryClient = useQueryClient()
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
    const [recentlyUploaded, setRecentlyUploaded] = useState<EntityAttachment[]>([])
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

    const existingIds = new Set(attachments.map((a) => a.id))
    const optimisticAttachments = recentlyUploaded.filter((a) => !existingIds.has(a.id))
    const allAttachments = [...attachments, ...optimisticAttachments]

    const listQueryKey =
      entityType === 'order' ? ORDER_QUERY_KEYS.lists() : PROPOSAL_QUERY_KEYS.lists()
    const attachmentsQueryKey =
      entityType === 'order' && entityId
        ? ORDER_QUERY_KEYS.attachments(entityId)
        : entityType === 'proposal' && entityId
          ? PROPOSAL_QUERY_KEYS.attachments(entityId)
          : null

    const uploadMutation = useMutation({
      mutationFn: async ({
        file,
        tempId,
        autoid,
        type
      }: {
        file: File
        tempId: string
        autoid: string
        type: EntityAttachmentType
      }) => {
        const result = await uploadAttachment(type)(autoid, file, projectId)
        return { result, tempId }
      },
      onMutate: ({ file, tempId }) => {
        setUploadingFiles((prev) => [
          ...prev,
          { id: tempId, name: file.name, type: file.type, size: file.size }
        ])
      },
      onSuccess: ({ result, tempId }) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
        setRecentlyUploaded((prev) => [...prev, result])
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        if (attachmentsQueryKey) {
          queryClient.invalidateQueries({ queryKey: attachmentsQueryKey })
        }
      },
      onError: (_, { tempId }) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
      },
      meta: {
        successMessage: 'Attachment uploaded successfully'
      }
    })

    const deleteMutation = useMutation({
      mutationFn: async ({
        attachmentId,
        autoid,
        type
      }: {
        attachmentId: number
        autoid: string
        type: EntityAttachmentType
      }) => {
        await deleteAttachmentFn(type)(autoid, attachmentId, projectId)
        return attachmentId
      },
      onMutate: ({ attachmentId }) => {
        setDeletingIds((prev) => new Set(prev).add(attachmentId))
      },
      onSettled: (_, __, { attachmentId }) => {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(attachmentId)
          return next
        })
      },
      onSuccess: (_, { autoid }) => {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        if (entityType === 'order') {
          queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.attachments(autoid) })
        } else {
          queryClient.invalidateQueries({ queryKey: PROPOSAL_QUERY_KEYS.attachments(autoid) })
        }
      },
      meta: {
        successMessage: 'Attachment deleted successfully'
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
        if (mode === 'immediate' && entityId) {
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
        if (mode === 'immediate' && entityId && filesToUploadRef.current.length > 0) {
          const files = filesToUploadRef.current
          filesToUploadRef.current = []
          for (const { file, tempId } of files) {
            uploadMutation.mutate({ file, tempId, autoid: entityId, type: entityType })
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
      uploadPendingFiles: async (autoid: string, type: EntityAttachmentType) => {
        const filesToUpload = pendingFiles.filter(
          (f): f is FileWithPreview & { file: File } => f.file instanceof File
        )
        const upload = uploadAttachment(type)
        for (const fileWithPreview of filesToUpload) {
          await upload(autoid, fileWithPreview.file, projectId)
        }
        if (filesToUpload.length > 0) {
          queryClient.invalidateQueries({ queryKey: listQueryKey })
          if (type === 'order') {
            queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.attachments(autoid) })
          } else {
            queryClient.invalidateQueries({ queryKey: PROPOSAL_QUERY_KEYS.attachments(autoid) })
          }
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
      <div>
        {/* Drop zone */}
        <div
          className={cn(
            'flex items-center justify-center gap-2 border-b px-5 py-3 transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input {...getInputProps()} className='sr-only' />
          <UploadIcon className='size-3.5 text-text-tertiary' />
          <span className='text-[13px] text-text-secondary'>
            Drop files here or{' '}
            <button
              type='button'
              onClick={openFileDialog}
              className='font-medium text-primary hover:underline'
            >
              browse
            </button>
          </span>
          <span className='text-[11px] text-text-quaternary'>Max 10MB</span>
        </div>

        {errors.length > 0 && (
          <div className='flex items-start gap-2 border-b border-destructive/20 bg-destructive/5 px-5 py-2 text-[12px] text-destructive'>
            <CircleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
            <div>
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              <button
                type='button'
                onClick={clearErrors}
                className='mt-0.5 text-destructive/80 underline hover:text-destructive'
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* File list */}
        <div>
          {/* Loading skeleton */}
          {isLoading && (
            <div>
              {[1, 2].map((i) => (
                <div key={i} className='flex items-center gap-3 border-b border-border-light px-5 py-2.5'>
                  <Skeleton className='size-8 shrink-0 rounded-[6px]' />
                  <div className='min-w-0 flex-1'>
                    <Skeleton className='mb-1 h-3.5 w-40' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Uploading files */}
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className='flex items-center gap-3 border-b border-border-light px-5 py-2.5'
            >
              <div className='flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-bg-secondary text-text-tertiary'>
                {getFileIcon(file.type)}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-[13px] font-medium text-text-secondary'>{file.name}</span>
                  <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-bg-secondary px-1.5 py-px text-[10px] font-medium text-text-tertiary'>
                    <Loader2 className='size-2.5 animate-spin' />
                    Uploading
                  </span>
                </div>
                <div className='text-[11px] text-text-quaternary'>{formatBytes(file.size)}</div>
              </div>
            </div>
          ))}

          {/* Pending files (deferred mode) */}
          {showPendingFiles &&
            pendingFiles.map((fileItem) => {
              const file = fileItem.file
              const fileName = file instanceof File ? file.name : file.name
              const fileType = file instanceof File ? file.type : file.type
              const fileSize = file instanceof File ? file.size : file.size
              const typeInfo = getFileTypeInfo(fileType)

              return (
                <div
                  key={fileItem.id}
                  className='group/file flex items-center gap-3 border-b border-border-light px-5 py-2.5 transition-colors hover:bg-bg-hover'
                >
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-bg-secondary text-text-tertiary'>
                    {getFileIcon(fileType)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-[13px] font-medium text-foreground'>{fileName}</span>
                      <span className={cn(
                        'shrink-0 rounded px-1.5 py-px text-[10px] font-semibold',
                        typeInfo.className
                      )}>
                        {typeInfo.label}
                      </span>
                      <span className='shrink-0 rounded border border-primary/30 bg-primary/5 px-1.5 py-px text-[10px] font-semibold text-primary'>
                        New
                      </span>
                    </div>
                    <div className='text-[11px] text-text-quaternary'>{formatBytes(fileSize)}</div>
                  </div>
                  <button
                    type='button'
                    onClick={() => removeFile(fileItem.id)}
                    className='hidden size-6 shrink-0 items-center justify-center rounded-[4px] text-text-quaternary transition-colors hover:bg-bg-active hover:text-destructive group-hover/file:inline-flex'
                  >
                    <Trash2Icon className='size-3' />
                  </button>
                </div>
              )
            })}

          {/* Existing attachments */}
          {!isLoading &&
            allAttachments.map((attachment) => {
              const isDeleting = deletingIds.has(attachment.id)
              if (!entityId) return null
              const typeInfo = getFileTypeInfo(attachment.file_type)

              return (
                <div
                  key={attachment.id}
                  className={cn(
                    'group/file flex items-center gap-3 border-b border-border-light px-5 py-2.5 transition-colors hover:bg-bg-hover',
                    isDeleting && 'opacity-40 pointer-events-none',
                  )}
                >
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-bg-secondary text-text-tertiary'>
                    {getFileIcon(attachment.file_type)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-[13px] font-medium text-foreground' title={attachment.file_name}>
                        {attachment.file_name}
                      </span>
                      <span className={cn(
                        'shrink-0 rounded px-1.5 py-px text-[10px] font-semibold',
                        typeInfo.className
                      )}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className='text-[11px] text-text-quaternary'>{formatBytes(attachment.file_size)}</div>
                  </div>

                  <div className='hidden shrink-0 items-center gap-0.5 group-hover/file:flex'>
                    <a
                      href={attachment.download_url}
                      download={attachment.file_name}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex size-6 items-center justify-center rounded-[4px] text-text-quaternary transition-colors hover:bg-bg-active hover:text-foreground'
                    >
                      <DownloadIcon className='size-3' />
                    </a>
                    <button
                      type='button'
                      onClick={() =>
                        deleteMutation.mutate({
                          attachmentId: attachment.id,
                          autoid: entityId,
                          type: entityType
                        })
                      }
                      disabled={isDeleting}
                      className='inline-flex size-6 items-center justify-center rounded-[4px] text-text-quaternary transition-colors hover:bg-bg-active hover:text-destructive'
                    >
                      {isDeleting ? (
                        <Loader2 className='size-3 animate-spin' />
                      ) : (
                        <Trash2Icon className='size-3' />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

          {/* Empty state */}
          {!isLoading && allAttachments.length === 0 && uploadingFiles.length === 0 && !showPendingFiles && (
            <div className='flex flex-col items-center justify-center py-10 text-center'>
              <Paperclip className='mb-2 size-5 text-text-quaternary' />
              <p className='text-[13px] text-text-tertiary'>No attachments yet</p>
            </div>
          )}
        </div>
      </div>
    )
  }
)

