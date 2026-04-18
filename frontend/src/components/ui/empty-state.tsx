import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Users, FolderOpen, FileText, Activity, Calendar,
  Phone, Mail, DollarSign, BarChart3
} from "lucide-react"

const icons: Record<string, React.ElementType> = {
  contacts: Users,
  projects: FolderOpen,
  pledges: DollarSign,
  activities: Activity,
  reports: BarChart3,
  schedules: Calendar,
  calls: Phone,
  emails: Mail,
  default: FileText,
}

interface EmptyStateProps {
  icon?: string | React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon = "default",
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' ? (icons[icon] || icons.default) : icon
  const resolvedActionLabel = actionLabel || action?.label
  const resolvedOnAction = onAction || action?.onClick

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <IconComponent className="w-10 h-10 text-primary/60" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-muted border-2 border-background" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-background" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{description}</p>
      {resolvedActionLabel && resolvedOnAction && (
        <Button onClick={resolvedOnAction} size="sm">
          {resolvedActionLabel}
        </Button>
      )}
    </div>
  )
}
