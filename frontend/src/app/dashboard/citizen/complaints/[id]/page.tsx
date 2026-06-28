'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useComplaintRoom, useSocketEvent } from '@/lib/socket';
import { complaintsAPI, commentsAPI, votesAPI } from '@/lib/api';
import { statusColors, categoryIcons, categoryLabels, getStatusLabel, formatDateTime, formatRelativeTime, severityColors, priorityColors } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Clock, User, MessageCircle, ThumbsUp, ThumbsDown, Flag,
  Send, Trash2, Share2, CheckCircle, XCircle, AlertTriangle, Sparkles, Tag,
  DollarSign, Building2, Loader2, ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const complaintId = params.id as string;

  // Join complaint room for real-time updates
  useComplaintRoom(complaintId);

  // Real-time event handlers
  const handleRealtimeUpdate = useCallback(() => {
    loadComplaint();
  }, []);

  useSocketEvent('complaint:updated', handleRealtimeUpdate);
  useSocketEvent('comment:added', handleRealtimeUpdate);
  useSocketEvent('vote:added', handleRealtimeUpdate);

  useEffect(() => {
    if (complaintId) loadComplaint();
  }, [complaintId]);

  const loadComplaint = async () => {
    setIsLoading(true);
    try {
      const [complaintRes, commentsRes, votesRes] = await Promise.allSettled([
        complaintsAPI.getById(complaintId),
        commentsAPI.getByComplaint(complaintId),
        votesAPI.getVotes(complaintId),
      ]);

      if (complaintRes.status === 'fulfilled') setComplaint(complaintRes.value.data);
      if (commentsRes.status === 'fulfilled') setComments(commentsRes.value.data.comments || commentsRes.value.data || []);
      if (votesRes.status === 'fulfilled') {
        const votes = votesRes.value.data.votes || votesRes.value.data || [];
        const myVote = votes.find((v: any) => v.userId === user?.id);
        if (myVote) setUserVote(myVote.type);
      }
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load complaint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (type: 'VERIFY' | 'REJECT' | 'FLAG') => {
    setVoteLoading(true);
    try {
      await votesAPI.vote(complaintId, type);
      setUserVote(type);
      await loadComplaint();
      toast.success(`${type === 'VERIFY' ? 'Verified' : type === 'REJECT' ? 'Rejected' : 'Flagged'} successfully!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to vote');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await commentsAPI.create(complaintId, newComment.trim());
      setNewComment('');
      await loadComplaint();
      toast.success('Comment added!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: complaint?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-xl animate-shimmer" />
        <div className="glass rounded-2xl h-96 animate-shimmer" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="glass rounded-2xl p-16 text-center">
        <XCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Complaint not found</h3>
        <Link href="/dashboard/citizen/complaints" className="text-violet-500 hover:text-violet-400 text-sm">
          ← Back to complaints
        </Link>
      </div>
    );
  }

  const images = complaint.images || [];
  const statusHistory = complaint.statusHistory || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{complaint.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
              {getStatusLabel(complaint.status)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatRelativeTime(complaint.createdAt)}
            </span>
          </div>
        </div>
        <button onClick={handleShare} className="p-2.5 rounded-xl glass hover:bg-accent/50 transition-all">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="relative">
            <img
              src={selectedImage || images[0].url}
              alt={complaint.title}
              className="w-full h-72 sm:h-96 object-cover cursor-pointer"
              onClick={() => setShowAllImages(!showAllImages)}
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full glass text-xs font-medium">
                <ImageIcon className="w-3 h-3 inline mr-1" /> {images.length} photos
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setSelectedImage(img.url)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${(selectedImage || images[0].url) === img.url ? 'border-violet-500' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{complaint.description}</p>

            {complaint.aiTags && complaint.aiTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {complaint.aiTags.map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Community Verification */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Community Verification</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-green-500/10">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{complaint.verificationCount || 0}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-500/10">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{complaint.rejectionCount || 0}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-orange-500/10">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{complaint.flagCount || 0}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </div>

            {complaint.reporterId !== user?.id && (
              <div className="flex gap-2">
                <button onClick={() => handleVote('VERIFY')} disabled={voteLoading || userVote === 'VERIFY'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${userVote === 'VERIFY'
                    ? 'bg-green-600 text-white' : 'glass hover:bg-green-500/20 hover:text-green-600'}`}>
                  <ThumbsUp className="w-4 h-4" /> Verify
                </button>
                <button onClick={() => handleVote('REJECT')} disabled={voteLoading || userVote === 'REJECT'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${userVote === 'REJECT'
                    ? 'bg-red-600 text-white' : 'glass hover:bg-red-500/20 hover:text-red-600'}`}>
                  <ThumbsDown className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => handleVote('FLAG')} disabled={voteLoading || userVote === 'FLAG'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${userVote === 'FLAG'
                    ? 'bg-orange-600 text-white' : 'glass hover:bg-orange-500/20 hover:text-orange-600'}`}>
                  <Flag className="w-4 h-4" /> Flag
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Comments ({comments.length})
            </h3>

            {/* Add Comment */}
            <div className="flex gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                />
                <button onClick={handleComment} disabled={!newComment.trim() || commentLoading}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:opacity-90 disabled:opacity-50 transition-all">
                  {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Comment List */}
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.user?.name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{comment.content}</p>
                    </div>
                    {comment.userId === user?.id && (
                      <button onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Details</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">{categoryIcons[complaint.category]} {categoryLabels[complaint.category]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Severity</span>
                <span className={`text-sm font-medium ${severityColors[complaint.severity]}`}>{complaint.severity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[complaint.priority]}`}>{complaint.priority}</span>
              </div>
              {complaint.ward && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ward</span>
                  <span className="text-sm font-medium">{complaint.ward}</span>
                </div>
              )}
              {complaint.department && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {complaint.department.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Location</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-sm">{complaint.address}</p>
            </div>
            {complaint.landmark && (
              <p className="text-xs text-muted-foreground mt-2 ml-6">Near {complaint.landmark}</p>
            )}
          </div>

          {/* AI Insights */}
          {(complaint.aiConfidence || complaint.estimatedCost || complaint.estimatedTime) && (
            <div className="glass rounded-2xl p-5 border border-violet-500/20">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" /> AI Insights
              </h3>
              <div className="space-y-2">
                {complaint.aiConfidence > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{Math.round(complaint.aiConfidence * 100)}%</span>
                  </div>
                )}
                {complaint.estimatedCost > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Est. Cost</span>
                    <span className="font-medium">₹{complaint.estimatedCost.toLocaleString()}</span>
                  </div>
                )}
                {complaint.estimatedTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Time</span>
                    <span className="font-medium">{complaint.estimatedTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {statusHistory.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Status Timeline</h3>
              <div className="space-y-0">
                {statusHistory.map((entry: any, i: number) => (
                  <div key={entry.id} className="relative flex gap-3 pb-4">
                    {i < statusHistory.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${i === 0 ? 'bg-violet-600' : 'bg-muted'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${i === 0 ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{getStatusLabel(entry.toStatus)}</p>
                      {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reporter */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Reported By</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {complaint.reporter?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium">{complaint.reporter?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">Level {complaint.reporter?.level || 1} • {complaint.reporter?.points || 0} pts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
