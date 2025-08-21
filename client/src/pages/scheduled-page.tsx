import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import ScheduledPosts from "@/components/dashboard/scheduled-posts";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";

export default function ScheduledPage() {
  const { user, logout, isLoading } = useAuth();

  const { data: posts } = useQuery({
    queryKey: ['/api/user', user?.id, 'posts'],
    enabled: !!user?.id,
  });

  const allPosts = (posts as any[]) || [];
  const scheduledPosts = allPosts.filter(post => post.status === 'scheduled');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <h2 className="text-2xl font-semibold text-gray-900">Scheduled Posts</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your upcoming LinkedIn posts</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-amber-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">{scheduledPosts.length} Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scheduled Posts Widget */}
            <div className="lg:col-span-1">
              <ScheduledPosts userId={user?.id || ""} />
            </div>

            {/* Detailed List */}
            <div className="lg:col-span-2">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    All Scheduled Posts ({scheduledPosts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduledPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No scheduled posts</p>
                      <p className="text-gray-400 text-sm mt-2">Create posts and schedule them for future publishing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts.map((post: any) => (
                        <div
                          key={post.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                Scheduled
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {post.tone.charAt(0).toUpperCase() + post.tone.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(post.scheduledAt)}</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-900 line-clamp-3 leading-relaxed">
                              {post.content}
                            </p>
                          </div>

                          {post.hashtags && (
                            <div className="mb-3">
                              <p className="text-xs text-blue-600 font-medium">
                                {post.hashtags}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {formatDate(post.createdAt)}</span>
                            {post.linkedinAccountId && (
                              <span className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Account Connected</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}