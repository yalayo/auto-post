import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import PostComposer from "@/components/dashboard/post-composer";
import RecentPosts from "@/components/dashboard/recent-posts";
import ConnectedAccounts from "@/components/dashboard/connected-accounts";
import BulkPostGenerator from "@/components/dashboard/bulk-post-generator";
import ScheduledPosts from "@/components/dashboard/scheduled-posts";
import PostsManager from "@/components/dashboard/posts-manager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Edit, Settings, FileText } from "lucide-react";

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} logout={logout} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your LinkedIn content and automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                Connect Account
              </Button>
              <BulkPostGenerator userId={user?.id || ""} />
              <Button className="linkedin-gradient">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Post
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Overview Stats */}
          <div className="mb-8">
            <StatsOverview userId={user?.id || ""} />
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Create</span>
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Manage Posts</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Accounts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentPosts userId={user?.id || ""} />
                <ScheduledPosts userId={user?.id || ""} />
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <div className="space-y-8">
                <PostComposer userId={user?.id || ""} />
                <BulkPostGenerator userId={user?.id || ""} />
              </div>
            </TabsContent>

            <TabsContent value="manage" className="mt-6">
              <PostsManager userId={user?.id || ""} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <ConnectedAccounts userId={user?.id || ""} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
