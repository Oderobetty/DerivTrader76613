import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Client {
  userId: number;
  username: string;
  balance: string;
  connected: boolean;
  derivAccountId: string;
}

export default function ClientManagementPage() {
  const [newClient, setNewClient] = useState({
    userId: '',
    username: '',
    derivAccountId: '',
    apiToken: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connectedClients } = useQuery({
    queryKey: ['/api/clients/connected'],
    refetchInterval: 5000
  });

  const connectClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return apiRequest("POST", "/api/clients/connect", clientData);
    },
    onSuccess: () => {
      toast({
        title: "Client Connected",
        description: "Client has been successfully connected to Deriv API",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/connected'] });
      setNewClient({ userId: '', username: '', derivAccountId: '', apiToken: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect client",
        variant: "destructive",
      });
    },
  });

  const disconnectClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return apiRequest("POST", `/api/clients/${clientId}/disconnect`, {});
    },
    onSuccess: () => {
      toast({
        title: "Client Disconnected",
        description: "Client has been disconnected from Deriv API",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/connected'] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect client",
        variant: "destructive",
      });
    },
  });

  const handleConnectClient = () => {
    if (!newClient.userId || !newClient.apiToken) {
      toast({
        title: "Missing Information",
        description: "Please provide User ID and API Token",
        variant: "destructive",
      });
      return;
    }

    connectClientMutation.mutate({
      userId: parseInt(newClient.userId),
      derivAccountId: newClient.derivAccountId,
      apiToken: newClient.apiToken
    });
  };

  const handleDisconnectClient = (clientId: number) => {
    disconnectClientMutation.mutate(clientId);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--trading-dark))] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Management</h1>
          <p className="text-gray-400">Manage client connections and monitor their trading activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Connect New Client */}
          <Card className="bg-[hsl(var(--trading-slate))] border-[hsl(var(--trading-gray))]">
            <CardHeader>
              <CardTitle className="text-white">Connect New Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">User ID</Label>
                <Input
                  type="number"
                  value={newClient.userId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, userId: e.target.value }))}
                  className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                  placeholder="Enter user ID"
                />
              </div>
              
              <div>
                <Label className="text-white">Username (Optional)</Label>
                <Input
                  value={newClient.username}
                  onChange={(e) => setNewClient(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label className="text-white">Deriv Account ID (Optional)</Label>
                <Input
                  value={newClient.derivAccountId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, derivAccountId: e.target.value }))}
                  className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                  placeholder="Enter Deriv account ID"
                />
              </div>

              <div>
                <Label className="text-white">API Token *</Label>
                <Input
                  type="password"
                  value={newClient.apiToken}
                  onChange={(e) => setNewClient(prev => ({ ...prev, apiToken: e.target.value }))}
                  className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                  placeholder="Enter client's Deriv API token"
                />
              </div>

              <Button
                onClick={handleConnectClient}
                disabled={connectClientMutation.isPending}
                className="w-full bg-[hsl(var(--profit-green))] hover:bg-green-600 text-white"
              >
                {connectClientMutation.isPending ? "Connecting..." : "Connect Client"}
              </Button>
            </CardContent>
          </Card>

          {/* Connected Clients Overview */}
          <Card className="bg-[hsl(var(--trading-slate))] border-[hsl(var(--trading-gray))]">
            <CardHeader>
              <CardTitle className="text-white">Connected Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-[hsl(var(--profit-green))] mb-2">
                  {connectedClients?.count || 0}
                </div>
                <p className="text-gray-400">Active Connections</p>
              </div>
              
              {connectedClients?.clients?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-400">Client IDs:</p>
                  <div className="flex flex-wrap gap-2">
                    {connectedClients.clients.map((clientId: number) => (
                      <Badge key={clientId} variant="secondary" className="bg-[hsl(var(--trading-gray))] text-white">
                        {clientId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client Management Table */}
        <Card className="bg-[hsl(var(--trading-slate))] border-[hsl(var(--trading-gray))]">
          <CardHeader>
            <CardTitle className="text-white">Client Management</CardTitle>
          </CardHeader>
          <CardContent>
            {!connectedClients?.clients?.length ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-users text-3xl mb-4 block"></i>
                <p>No clients connected</p>
                <p className="text-sm">Connect clients using their Deriv API tokens to start managing their funds</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectedClients.clients.map((clientId: number) => (
                  <ClientCard 
                    key={clientId} 
                    clientId={clientId} 
                    onDisconnect={handleDisconnectClient}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientCard({ clientId, onDisconnect }: { clientId: number; onDisconnect: (id: number) => void }) {
  const { data: clientBalance } = useQuery({
    queryKey: [`/api/clients/${clientId}/balance`],
    refetchInterval: 10000
  });

  const { data: clientPositions } = useQuery({
    queryKey: [`/api/clients/${clientId}/positions`],
    refetchInterval: 5000
  });

  const { data: clientTrades } = useQuery({
    queryKey: [`/api/clients/${clientId}/trades`]
  });

  return (
    <div className="bg-[hsl(var(--trading-gray))] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[hsl(var(--info-blue))] rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white"></i>
          </div>
          <div>
            <h3 className="font-semibold text-white">Client {clientId}</h3>
            <p className="text-sm text-gray-400">
              Status: {clientBalance?.connected ? 
                <span className="text-[hsl(var(--profit-green))]">Connected</span> : 
                <span className="text-[hsl(var(--loss-red))]">Disconnected</span>
              }
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => onDisconnect(clientId)}
          variant="destructive"
          size="sm"
          className="bg-[hsl(var(--loss-red))] hover:bg-red-600"
        >
          Disconnect
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Balance</p>
          <p className="font-semibold text-white">${clientBalance?.balance || "0.00"}</p>
        </div>
        <div>
          <p className="text-gray-400">Open Positions</p>
          <p className="font-semibold text-white">{clientPositions?.length || 0}</p>
        </div>
        <div>
          <p className="text-gray-400">Total Trades</p>
          <p className="font-semibold text-white">{clientTrades?.length || 0}</p>
        </div>
      </div>
    </div>
  );
}