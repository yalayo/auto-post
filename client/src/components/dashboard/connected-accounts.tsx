import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ConnectedAccountsProps {
  userId: string;
}

export default function ConnectedAccounts({ userId }: ConnectedAccountsProps) {
  const { toast } = useToast();
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/user', userId, 'linkedin-accounts'],
    enabled: !!userId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/linkedin');
      return response.json();
    },
    onSuccess: (data: any) => {
      window.location.href = data.authUrl;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate LinkedIn connection.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectedAccounts = (accounts as any[]) || [];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Connected Accounts</CardTitle>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={handleConnect}
            disabled={connectMutation.isPending}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            {connectMutation.isPending ? "Connecting..." : "Add Account"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {connectedAccounts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <p className="text-gray-500 text-sm mb-4">No LinkedIn accounts connected</p>
            <Button
              className="linkedin-gradient"
              onClick={handleConnect}
              disabled={connectMutation.isPending}
            >
              Connect Your LinkedIn Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedAccounts.map((account: any) => (
              <div
                key={account.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                    {account.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{account.name}</h4>
                    <p className="text-sm text-gray-600">
                      {account.type === 'personal' ? 'Personal Account' : 'Company Page'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>{account.followers?.toLocaleString() || '0'} followers</span>
                  <button className="text-blue-500 hover:text-blue-600">
                    Manage
                  </button>
                </div>
              </div>
            ))}

            {/* Add new account placeholder */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={handleConnect}
            >
              <div className="flex flex-col items-center justify-center py-4">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <p className="text-sm text-gray-600">Add Account</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
