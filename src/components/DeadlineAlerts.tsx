import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LegacyApplication } from "@/types/application";

interface DeadlineAlertsProps {
  applications: LegacyApplication[];
}

export const DeadlineAlerts = ({ applications }: DeadlineAlertsProps) => {
  const now = new Date();
  
  const upcomingDeadlines = applications.filter(app => {
    if (!app.deadline) return false;
    const daysUntil = Math.ceil((app.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7; // Next 7 days
  }).sort((a, b) => (a.deadline!.getTime() - b.deadline!.getTime()));

  const overdueDeadlines = applications.filter(app => {
    if (!app.deadline) return false;
    return app.deadline < now;
  });

  if (upcomingDeadlines.length === 0 && overdueDeadlines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Overdue Alerts */}
      {overdueDeadlines.length > 0 && (
        <Alert className="border-destructive/50 bg-destructive-muted">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-destructive">
                {overdueDeadlines.length} overdue deadline{overdueDeadlines.length !== 1 ? 's' : ''}
              </span>
              <div className="mt-1 space-x-2">
                {overdueDeadlines.slice(0, 3).map((app, index) => (
                  <span key={index} className="text-sm text-destructive/80">
                    {app.company} ({app.role})
                  </span>
                ))}
                {overdueDeadlines.length > 3 && (
                  <span className="text-sm text-destructive/60">
                    +{overdueDeadlines.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Review
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Alerts */}
      {upcomingDeadlines.length > 0 && (
        <Alert className="border-warning/50 bg-warning-muted">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-warning-foreground">
                  {upcomingDeadlines.length} upcoming deadline{upcomingDeadlines.length !== 1 ? 's' : ''} this week
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {upcomingDeadlines.map((app, index) => {
                    const daysUntil = Math.ceil((app.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={index} className="flex items-center gap-2 bg-card rounded-lg p-2 border">
                        <div>
                          <p className="text-sm font-medium">{app.company}</p>
                          <p className="text-xs text-muted-foreground">{app.role}</p>
                        </div>
                        <Badge variant={daysUntil <= 1 ? "destructive" : daysUntil <= 3 ? "default" : "secondary"}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button size="sm" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};