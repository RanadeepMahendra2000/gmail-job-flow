import { TrendingUp, Users, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "./Dashboard";

interface AnalyticsCardsProps {
  applications: Application[];
}

export const AnalyticsCards = ({ applications }: AnalyticsCardsProps) => {
  const total = applications.length;
  
  const thisWeek = applications.filter(app => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return app.applicationDate >= weekAgo;
  }).length;
  
  const thisMonth = applications.filter(app => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return app.applicationDate >= monthAgo;
  }).length;
  
  const interviewRate = total > 0 ? 
    Math.round((applications.filter(app => app.status === "INTERVIEW" || app.status === "OFFER").length / total) * 100) : 0;
  
  const offerRate = total > 0 ? 
    Math.round((applications.filter(app => app.status === "OFFER").length / total) * 100) : 0;

  const statusCounts = {
    PENDING: applications.filter(app => app.status === "PENDING").length,
    INTERVIEW: applications.filter(app => app.status === "INTERVIEW").length,
    ASSESSMENT: applications.filter(app => app.status === "ASSESSMENT").length,
    OFFER: applications.filter(app => app.status === "OFFER").length,
    REJECTED: applications.filter(app => app.status === "REJECTED").length,
  };

  const cards = [
    {
      title: "Total Applications",
      value: total.toString(),
      change: `+${thisWeek} this week`,
      icon: Users,
      positive: true
    },
    {
      title: "This Month",
      value: thisMonth.toString(),
      change: `${Math.round((thisMonth / total) * 100) || 0}% of total`,
      icon: Calendar,
      positive: true
    },
    {
      title: "Interview Rate",
      value: `${interviewRate}%`,
      change: `${statusCounts.INTERVIEW + statusCounts.OFFER} interviews`,
      icon: TrendingUp,
      positive: interviewRate >= 15
    },
    {
      title: "Offer Rate",
      value: `${offerRate}%`,
      change: `${statusCounts.OFFER} offers received`,
      icon: Target,
      positive: offerRate >= 5
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              card.positive 
                ? 'bg-success-muted text-success-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className={`text-xs ${
              card.positive ? 'text-success' : 'text-muted-foreground'
            }`}>
              {card.change}
            </p>
          </CardContent>
          
          {/* Gradient accent */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${
            card.positive 
              ? 'bg-gradient-to-r from-success to-success/70' 
              : 'bg-gradient-to-r from-muted to-muted/70'
          }`} />
        </Card>
      ))}
    </div>
  );
};