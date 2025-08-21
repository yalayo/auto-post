import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import PostComposer from "@/components/dashboard/post-composer";
import BulkPostGenerator from "@/components/dashboard/bulk-post-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Users, Loader2 } from "lucide-react";

export default function CreatePage() {
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
              <h2 className="text-2xl font-semibold text-gray-900">Create Posts</h2>
              <p className="text-sm text-gray-600 mt-1">Generate engaging LinkedIn content with AI</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Content Creation</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Single Post</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Bulk Generation</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6">
              <div className="max-w-4xl">
                <PostComposer userId={user?.id || ""} />
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <div className="max-w-4xl">
                <BulkPostGenerator userId={user?.id || ""} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}