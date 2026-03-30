/**
 * Admin Reports Management Page
 * 
 * Displays all reports for admin review and management.
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminReportCard } from "@/components/report/AdminReportCard";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Users,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  _id: string;
  reporter: {
    _id: string;
    username: string;
    email?: string;
  };
  reportedUser: {
    _id: string;
    username: string;
    email?: string;
    warningCount?: number;
    isBlocked?: boolean;
  };
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  isValidated: boolean;
  aiSeverity?: "low" | "medium" | "high" | "critical";
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface BlockedUser {
  _id: string;
  username: string;
  email: string;
  warningCount: number;
  blockedAt: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/report", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch("/api/v1/users/blocked", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setBlockedUsers(data.data || []);
    } catch {
      // Silently fail - blocked users list is optional
    }
  };

  useEffect(() => {
    fetchReports();
    fetchBlockedUsers();
  }, []);

  const handleStatusUpdate = (reportId: string, newStatus: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r._id === reportId ? { ...r, status: newStatus as Report["status"] } : r
      )
    );
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchQuery === "" ||
      report.reporter.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && report.status === "pending") ||
      (activeTab === "reviewed" && report.status === "reviewed") ||
      (activeTab === "resolved" && report.status === "resolved") ||
      (activeTab === "dismissed" && report.status === "dismissed");

    return matchesSearch && matchesTab;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8" />
            Report Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="text-sm py-1 px-3">
            {pendingCount} Pending
          </Badge>
          <Badge variant="secondary" className="text-sm py-1 px-3">
            <Users className="h-3 w-3 mr-1" />
            {blockedUsers.length} Blocked
          </Badge>
          <Button variant="outline" size="icon" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </span>
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-left-icon
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No reports found</p>
              <p className="text-sm">
                {activeTab === "pending"
                  ? "All caught up! No pending reports to review."
                  : "No reports match your current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <AdminReportCard
                  key={report._id}
                  report={report}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
