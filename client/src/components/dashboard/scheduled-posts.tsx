import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScheduledPostsProps {
  userId: string;
}

export default function ScheduledPosts({ userId }: ScheduledPostsProps) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/user', userId, 'posts'],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allPosts = (posts as any[]) || [];
  const scheduledPosts = allPosts.filter(post => post.status === 'scheduled');

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `In ${Math.floor(diffInHours)} hours`;
    } else if (diffInHours < 0) {
      return 'Overdue';
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'casual':
        return 'bg-green-100 text-green-800';
      case 'inspirational':
        return 'bg-purple-100 text-purple-800';
      case 'educational':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Scheduled Posts ({scheduledPosts.length})
          </CardTitle>
          <Button variant="outline" size="sm" className="text-blue-500 border-blue-500 hover:bg-blue-50">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Manage Schedule
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-500 text-sm">No scheduled posts</p>
            <p className="text-gray-400 text-xs mt-1">Use bulk generation to create scheduled posts</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {scheduledPosts
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mt-1.5"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getToneColor(post.tone)}>
                            {post.tone?.charAt(0).toUpperCase() + post.tone?.slice(1)}
                          </Badge>
                          {post.hashtags && (
                            <span className="text-xs text-gray-500">
                              {post.hashtags.split(' ').slice(0, 2).join(' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>{formatDateTime(post.scheduledAt)}</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-500 hover:text-blue-600 text-xs">
                              Edit
                            </button>
                            <button className="text-red-500 hover:text-red-600 text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}