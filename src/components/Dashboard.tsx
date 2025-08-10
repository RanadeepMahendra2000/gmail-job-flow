import { useState } from "react";
import { Bell, Calendar, Filter, Mail, Plus, RefreshCw, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApplicationsTable } from "./ApplicationsTable";
import { TimelineChart } from "./TimelineChart";
import { AnalyticsCards } from "./AnalyticsCards";
import { DeadlineAlerts } from "./DeadlineAlerts";
import { FilterPanel } from "./FilterPanel";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: "PENDING" | "REJECTED" | "ASSESSMENT" | "INTERVIEW" | "OFFER";
  applicationDate: Date;
  deadline?: Date;
  source: "gmail" | "manual";
  gmailMessageId?: string;
}

// Mock data for the MVP
const mockApplications: Application[] = [
  {
    id: "1",
    company: "Google",
    role: "Senior Software Engineer",
    status: "INTERVIEW",
    applicationDate: new Date("2024-01-15"),
    deadline: new Date("2024-02-01"),
    source: "gmail",
    gmailMessageId: "msg1"
  },
  {
    id: "2",
    company: "Meta",
    role: "Product Manager",
    status: "PENDING",
    applicationDate: new Date("2024-01-20"),
    source: "gmail",
    gmailMessageId: "msg2"
  },
  {
    id: "3",
    company: "Amazon",
    role: "Frontend Developer",
    status: "ASSESSMENT",
    applicationDate: new Date("2024-01-25"),
    deadline: new Date("2024-01-30"),
    source: "manual"
  },
  {
    id: "4",
    company: "Netflix",
    role: "Data Scientist",
    status: "REJECTED",
    applicationDate: new Date("2024-01-10"),
    source: "gmail",
    gmailMessageId: "msg4"
  },
  {
    id: "5",
    company: "Apple",
    role: "iOS Developer",
    status: "OFFER",
    applicationDate: new Date("2024-01-05"),
    source: "gmail",
    gmailMessageId: "msg5"
  }
];

export const Dashboard = () => {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate Gmail sync
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Sync Gmail
              </Button>
              
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Manual
              </Button>
              
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Analytics Cards */}
        <AnalyticsCards applications={applications} />

        {/* Deadline Alerts */}
        <DeadlineAlerts applications={applications} />

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
              onUpdate={setApplications}
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
              <TimelineChart applications={applications} />
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
                {applications
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