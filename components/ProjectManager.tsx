"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderOpen, Save, Trash2, FilePlus, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectManagerProps {
    className?: string
}

export function ProjectManager({ className }: ProjectManagerProps) {
    const {
        currentProjectId,
        projectName,
        saveCurrentProject,
        loadProjectsList,
        savedProjects,
        loadProject,
        deleteProject,
        createNewProject
    } = useAppStore()

    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [saveName, setSaveName] = useState("")
    const [isSaveOpen, setIsSaveOpen] = useState(false)
    const [isListOpen, setIsListOpen] = useState(false)

    // Load projects list on mount
    useEffect(() => {
        loadProjectsList().then(() => setIsDataLoaded(true))
    }, [loadProjectsList])

    const handleSave = async () => {
        if (!saveName.trim()) return
        await saveCurrentProject(saveName)
        setIsSaveOpen(false)
    }

    const handleLoad = async (id: string) => {
        await loadProject(id)
        setIsListOpen(false)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
            await deleteProject(id)
        }
    }

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Current Project Indicator */}
            {projectName && (
                <div className="text-sm font-medium mr-2 px-3 py-1 bg-secondary rounded-md border">
                    {projectName}
                </div>
            )}

            {/* New Project Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={createNewProject}>
                        <FilePlus className="h-4 w-4" />
                        <span className="sr-only">New Project</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Create New Project</p>
                </TooltipContent>
            </Tooltip>

            {/* Save Button & Dialog */}
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Project</DialogTitle>
                        <DialogDescription>
                            Save your current workspace to your browser&apos;s local storage.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                            <p>
                                <strong>Privacy Note:</strong> Your data is stored locally in your browser. nothing is ever sent to an external server. Clearing browser data will remove your saved projects.
                            </p>
                        </div>
                        <Input
                            placeholder="Project Name (e.g. My API Analysis)"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Open / List Projects Dialog */}
            <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Open</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Open Project</DialogTitle>
                        <DialogDescription>
                            Load a previously saved project from local storage.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 max-h-[60vh] overflow-y-auto">
                        {!isDataLoaded ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : savedProjects.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No saved projects found.</p>
                                <p className="text-xs mt-2">Save your work to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {savedProjects.map((project: any) => (
                                    <div
                                        key={project.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors ${currentProjectId === project.id ? 'bg-accent border-primary' : ''}`}
                                        onClick={() => handleLoad(project.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{project.name}</span>
                                            <span className="text-xs text-muted-foreground">Last updated: {formatDate(project.updatedAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentProjectId === project.id && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Active</span>}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => handleDelete(e, project.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete Project</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete Project</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
