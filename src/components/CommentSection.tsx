import { AdSenseAd } from "@/components/AdSenseAd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface CommentSectionProps {
  videoId: string;
}

export const CommentSection = ({ videoId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('CommentSection mounted with videoId:', videoId);
    console.log('Current user:', user);
    
    // Always try to load comments, with fallback to localStorage
    const loadCommentsSafely = async () => {
      try {
        await fetchComments();
      } catch (error) {
        console.error('Initial comment load failed, trying localStorage fallback:', error);
        // Fallback to localStorage only
        const localComments = loadCommentsFromStorage(videoId);
        setComments(localComments);
        setLoading(false);
      }
    };
    
    loadCommentsSafely();
  }, [videoId, user]);

  const fetchComments = async () => {
    setLoading(true);
    
    // Always start with localStorage comments (guaranteed to work)
    const localStorageComments = loadCommentsFromStorage(videoId);
    console.log('Loading comments for videoId:', videoId, 'localStorage comments:', localStorageComments);
    
    // Set localStorage comments immediately for fast UI response
    setComments(localStorageComments);
    
    // Try to get additional comments from database (non-blocking)
    try {
      const isUsingStub = (window as any).__SUPABASE_STUB__ === true;
      if (!isUsingStub) {
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('id, content, created_at, user_id')
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });

        if (!commentsError && commentsData && commentsData.length > 0) {
          // Get profile information for each database comment
          const databaseComments = await Promise.all(
            commentsData.map(async (comment) => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('display_name, avatar_url')
                  .eq('user_id', comment.user_id)
                  .maybeSingle();

                return {
                  ...comment,
                  display_name: profile?.display_name || 'Anonymous User',
                  avatar_url: profile?.avatar_url || null,
                };
              } catch (profileError) {
                return {
                  ...comment,
                  display_name: 'Anonymous User',
                  avatar_url: null,
                };
              }
            })
          );

          // Merge with localStorage comments
          const allComments = [...localStorageComments, ...databaseComments];
          const uniqueComments = allComments.filter((comment, index, self) => 
            index === self.findIndex(c => c.id === comment.id)
          );

          uniqueComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setComments(uniqueComments);

          // Cache database comments to localStorage
          if (databaseComments.length > 0 && localStorageComments.length === 0) {
            localStorage.setItem(`comments_${videoId}`, JSON.stringify(databaseComments));
          }
        }
      }
    } catch (dbError) {
      // Database errors are silent - localStorage comments are already loaded
      console.log('Database unavailable, using localStorage only');
    }
    
    setLoading(false);
  };

  // Fallback function to load comments from localStorage
  const loadCommentsFromStorage = (videoId: string): Comment[] => {
    try {
      const storedComments = localStorage.getItem(`comments_${videoId}`);
      if (storedComments) {
        return JSON.parse(storedComments);
      }
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
    }
    return [];
  };

  // Test function to create sample comments
  const createTestComments = () => {
    const testComments: Comment[] = [
      {
        id: '1',
        content: 'This is a test comment to verify the system is working!',
        created_at: new Date().toISOString(),
        user_id: 'test-user',
        display_name: 'Test User',
        avatar_url: null,
      },
      {
        id: '2',
        content: 'Another test comment to show multiple comments work.',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        user_id: 'test-user-2',
        display_name: 'Another User',
        avatar_url: null,
      },
      {
        id: '3',
        content: 'This is a longer comment to test how the system handles longer text content. It should wrap properly and display nicely in the UI.',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        user_id: 'test-user-3',
        display_name: 'Comment Tester',
        avatar_url: null,
      }
    ];
    
    // Save to localStorage for this video
    testComments.forEach(comment => {
      saveCommentToStorage(videoId, comment);
    });
    
    setComments(testComments);
    console.log('Test comments created and saved:', testComments);
    
    toast({
      title: "Test Comments Added!",
      description: "Sample comments have been added to test the system",
    });
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post comments",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      let commentId = Date.now().toString();
      let commentCreatedAt = new Date().toISOString();

      // Try to save to database first to get the real ID (only if Supabase is configured)
      try {
        const isUsingStub = (window as any).__SUPABASE_STUB__ === true;
        if (isUsingStub) {
          console.log('Supabase not configured, using local storage only');
        } else {
          const { data: insertData, error } = await supabase
            .from('comments')
            .insert({
              video_id: videoId,
              user_id: user.id,
              content: newComment.trim(),
            })
            .select('id, created_at')
            .single();

          if (error) {
            console.error('Database error, using fallback ID:', error);
          } else if (insertData) {
            commentId = insertData.id;
            commentCreatedAt = insertData.created_at;
            console.log('Comment saved to database with ID:', commentId);
          }
        }
      } catch (dbError) {
        console.error('Database error, using fallback ID:', dbError);
      }

      // Create comment object with the correct ID (either from database or fallback)
      const newCommentObj: Comment = {
        id: commentId,
        content: newComment.trim(),
        created_at: commentCreatedAt,
        user_id: user.id,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      // Save to localStorage for immediate UI update
      saveCommentToStorage(videoId, newCommentObj);

      // Update the UI immediately with the new comment
      setComments(prevComments => [newCommentObj, ...prevComments]);

      setNewComment("");
      
      toast({
        title: "Comment posted!",
        description: "Your voice has been heard in the shadow realm",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Function to save comment to localStorage
  const saveCommentToStorage = (videoId: string, comment: Comment) => {
    try {
      const existingComments = loadCommentsFromStorage(videoId);
      const updatedComments = [comment, ...existingComments];
      localStorage.setItem(`comments_${videoId}`, JSON.stringify(updatedComments));
      console.log('Comment saved to localStorage:', comment);
    } catch (error) {
      console.error('Error saving comment to localStorage:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">
          Shadow Comments ({comments.length})
        </h3>
        <Button 
          onClick={createTestComments}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          Test Comments
        </Button>
      </div>
      
      {/* Show status indicator if using localStorage only */}
      {(window as any).__SUPABASE_STUB__ === true && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Local Mode:</strong> Comments are saved to your browser only. 
            To enable cloud sync, please configure the database connection.
          </p>
        </div>
      )}

      {/* Add Comment */}
      <Card className="p-4 bg-comment-bg border-border">
        <div className="space-y-4">
          {user ? (
            <>
              <Textarea
                placeholder="Share your uncensored thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-background border-border resize-none"
                disabled={submitting}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Posting as {user.user_metadata?.name || user.email?.split('@')[0] || 'User'} • Be respectful but speak freely
                </p>
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  variant="shadow"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted-foreground mb-4">
                Sign in with Google to join the conversation
              </p>
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id}>
              <Card className="p-4 bg-comment-bg border-border hover:bg-muted/50 transition-all duration-200">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {(comment.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {comment.display_name || 'Anonymous User'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(comment.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-foreground leading-relaxed">{comment.content}</p>
                </div>
              </div>
              </Card>
              
              {/* Ad after every 3rd comment */}
              {(index + 1) % 3 === 0 && (
                <div className="my-4">
                  <AdSenseAd 
                    adSlot="1234567893" 
                    adFormat="horizontal"
                    adStyle={{ display: "block", height: "90px" }}
                    className="text-center"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};