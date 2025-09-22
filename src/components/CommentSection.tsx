import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  videoId: string;
}

export const CommentSection = ({ videoId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "FreedomSeeker",
      content: "Finally, a place where we can speak freely about this topic without fear of censorship!",
      timestamp: "2 hours ago",
      likes: 12,
      dislikes: 1,
    },
    {
      id: "2", 
      author: "TruthTeller",
      content: "The mainstream narrative around this is completely wrong. Here's what they don't want you to know...",
      timestamp: "1 hour ago",
      likes: 8,
      dislikes: 3,
    },
    {
      id: "3",
      author: "IndependentThinker",
      content: "Great to have an uncensored space to discuss these important issues. More people need to see this.",
      timestamp: "45 minutes ago", 
      likes: 15,
      dislikes: 0,
    },
  ]);
  
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: "Anonymous",
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      dislikes: 0,
    };

    setComments([comment, ...comments]);
    setNewComment("");
    
    toast({
      title: "Comment posted!",
      description: "Your voice has been heard in the shadow realm",
    });
  };

  const handleVote = (commentId: string, voteType: 'like' | 'dislike') => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: voteType === 'like' ? comment.likes + 1 : comment.likes,
          dislikes: voteType === 'dislike' ? comment.dislikes + 1 : comment.dislikes,
        };
      }
      return comment;
    }));
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">
          Shadow Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment */}
      <Card className="p-4 bg-comment-bg border-border">
        <div className="space-y-4">
          <Textarea
            placeholder="Share your uncensored thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] bg-background border-border resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Posting as Anonymous • Be respectful but speak freely
            </p>
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              variant="shadow"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="p-4 bg-comment-bg border-border hover:bg-muted/50 transition-all duration-200">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {comment.author[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{comment.author}</span>
                  <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                </div>
                
                <p className="text-foreground leading-relaxed">{comment.content}</p>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(comment.id, 'like')}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {comment.likes}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(comment.id, 'dislike')}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    {comment.dislikes}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};