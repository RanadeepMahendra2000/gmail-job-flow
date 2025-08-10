import { useState } from "react";
import { Bell, Calendar, Filter, LogOut, Mail, Plus, RefreshCw, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApplicationsTable } from "./ApplicationsTable";
import { TimelineChart } from "./TimelineChart";
import { AnalyticsCards } from "./AnalyticsCards";
import { DeadlineAlerts } from "./DeadlineAlerts";
import { FilterPanel } from "./FilterPanel";
import { useApplications } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Application, LegacyApplication } from "@/types/application";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Legacy interface mapping for existing components

// Map new application format to legacy format for existing components
const mapToLegacyFormat = (app: Application): LegacyApplication => ({
  id: app.id,
  company: app.company,
  role: app.role || 'Unknown Role',
  status: mapStatus(app.status),
  applicationDate: app.applied_at ? new Date(app.applied_at) : new Date(app.created_at),
  deadline: undefined, // TODO: Add deadline support
  source: app.source,
  gmailMessageId: app.email_id || undefined
});

const mapStatus = (status: Application['status']): LegacyApplication['status'] => {
  switch (status) {
    case 'applied': return 'PENDING';
    case 'assessment': return 'ASSESSMENT';
    case 'interview': return 'INTERVIEW';
    case 'offer': return 'OFFER';
    case 'rejected': return 'REJECTED';
    default: return 'PENDING';
  }
};

export const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const { applications, loading, syncing, syncGmail } = useApplications();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const handleLogout = async () => {
    await signOut();
  };

  // Map to legacy format and filter
  const legacyApplications = applications.map(mapToLegacyFormat);
  const filteredApplications = legacyApplications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || mapStatus(applications.find(a => a.id === app.id)?.status || 'applied') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Job Tracker</h1>
                <p className="text-sm text-muted-foreground">Gmail-powered application management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={syncGmail}
                disabled={syncing || loading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Gmail'}
              </Button>
              
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Manual
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Analytics Cards */}
        <AnalyticsCards applications={legacyApplications} />

        {/* Deadline Alerts */}
        <DeadlineAlerts applications={legacyApplications} />

        {/* Search and Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Applications</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies or roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
            
            {/* Status Filter Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {["ALL", "PENDING", "INTERVIEW", "ASSESSMENT", "OFFER", "REJECTED"].map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                </Badge>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {showFilters && <FilterPanel />}
            <ApplicationsTable 
              applications={filteredApplications}
              onUpdate={() => {}} // TODO: Implement real update handler
            />
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineChart applications={legacyApplications} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {legacyApplications
                  .filter(app => app.deadline && app.deadline > new Date())
                  .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
                  .slice(0, 5)
                  .map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{app.company}</p>
                        <p className="text-sm text-muted-foreground">{app.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {app.deadline?.toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil((app.deadline!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};