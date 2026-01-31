import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Calendar, Clock, Trash2 } from 'lucide-react'
import { contactService, activityService, callLogService, scheduleService, commentService } from '../services/api'

function ContactDetail() {
  const { contactId } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'emails' | 'comments' | 'calls' | 'schedules' | 'activity'>('info')
  const [showCallForm, setShowCallForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [callForm, setCallForm] = useState({ duration: '', direction: 'inbound', status: 'completed', notes: '' })
  const [scheduleForm, setScheduleForm] = useState({ title: '', eventType: 'meeting', startTime: '', description: '' })

  useEffect(() => {
    fetchContactData()
  }, [contactId])

  const fetchContactData = async () => {
    try {
      if (!contactId) return
      
      const [contactRes, activitiesRes, callLogsRes, schedulesRes, commentsRes] = await Promise.all([
        contactService.getOne(contactId),
        activityService.getByContact(contactId),
        callLogService.getByContact(contactId),
        scheduleService.getByContact(contactId),
        commentService.getByContact(contactId)
      ])

      setContact(contactRes.data.data)
      setActivities(activitiesRes.data.data || [])
      setCallLogs(callLogsRes.data.data || [])
      setSchedules(schedulesRes.data.data || [])
      setComments(commentsRes.data.data || [])
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
      // Refresh comments
      const commentsRes = await commentService.getByContact(contactId)
      setComments(commentsRes.data.data || [])
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return
    
    try {
      await commentService.delete(commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleLogCall = async (e: any) => {
    e.preventDefault()
    if (!contactId) return
    
    try {
      const response = await callLogService.create(contactId, {
        duration: parseInt(callForm.duration) || 0,
        direction: callForm.direction,
        status: callForm.status,
        notes: callForm.notes
      })
      
      console.log('Call logged successfully:', response)
      setCallForm({ duration: '', direction: 'inbound', status: 'completed', notes: '' })
      setShowCallForm(false)
      
      // Refresh call logs
      const logsRes = await callLogService.getByContact(contactId)
      setCallLogs(logsRes.data.data || [])
    } catch (error: any) {
      console.error('Error logging call:', error.response?.data || error.message)
      alert('Error logging call: ' + (error.response?.data?.error || error.message))
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
      setShowScheduleForm(false)
      
      // Refresh schedules
      const schedulesRes = await scheduleService.getByContact(contactId)
      setSchedules(schedulesRes.data.data || [])
    } catch (error) {
      console.error('Error creating schedule:', error)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!contact) return <div className="p-8 text-center">Contact not found</div>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Contacts
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">
              {contact.first_name} {contact.last_name}
            </h1>
            <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              {contact.lead_status || 'lead'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              {contact.email && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{contact.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{contact.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 flex overflow-x-auto">
                {(['info', 'emails', 'comments', 'calls', 'schedules', 'activity'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Labels</p>
                      <div className="flex flex-wrap gap-2">
                        {contact.labels && contact.labels.length > 0 ? (
                          contact.labels.map((label: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">No labels</span>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 font-medium mb-2">Created</p>
                      <p className="text-slate-900">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'emails' && (
                  <div className="space-y-4">
                    <p className="text-slate-600 text-sm">Email history would appear here</p>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment()
                          }
                        }}
                        placeholder="Add a comment..."
                        className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        onClick={handleAddComment}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {comments.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No comments yet. Be the first to comment!</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">{comment.author_name || 'Anonymous'}</span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-slate-700 mt-2">{comment.content}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="ml-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'calls' && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowCallForm(!showCallForm)}
                      className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium text-sm transition"
                    >
                      {showCallForm ? 'Cancel' : '+ Log New Call'}
                    </button>

                    {showCallForm && (
                      <form onSubmit={handleLogCall} className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Duration (minutes)</label>
                          <input
                            type="number"
                            value={callForm.duration}
                            onChange={(e) => setCallForm({...callForm, duration: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Direction</label>
                          <select
                            value={callForm.direction}
                            onChange={(e) => setCallForm({...callForm, direction: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                          >
                            <option value="inbound">Inbound</option>
                            <option value="outbound">Outbound</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Status</label>
                          <select
                            value={callForm.status}
                            onChange={(e) => setCallForm({...callForm, status: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                          >
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                            <option value="voicemail">Voicemail</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Notes</label>
                          <textarea
                            value={callForm.notes}
                            onChange={(e) => setCallForm({...callForm, notes: e.target.value})}
                            placeholder="Call notes..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 resize-none"
                            rows={3}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-medium text-sm"
                        >
                          Log Call
                        </button>
                      </form>
                    )}

                    {callLogs.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No calls logged yet</p>
                    ) : (
                      <div className="space-y-3">
                        {callLogs.map((call: any) => (
                          <div key={call.id} className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium text-slate-900">{call.duration || 0} min</span>
                                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                    {call.direction === 'inbound' ? '📥' : '📤'} {call.direction}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    call.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    call.status === 'missed' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {call.status}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-2">{call.notes}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  {new Date(call.call_date).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'schedules' && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowScheduleForm(!showScheduleForm)}
                      className="w-full px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-medium text-sm transition"
                    >
                      {showScheduleForm ? 'Cancel' : '+ Schedule Event'}
                    </button>

                    {showScheduleForm && (
                      <form onSubmit={handleCreateSchedule} className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Title</label>
                          <input
                            type="text"
                            value={scheduleForm.title}
                            onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                            placeholder="Meeting title..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Event Type</label>
                          <select
                            value={scheduleForm.eventType}
                            onChange={(e) => setScheduleForm({...scheduleForm, eventType: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                          >
                            <option value="meeting">Meeting</option>
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="task">Task</option>
                            <option value="demo">Demo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Date & Time</label>
                          <input
                            type="datetime-local"
                            value={scheduleForm.startTime}
                            onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium">Description</label>
                          <textarea
                            value={scheduleForm.description}
                            onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                            placeholder="Event details..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 resize-none"
                            rows={3}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium text-sm"
                        >
                          Schedule Event
                        </button>
                      </form>
                    )}

                    {schedules.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No scheduled events</p>
                    ) : (
                      <div className="space-y-3">
                        {schedules.map((schedule: any) => (
                          <div key={schedule.id} className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{schedule.title}</p>
                                <p className="text-sm text-slate-600 mt-1">{schedule.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs text-slate-600">
                                    {new Date(schedule.start_time).toLocaleString()}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    schedule.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-200 text-slate-600'
                                  }`}>
                                    {schedule.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No activities logged</p>
                    ) : (
                      <div className="space-y-3">
                        {activities.map(activity => (
                          <div key={activity.id} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{activity.title}</p>
                              <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                  {activity.type}
                                </span>
                                <p className="text-xs text-slate-400">
                                  {new Date(activity.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Status</h3>
              <select
                value={contact.lead_status || 'lead'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-400"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="past_customer">Past Customer</option>
              </select>
            </div>

            {/* Assigned To Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Assigned To</h3>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-400">
                <option>Unassigned</option>
                <option>Team Member 1</option>
                <option>Team Member 2</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button 
                  onClick={() => { setActiveTab('calls'); setShowCallForm(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Log Call
                </button>
                <button 
                  onClick={() => { setActiveTab('schedules'); setShowScheduleForm(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactDetail
