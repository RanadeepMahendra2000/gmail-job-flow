import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Application } from '@/types/application';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncGmail = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(`https://nfvedsxsqyciemqmtzam.supabase.co/functions/v1/gmail-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Sync failed');
      }

      const result = await response.json();
      
      toast({
        title: "Gmail sync completed",
        description: `Scanned: ${result.stats.scanned}, Created: ${result.stats.created}, Updated: ${result.stats.updated}`
      });

      // Refresh applications after sync
      await fetchApplications();
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    try {
      const { error } = await (supabase as any)
        .from('applications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app.id === id ? { ...app, ...updates } : app)
      );

      toast({
        title: "Application updated",
        description: "Changes saved successfully"
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Update failed",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setApplications(prev => prev.filter(app => app.id !== id));
      
      toast({
        title: "Application deleted",
        description: "Application removed successfully"
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete application",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchApplications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    applications,
    loading,
    syncing,
    syncGmail,
    updateApplication,
    deleteApplication,
    refetch: fetchApplications
  };
}