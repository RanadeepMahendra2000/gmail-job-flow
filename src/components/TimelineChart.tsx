import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LegacyApplication } from "@/types/application";

interface TimelineChartProps {
  applications: LegacyApplication[];
}

export const TimelineChart = ({ applications }: TimelineChartProps) => {
  // Generate data for the last 30 days
  const generateTimelineData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayApplications = applications.filter(app => {
        const appDate = new Date(app.applicationDate);
        return appDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications: dayApplications.length,
        pending: dayApplications.filter(app => app.status === "PENDING").length,
        interview: dayApplications.filter(app => app.status === "INTERVIEW").length,
        assessment: dayApplications.filter(app => app.status === "ASSESSMENT").length,
        offer: dayApplications.filter(app => app.status === "OFFER").length,
        rejected: dayApplications.filter(app => app.status === "REJECTED").length,
      });
    }
    
    return data;
  };

  const data = generateTimelineData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {data.applications} application{data.applications !== 1 ? 's' : ''}
          </p>
          {data.applications > 0 && (
            <div className="mt-2 space-y-1 text-xs">
              {data.pending > 0 && <p className="text-warning">• {data.pending} Pending</p>}
              {data.interview > 0 && <p className="text-primary">• {data.interview} Interview</p>}
              {data.assessment > 0 && <p className="text-accent-foreground">• {data.assessment} Assessment</p>}
              {data.offer > 0 && <p className="text-success">• {data.offer} Offer</p>}
              {data.rejected > 0 && <p className="text-destructive">• {data.rejected} Rejected</p>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="applications" 
            fill="hsl(var(--primary))"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};