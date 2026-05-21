import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Project } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProjectForm } from './ProjectForm'
import { ProjectCard } from './components/ProjectCard'
import { ContributionForm } from './components/ContributionForm'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function ProjectsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'progress'>('priority')

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('created_at', { ascending: false })

    if (data) setProjects(data)
    setLoading(false)
  }, [profile?.household_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('projects', profile?.household_id ?? null, fetchData)

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      )
    }
    const progressA =
      a.target_amount > 0
        ? Number(a.current_amount) / Number(a.target_amount)
        : 0
    const progressB =
      b.target_amount > 0
        ? Number(b.current_amount) / Number(b.target_amount)
        : 0
    return progressB - progressA
  })

  const activeProjects = sortedProjects.filter(
    (p) => p.status !== 'completed'
  )
  const completedProjects = sortedProjects.filter(
    (p) => p.status === 'completed'
  )

  return (
    <>
      <PageHeader
        title="Projetos e Desejos"
        description="Acompanhe seus objetivos financeiros"
        action={
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSortBy(sortBy === 'priority' ? 'progress' : 'priority')
              }
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
              aria-label={
                sortBy === 'priority'
                  ? 'Ordenar por progresso'
                  : 'Ordenar por prioridade'
              }
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">
                {sortBy === 'priority'
                  ? 'Ordenar por progresso'
                  : 'Ordenar por prioridade'}
              </span>
            </button>
            <button
              onClick={() => {
                setEditingProject(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo projeto</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-border/60"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ainda"
          description="Crie objetivos financeiros como viagens, reserva de emergência, etc."
          action={
            <button
              onClick={() => {
                setEditingProject(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar projeto
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <div key={project.id}>
                <ProjectCard
                  project={project}
                  onEdit={(p) => {
                    setEditingProject(p)
                    setShowForm(true)
                  }}
                  onUpdate={fetchData}
                />
                <button
                  onClick={() =>
                    setSelectedProject(
                      selectedProject?.id === project.id
                        ? null
                        : project
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
                  aria-label="Adicionar aporte"
                >
                  + Adicionar aporte
                </button>
                {selectedProject?.id === project.id && (
                  <div className="mt-2 rounded-xl border border-border bg-surface p-4">
                    <ContributionForm
                      project={project}
                      onSuccess={fetchData}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {completedProjects.length > 0 && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Concluídos
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={(p) => {
                      setEditingProject(p)
                      setShowForm(true)
                    }}
                    onUpdate={fetchData}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingProject(null)
        }}
        title={editingProject ? 'Editar projeto' : 'Novo projeto'}
      >
        <ProjectForm
          editingProject={editingProject}
          onSuccess={() => {
            setShowForm(false)
            setEditingProject(null)
            fetchData()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingProject(null)
          }}
        />
      </Modal>
    </>
  )
}
