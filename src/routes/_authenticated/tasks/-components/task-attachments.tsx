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
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { TaskAttachment } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatBytes } from '@/helpers/formatters'
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload'
import { cn } from '@/lib/utils'

interface TaskAttachmentsProps {
  taskId?: number
  attachments?: TaskAttachment[]
  mode?: 'immediate' | 'deferred'
  isLoading?: boolean
  onPendingFilesChange?: (hasPending: boolean) => void
}

export interface TaskAttachmentsRef {
  uploadPendingFiles: (taskId?: number) => Promise<void>
  hasPendingFiles: () => boolean
  getPendingFiles: () => File[]
}

function getFileIcon(type: string) {
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

function getFileTypeInfo(type: string): FileTypeInfo {
  if (type.startsWith('image/'))
    return { label: 'Image', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
  if (type.startsWith('video/'))
    return { label: 'Video', className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' }
  if (type.startsWith('audio/'))
    return { label: 'Audio', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' }
  if (type.includes('pdf'))
    return { label: 'PDF', className: 'bg-red-500/10 text-red-600 dark:text-red-400' }
  if (type.includes('word') || type.includes('doc'))
    return { label: 'Word', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (type.includes('excel') || type.includes('sheet'))
    return { label: 'Excel', className: 'bg-green-500/10 text-green-600 dark:text-green-400' }
  if (type.includes('zip') || type.includes('rar'))
    return { label: 'Archive', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  if (type.includes('json'))
    return { label: 'JSON', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' }
  if (type.includes('text'))
    return { label: 'Text', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' }
  return { label: 'File', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' }
}

interface UploadingFile {
  id: string
  name: string
  type: string
  size: number
}

export const TaskAttachments = forwardRef<TaskAttachmentsRef, TaskAttachmentsProps>(
  function TaskAttachments({ taskId, attachments = [], mode = 'immediate', isLoading = false, onPendingFilesChange }, ref) {
    const queryClient = useQueryClient()
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
    const [recentlyUploaded, setRecentlyUploaded] = useState<TaskAttachment[]>([])
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

    const existingIds = new Set(attachments.map((a) => a.id))
    const optimisticAttachments = recentlyUploaded.filter((a) => !existingIds.has(a.id))
    const allAttachments = [...attachments, ...optimisticAttachments]

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
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
        setRecentlyUploaded((prev) => [...prev, result])
        if (taskId) {
          queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
        }
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      },
      onError: (_, { tempId }) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))
      },
      meta: {
        successMessage: 'Attachment uploaded successfully'
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
      maxSize: 20 * 1024 * 1024,
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
    const hasExistingOrUploading = allAttachments.length > 0 || uploadingFiles.length > 0 || isLoading

    return (
      <div className='space-y-3'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
          Attachments
        </p>

        <div
          className={cn(
            'relative rounded-lg border border-dashed p-4 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
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

          <div className='flex flex-col items-center gap-2'>
            <div
              className={cn(
                'bg-muted flex size-10 items-center justify-center rounded-full transition-colors',
                isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
              )}
            >
              <UploadIcon className='text-muted-foreground size-4' />
            </div>

            <div className='space-y-1'>
              <p className='text-sm'>
                Drop files here or{' '}
                <button
                  type='button'
                  onClick={openFileDialog}
                  className='text-primary cursor-pointer underline-offset-4 hover:underline'
                >
                  browse files
                </button>
              </p>
              <p className='text-muted-foreground text-xs'>Maximum file size: 20MB</p>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className='bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm'>
            <CircleAlertIcon className='mt-0.5 size-4 shrink-0' />
            <div className='space-y-1'>
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              <button
                type='button'
                onClick={clearErrors}
                className='text-destructive/80 hover:text-destructive text-xs underline'
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {showPendingFiles && (
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs'>
              {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} ready to upload
            </p>
            <div className='rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow className='text-xs'>
                    <TableHead className='h-8 ps-3'>Name</TableHead>
                    <TableHead className='h-8 w-[100px]'>Type</TableHead>
                    <TableHead className='h-8 w-[100px]'>Size</TableHead>
                    <TableHead className='h-8 w-[80px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingFiles.map((fileItem) => {
                    const file = fileItem.file
                    const fileName = file instanceof File ? file.name : file.name
                    const fileType = file instanceof File ? file.type : file.type
                    const fileSize = file instanceof File ? file.size : file.size

                    return (
                      <TableRow key={fileItem.id}>
                        <TableCell className='py-1.5 ps-3'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className='flex items-center gap-2 min-w-0'>
                                  <span className='text-muted-foreground/80 shrink-0'>
                                    {getFileIcon(fileType)}
                                  </span>
                                  <span className='truncate text-sm font-medium'>{fileName}</span>
                                  <Badge
                                    variant='outline'
                                    className='text-primary border-primary/30 bg-primary/5 shrink-0 text-xs'
                                  >
                                    New
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{fileName}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className='w-[100px] py-1.5'>
                          {(() => {
                            const typeInfo = getFileTypeInfo(fileType)
                            return (
                              <Badge className={cn('text-xs', typeInfo.className)}>
                                {typeInfo.label}
                              </Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell className='text-muted-foreground w-[100px] py-1.5 text-sm'>
                          {formatBytes(fileSize)}
                        </TableCell>
                        <TableCell className='w-[80px] py-1.5'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type='button'
                                  onClick={() => removeFile(fileItem.id)}
                                  variant='ghost'
                                  size='icon'
                                  className='size-7'
                                >
                                  <Trash2Icon className='size-3.5' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {hasExistingOrUploading && (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow className='text-xs'>
                  <TableHead className='h-8 ps-3'>Name</TableHead>
                  <TableHead className='h-8 w-[100px]'>Type</TableHead>
                  <TableHead className='h-8 w-[100px]'>Size</TableHead>
                  <TableHead className='h-8 w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {['skeleton-row-1', 'skeleton-row-2'].map((skeletonId) => (
                      <TableRow key={skeletonId}>
                        <TableCell className='py-1.5 ps-3'>
                          <div className='flex items-center gap-2'>
                            <Skeleton className='size-4 shrink-0' />
                            <Skeleton className='h-4 w-32' />
                          </div>
                        </TableCell>
                        <TableCell className='w-[100px] py-1.5'>
                          <Skeleton className='h-5 w-14' />
                        </TableCell>
                        <TableCell className='w-[100px] py-1.5'>
                          <Skeleton className='h-4 w-16' />
                        </TableCell>
                        <TableCell className='w-[100px] py-1.5'>
                          <div className='flex items-center gap-1'>
                            <Skeleton className='size-7' />
                            <Skeleton className='size-7' />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {!isLoading && uploadingFiles.map((file) => (
                  <TableRow
                    key={file.id}
                    className='animate-pulse'
                  >
                    <TableCell className='py-1.5 ps-3'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='text-muted-foreground/80 shrink-0'>
                          {getFileIcon(file.type)}
                        </span>
                        <span className='text-muted-foreground truncate text-sm font-medium'>
                          {file.name}
                        </span>
                        <Badge
                          variant='secondary'
                          className='shrink-0 gap-1 text-xs'
                        >
                          <LoaderIcon className='size-3 animate-spin' />
                          Uploading
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className='w-[100px] py-1.5'>
                      <Skeleton className='h-5 w-14' />
                    </TableCell>
                    <TableCell className='w-[100px] py-1.5'>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell className='w-[100px] py-1.5'>
                      <Skeleton className='size-7' />
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && allAttachments.map((attachment) => {
                  const isDeleting = deletingIds.has(attachment.id)

                  return (
                    <TableRow
                      key={attachment.id}
                      className={cn(isDeleting && 'opacity-50')}
                    >
                      <TableCell className='py-1.5 ps-3'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='flex items-center gap-2 min-w-0'>
                                <span className='text-muted-foreground/80 shrink-0'>
                                  {getFileIcon(attachment.file_type)}
                                </span>
                                <span className='truncate text-sm font-medium'>
                                  {attachment.file_name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{attachment.file_name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className='w-[100px] py-1.5'>
                        {(() => {
                          const typeInfo = getFileTypeInfo(attachment.file_type)
                          return (
                            <Badge className={cn('text-xs', typeInfo.className)}>
                              {typeInfo.label}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell className='text-muted-foreground w-[100px] py-1.5 text-sm'>
                        {formatBytes(attachment.file_size)}
                      </TableCell>
                      <TableCell className='w-[100px] py-1.5'>
                        <div className='flex items-center gap-1'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  className='size-7'
                                  disabled={isDeleting}
                                  asChild
                                >
                                  <a
                                    href={attachment.download_url}
                                    download={attachment.file_name}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    <DownloadIcon className='size-3.5' />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type='button'
                                  onClick={() => deleteMutation.mutate(attachment.id)}
                                  variant='ghost'
                                  size='icon'
                                  className='size-7'
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <LoaderIcon className='size-3.5 animate-spin' />
                                  ) : (
                                    <Trash2Icon className='size-3.5' />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isDeleting ? 'Deleting...' : 'Delete'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }
)
