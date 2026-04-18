import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Calendar, Clock, Trash2, MessageSquare, DollarSign, Activity, PhoneIncoming, PhoneOutgoing, Send } from 'lucide-react'
import { contactService, activityService, callLogService, scheduleService, commentService, pledgeService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ContactDetailSkeleton } from '@/components/ui/loading-skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'

function ContactDetail() {
  const { contactId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [contact, setContact] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [pledges, setPledges] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showPledgeDialog, setShowPledgeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [callForm, setCallForm] = useState({ duration: '', direction: 'inbound', status: 'completed', notes: '' })
  const [scheduleForm, setScheduleForm] = useState({ title: '', eventType: 'meeting', startTime: '', description: '' })
  const [pledgeForm, setPledgeForm] = useState({ amount: '', type: 'donation', status: 'pending', expectedDate: '', notes: '' })

  useEffect(() => {
    fetchContactData()
  }, [contactId])

  const fetchContactData = async () => {
    try {
      if (!contactId) return
      
      const [contactRes, activitiesRes, callLogsRes, schedulesRes, commentsRes, pledgesRes] = await Promise.all([
        contactService.getOne(contactId),
        activityService.getByContact(contactId),
        callLogService.getByContact(contactId),
        scheduleService.getByContact(contactId),
        commentService.getByContact(contactId),
        pledgeService.getAll({ contactId })
      ])

      setContact(contactRes.data.data)
      setActivities(activitiesRes.data.data || [])
      setCallLogs(callLogsRes.data.data || [])
      setSchedules(schedulesRes.data.data || [])
      setComments(commentsRes.data.data || [])
      setPledges(pledgesRes.data.data || [])
    } catch (error) {
      console.error('Error fetching contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !contactId) return
    
    try {
      await commentService.create(contactId, newComment)
      setNewComment('')
      const commentsRes = await commentService.getByContact(contactId)
      setComments(commentsRes.data.data || [])
      toast({ title: 'Comment added', variant: 'success' })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({ title: 'Failed to add comment', variant: 'destructive' })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.delete(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      setShowDeleteDialog(null)
      toast({ title: 'Comment deleted', variant: 'success' })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({ title: 'Failed to delete comment', variant: 'destructive' })
    }
  }

  const handleLogCall = async (e: any) => {
    e.preventDefault()
    if (!contactId) return
    
    try {
      await callLogService.create(contactId, {
        duration: parseInt(callForm.duration) || 0,
        direction: callForm.direction,
        status: callForm.status,
        notes: callForm.notes
      })
      
      setCallForm({ duration: '', direction: 'inbound', status: 'completed', notes: '' })
      setShowCallDialog(false)
      
      const logsRes = await callLogService.getByContact(contactId)
      setCallLogs(logsRes.data.data || [])
      toast({ title: 'Call logged successfully', variant: 'success' })
    } catch (error: any) {
      console.error('Error logging call:', error.response?.data || error.message)
      toast({ title: 'Error logging call', description: error.response?.data?.error || error.message, variant: 'destructive' })
    }
  }

  const handleCreateSchedule = async (e: any) => {
    e.preventDefault()
    if (!contactId || !scheduleForm.startTime) return
    
    try {
      await scheduleService.create(contactId, {
        title: scheduleForm.title,
        eventType: scheduleForm.eventType,
        startTime: scheduleForm.startTime,
        description: scheduleForm.description,
        status: 'scheduled'
      })
      
      setScheduleForm({ title: '', eventType: 'meeting', startTime: '', description: '' })
      setShowScheduleDialog(false)
      
      const schedulesRes = await scheduleService.getByContact(contactId)
      setSchedules(schedulesRes.data.data || [])
      toast({ title: 'Event scheduled', variant: 'success' })
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast({ title: 'Failed to schedule event', variant: 'destructive' })
    }
  }

  const handleCreatePledge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactId) return

    const parsedAmount = Number(pledgeForm.amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Please enter a valid pledge amount', variant: 'destructive' })
      return
    }

    try {
      await pledgeService.create({
        contactId,
        amount: parsedAmount,
        type: pledgeForm.type,
        status: pledgeForm.status,
        expectedDate: pledgeForm.expectedDate || undefined,
        notes: pledgeForm.notes,
      })

      setPledgeForm({ amount: '', type: 'donation', status: 'pending', expectedDate: '', notes: '' })
      setShowPledgeDialog(false)

      const pledgesRes = await pledgeService.getAll({ contactId })
      setPledges(pledgesRes.data.data || [])
      toast({ title: 'Pledge created', variant: 'success' })
    } catch (error: any) {
      console.error('Error creating pledge:', error)
      toast({ title: 'Error creating pledge', description: error.response?.data?.error || error.message, variant: 'destructive' })
    }
  }

  const getInitials = (first: string, last: string) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()

  if (loading) return <ContactDetailSkeleton />
  if (!contact) return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState icon={Activity} title="Contact not found" description="The contact you're looking for doesn't exist or was removed." />
    </div>
  )

  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Contacts
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-xl font-bold text-foreground">
                {contact.first_name} {contact.last_name}
              </h1>
              <Badge variant={contact.lead_status === 'customer' ? 'success' : contact.lead_status === 'prospect' ? 'info' : 'secondary'} className="mt-1 capitalize">
                {contact.lead_status || 'lead'}
              </Badge>
            </div>
            <Avatar className="h-12 w-12 border-2 border-emerald-100">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 font-semibold text-lg">
                {getInitials(contact.first_name, contact.last_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contact.email && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground truncate">{contact.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {contact.phone && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{contact.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabs */}
            <Card>
              <Tabs defaultValue="info">
                <div className="px-4 pt-2">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0">
                    {[
                      { value: 'info', label: 'Info' },
                      { value: 'comments', label: 'Comments', count: comments.length },
                      { value: 'calls', label: 'Calls', count: callLogs.length },
                      { value: 'schedules', label: 'Schedules', count: schedules.length },
                      { value: 'pledges', label: 'Pledges', count: pledges.length },
                      { value: 'activity', label: 'Activity', count: activities.length },
                    ].map(tab => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-4 pb-3"
                      >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{tab.count}</span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="info" className="mt-0 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Labels</p>
                      <div className="flex flex-wrap gap-2">
                        {contact.labels && contact.labels.length > 0 ? (
                          contact.labels.map((label: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{label}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No labels</span>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
                      <p className="text-sm text-foreground">{new Date(contact.created_at).toLocaleDateString()}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="mt-0 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
                        placeholder="Add a comment..."
                        className="flex-1"
                      />
                      <Button onClick={handleAddComment} size="sm" className="gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Add
                      </Button>
                    </div>
                    {comments.length === 0 ? (
                      <EmptyState icon={MessageSquare} title="No comments yet" description="Be the first to comment!" />
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="bg-muted/50 rounded-lg p-4 group">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-foreground">{comment.author_name || 'Anonymous'}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-foreground/80 mt-1.5">{comment.content}</p>
                              </div>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => setShowDeleteDialog(comment.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="calls" className="mt-0 space-y-4">
                    <Button variant="outline" size="sm" onClick={() => setShowCallDialog(true)} className="w-full gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Log New Call
                    </Button>
                    {callLogs.length === 0 ? (
                      <EmptyState icon={Phone} title="No calls logged" description="Log your first call with this contact" />
                    ) : (
                      <div className="space-y-3">
                        {callLogs.map((call: any) => (
                          <div key={call.id} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {call.direction === 'inbound' ? (
                                <PhoneIncoming className="w-4 h-4 text-blue-600" />
                              ) : (
                                <PhoneOutgoing className="w-4 h-4 text-purple-600" />
                              )}
                              <span className="font-medium text-sm">{call.duration || 0} min</span>
                              <Badge variant="outline" className="capitalize text-xs">{call.direction}</Badge>
                              <Badge variant={call.status === 'completed' ? 'success' : call.status === 'missed' ? 'destructive' : 'warning'} className="capitalize text-xs">
                                {call.status}
                              </Badge>
                            </div>
                            {call.notes && <p className="text-sm text-muted-foreground mt-2">{call.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-2">{new Date(call.call_date).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="schedules" className="mt-0 space-y-4">
                    <Button variant="outline" size="sm" onClick={() => setShowScheduleDialog(true)} className="w-full gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Schedule Event
                    </Button>
                    {schedules.length === 0 ? (
                      <EmptyState icon={Calendar} title="No scheduled events" description="Schedule a meeting or follow-up" />
                    ) : (
                      <div className="space-y-3">
                        {schedules.map((schedule: any) => (
                          <div key={schedule.id} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Calendar className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-foreground">{schedule.title}</p>
                                {schedule.description && <p className="text-sm text-muted-foreground mt-1">{schedule.description}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{new Date(schedule.start_time).toLocaleString()}</span>
                                  <Badge variant={schedule.status === 'scheduled' ? 'info' : schedule.status === 'completed' ? 'success' : 'secondary'} className="capitalize text-xs">
                                    {schedule.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pledges" className="mt-0 space-y-4">
                    <Button variant="outline" size="sm" onClick={() => setShowPledgeDialog(true)} className="w-full gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Add Pledge / Donation
                    </Button>
                    {pledges.length === 0 ? (
                      <EmptyState icon={DollarSign} title="No pledges recorded" description="Record this contact's first pledge or donation" />
                    ) : (
                      <div className="space-y-3">
                        {pledges.map((pledge: any) => (
                          <div key={pledge.id} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">${Number(pledge.amount || 0).toLocaleString()}</span>
                              <Badge variant="outline" className="capitalize text-xs">{pledge.type || 'donation'}</Badge>
                              <Badge variant={pledge.status === 'received' ? 'success' : pledge.status === 'pending' ? 'warning' : 'destructive'} className="capitalize text-xs">
                                {pledge.status || 'pending'}
                              </Badge>
                            </div>
                            {pledge.notes && <p className="text-sm text-muted-foreground mt-2">{pledge.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-2">{new Date(pledge.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0 space-y-4">
                    {activities.length === 0 ? (
                      <EmptyState icon={Activity} title="No activities logged" description="Activities will appear here as they happen" />
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                        <div className="space-y-4">
                          {activities.map(activity => (
                            <div key={activity.id} className="flex gap-4 relative">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border-2 border-background flex items-center justify-center flex-shrink-0 z-10">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium text-sm text-foreground">{activity.title}</p>
                                {activity.description && <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="secondary" className="text-xs">{activity.type}</Badge>
                                  <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={contact.lead_status || 'lead'}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                  <option value="past_customer">Past Customer</option>
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Unassigned</option>
                  <option>Team Member 1</option>
                  <option>Team Member 2</option>
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-500/10">
                  <Mail className="w-4 h-4" /> Send Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCallDialog(true)} className="w-full justify-start gap-2 text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-500/10">
                  <Phone className="w-4 h-4" /> Log Call
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowScheduleDialog(true)} className="w-full justify-start gap-2 text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-500/10">
                  <Calendar className="w-4 h-4" /> Schedule
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPledgeDialog(true)} className="w-full justify-start gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-500/10">
                  <DollarSign className="w-4 h-4" /> Add Pledge
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Log Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogCall} className="space-y-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={callForm.duration} onChange={(e) => setCallForm({...callForm, duration: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Direction</Label>
                <select value={callForm.direction} onChange={(e) => setCallForm({...callForm, direction: e.target.value})} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={callForm.status} onChange={(e) => setCallForm({...callForm, status: e.target.value})} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="voicemail">Voicemail</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={callForm.notes} onChange={(e) => setCallForm({...callForm, notes: e.target.value})} placeholder="Call notes..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCallDialog(false)}>Cancel</Button>
              <Button type="submit">Log Call</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={scheduleForm.title} onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})} placeholder="Meeting title..." required />
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <select value={scheduleForm.eventType} onChange={(e) => setScheduleForm({...scheduleForm, eventType: e.target.value})} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="task">Task</option>
                <option value="demo">Demo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={scheduleForm.description} onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})} placeholder="Event details..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pledge Dialog */}
      <Dialog open={showPledgeDialog} onOpenChange={setShowPledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pledge / Donation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePledge} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" min="0" value={pledgeForm.amount} onChange={(e) => setPledgeForm({...pledgeForm, amount: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select value={pledgeForm.type} onChange={(e) => setPledgeForm({...pledgeForm, type: e.target.value})} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                  <option value="donation">Donation</option>
                  <option value="pledge">Pledge</option>
                  <option value="zakat">Zakat</option>
                  <option value="sadaqah">Sadaqah</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={pledgeForm.status} onChange={(e) => setPledgeForm({...pledgeForm, status: e.target.value})} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm">
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected Date</Label>
              <Input type="date" value={pledgeForm.expectedDate} onChange={(e) => setPledgeForm({...pledgeForm, expectedDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={pledgeForm.notes} onChange={(e) => setPledgeForm({...pledgeForm, notes: e.target.value})} placeholder="Optional note" rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPledgeDialog(false)}>Cancel</Button>
              <Button type="submit">Save Pledge</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this comment? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteDialog && handleDeleteComment(showDeleteDialog)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ContactDetail
