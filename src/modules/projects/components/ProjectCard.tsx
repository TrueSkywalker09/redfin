import { Target, Pencil, Trash2, Play, Pause, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onUpdate: () => void
}

const priorityConfig = {
  high: { label: 'Alta', variant: 'danger' as const },
  medium: { label: 'Média', variant: 'warning' as const },
  low: { label: 'Baixa', variant: 'default' as const },
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'success' as const },
  paused: { label: 'Pausado', variant: 'warning' as const },
  completed: { label: 'Concluído', variant: 'info' as const },
}

export function ProjectCard({ project, onEdit, onUpdate }: ProjectCardProps) {
  const priority = priorityConfig[project.priority]
  const status = statusConfig[project.status]

  async function handleStatusChange(
    newStatus: 'active' | 'paused' | 'completed'
  ) {
    await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id)
    onUpdate()
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${project.name}"?`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    onUpdate()
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
              project.status === 'completed'
                ? 'bg-green-100 text-success'
                : 'bg-accent-light text-accent'
            }`}
          >
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary truncate">
                {project.name}
              </h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </div>
            {project.description && (
              <p className="mt-0.5 text-xs text-text-muted truncate">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <ProgressBar
          value={Number(project.current_amount)}
          max={Number(project.target_amount)}
          size="md"
        />
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-text-primary font-mono font-medium">
          {formatCurrency(project.current_amount)}
        </span>
        <span className="text-text-muted">
          de {formatCurrency(project.target_amount)}
        </span>
      </div>

      {project.target_date && (
        <p className="mb-3 text-xs text-text-muted">
          Data-alvo: {new Date(project.target_date).toLocaleDateString('pt-BR')}
        </p>
      )}

      <div className="flex items-center gap-1">
        {project.status === 'active' && (
          <>
            <button
              onClick={() => handleStatusChange('paused')}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-warning hover:bg-amber-50 transition-colors"
              aria-label="Pausar projeto"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-success hover:bg-green-50 transition-colors"
              aria-label="Concluir projeto"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {project.status === 'paused' && (
          <button
            onClick={() => handleStatusChange('active')}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors"
            aria-label="Retomar projeto"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onEdit(project)}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-accent-light transition-colors"
          aria-label="Editar projeto"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-danger hover:bg-red-50 transition-colors"
          aria-label="Excluir projeto"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
