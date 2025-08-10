import { Mail, Shield, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const AuthPage = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const features = [
    {
      icon: Mail,
      title: "Gmail Integration",
      description: "Automatically sync and parse job application emails from your Gmail inbox"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track your application progress with detailed analytics and timeline views"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We only read job-related emails"
    },
    {
      icon: Zap,
      title: "AI-Powered Parsing",
      description: "Automatically extract company names, positions, and status updates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-muted/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Hero content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-primary">
                  <Mail className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold">Job Tracker</h1>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Turn your Gmail into a
                <span className="text-primary block">job application dashboard</span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Stop managing job applications in spreadsheets. Let AI automatically track your applications, 
                deadlines, and progress from your Gmail inbox.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Auth card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Connect your Gmail account to start tracking your job applications automatically
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full gap-3 h-12 text-lg font-medium bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-primary"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    We only request read-only access to job-related emails.
                    <br />
                    Your privacy and security are our priority.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    🔒 Secure OAuth 2.0 Authentication
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};