import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface StatsOverviewProps {
  userId: string;
}

export default function StatsOverview({ userId }: StatsOverviewProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/user', userId, 'stats'],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = {
    totalPosts: (stats as any)?.totalPosts || 0,
    scheduledPosts: (stats as any)?.scheduledPosts || 0,
    publishedPosts: (stats as any)?.publishedPosts || 0,
    avgEngagement: (stats as any)?.avgEngagement || 0,
  };

  const cards = [
    {
      title: "Total Posts",
      value: statsData.totalPosts,
      change: "+12%",
      changeText: "from last month",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"></path>
        </svg>
      ),
      bgColor: "bg-blue-50",
    },
    {
      title: "Scheduled",
      value: statsData.scheduledPosts,
      change: "Next: Tomorrow",
      changeText: "",
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      bgColor: "bg-amber-50",
    },
    {
      title: "Engagement Rate",
      value: `${statsData.avgEngagement}%`,
      change: "+0.8%",
      changeText: "from last month",
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
      ),
      bgColor: "bg-green-50",
    },
    {
      title: "AI Generated",
      value: Math.floor(statsData.totalPosts * 0.7),
      change: "70% of total",
      changeText: "",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      ),
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{card.change}</span>
              {card.changeText && <span className="text-gray-600 ml-1">{card.changeText}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
