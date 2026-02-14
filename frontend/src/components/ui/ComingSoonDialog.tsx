import { Sparkles, Rocket, Zap, GitBranch, Cloud, Users, Code2, FileSearch } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const upcomingFeatures = [
  {
    title: 'Better IntelliSense',
    description: 'Easier to write up Alloy configuration with enhanced autocomplete, context-aware suggestions, and inline documentation',
    icon: Code2,
    status: 'Planned',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Community Recipe Support',
    description: 'Community driven Alloy recipes that can be shared, discovered, and contributed by the community',
    icon: Users,
    status: 'Planned',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Config Validation Engine',
    description: 'Lint testing an Alloy config for any validation issues with detailed error messages and fix suggestions',
    icon: FileSearch,
    status: 'Planned',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
];

export function ComingSoonDialog({ open, onOpenChange }: ComingSoonDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Development':
        return 'bg-green-500';
      case 'Planned':
        return 'bg-blue-500';
      case 'Researching':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Coming Soon</DialogTitle>
              <DialogDescription>
                Exciting features we're building for the future of Alloy Studio
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-l-4" style={{ borderColor: feature.color.replace('text-', 'rgb(var(--') }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <Icon className={`h-5 w-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(feature.status)} text-white text-xs`}>
                      {feature.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Have a feature request? Let us know by contributing to the project or reaching out!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
