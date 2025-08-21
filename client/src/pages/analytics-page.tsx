import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Heart, MessageCircle, Share, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { user, logout, isLoading } = useAuth();

  const { data: posts } = useQuery({
    queryKey: ['/api/user', user?.id, 'posts'],
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/user', user?.id, 'stats'],
    enabled: !!user?.id,
  });

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  const allPosts = (posts as any[]) || [];
  const publishedPosts = allPosts.filter(post => post.status === 'published' && post.metrics);

  const getTotalEngagement = () => {
    return publishedPosts.reduce((total, post) => {
      const metrics = post.metrics as any;
      return total + (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0);
    }, 0);
  };

  const getTopPerformingPosts = () => {
    return publishedPosts
      .map(post => {
        const metrics = post.metrics as any;
        const engagement = (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0);
        return { ...post, totalEngagement: engagement };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} logout={logout} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Analytics</h2>
              <p className="text-sm text-gray-600 mt-1">Track your LinkedIn content performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Performance Insights</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Stats Overview */}
          <StatsOverview userId={user?.id || ""} />

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Engagement Overview */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Engagement Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {publishedPosts.reduce((total, post) => total + (post.metrics?.likes || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-600">Total Likes</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {publishedPosts.reduce((total, post) => total + (post.metrics?.comments || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-600">Total Comments</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Share className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {publishedPosts.reduce((total, post) => total + (post.metrics?.shares || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-600">Total Shares</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Engagement</span>
                      <span className="text-lg font-bold text-gray-900">{getTotalEngagement()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Average per Post</span>
                      <span className="text-lg font-bold text-gray-900">
                        {publishedPosts.length > 0 ? Math.round(getTotalEngagement() / publishedPosts.length) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Posts */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {getTopPerformingPosts().length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No published posts with metrics yet</p>
                    <p className="text-gray-400 text-sm mt-2">Publish posts to start tracking performance</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTopPerformingPosts().map((post: any, index: number) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              {post.totalEngagement} engagement
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(post.publishedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span>{post.metrics?.likes || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3 text-blue-500" />
                            <span>{post.metrics?.comments || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Share className="w-3 h-3 text-green-500" />
                            <span>{post.metrics?.shares || 0}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Performance by Tone */}
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Performance by Content Tone</CardTitle>
            </CardHeader>
            <CardContent>
              {publishedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No data available</p>
                  <p className="text-gray-400 text-sm mt-2">Publish posts to see performance by tone</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['professional', 'casual', 'inspirational', 'educational'].map(tone => {
                    const tonePosts = publishedPosts.filter(post => post.tone === tone);
                    const avgEngagement = tonePosts.length > 0 
                      ? tonePosts.reduce((total, post) => {
                          const metrics = post.metrics as any;
                          return total + (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0);
                        }, 0) / tonePosts.length 
                      : 0;
                    
                    return (
                      <div key={tone} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(avgEngagement)}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{tone}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {tonePosts.length} posts
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}