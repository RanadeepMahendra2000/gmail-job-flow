import { useState } from "react";
import { MoreHorizontal, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Application } from "./Dashboard";

interface ApplicationsTableProps {
  applications: Application[];
  onUpdate: (applications: Application[]) => void;
}

export const ApplicationsTable = ({ applications, onUpdate }: ApplicationsTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application>>({});

  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-warning-muted text-warning-foreground border-warning/20";
      case "INTERVIEW":
        return "bg-primary-muted text-primary-foreground border-primary/20";
      case "ASSESSMENT":
        return "bg-accent text-accent-foreground border-border";
      case "OFFER":
        return "bg-success-muted text-success-foreground border-success/20";
      case "REJECTED":
        return "bg-destructive-muted text-destructive-foreground border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleEdit = (application: Application) => {
    setEditingId(application.id);
    setEditForm({
      company: application.company,
      role: application.role,
      status: application.status,
      deadline: application.deadline
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    
    const updatedApplications = applications.map(app =>
      app.id === editingId ? { ...app, ...editForm } : app
    );
    onUpdate(updatedApplications);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    const updatedApplications = applications.filter(app => app.id !== id);
    onUpdate(updatedApplications);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Applied</TableHead>
            <TableHead className="font-semibold">Deadline</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id} className="border-border/30 hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">
                {editingId === application.id ? (
                  <Input
                    value={editForm.company || ""}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="h-8"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary">
                      {application.company.charAt(0)}
                    </div>
                    {application.company}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === application.id ? (
                  <Input
                    value={editForm.role || ""}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="h-8"
                  />
                ) : (
                  <div>
                    <p className="font-medium">{application.role}</p>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === application.id ? (
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as Application["status"] })}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                      <SelectItem value="INTERVIEW">Interview</SelectItem>
                      <SelectItem value="OFFER">Offer</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                  </Badge>
                )}
              </TableCell>
              
              <TableCell>
                <div>
                  <p className="text-sm">{formatDate(application.applicationDate)}</p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(application.applicationDate)}</p>
                </div>
              </TableCell>
              
              <TableCell>
                {editingId === application.id ? (
                  <Input
                    type="date"
                    value={editForm.deadline?.toISOString().split('T')[0] || ""}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      deadline: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="h-8 w-36"
                  />
                ) : application.deadline ? (
                  <div>
                    <p className="text-sm">{formatDate(application.deadline)}</p>
                    <p className="text-xs text-muted-foreground">
                      {application.deadline > new Date() ? (
                        `${Math.ceil((application.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                      ) : (
                        "Overdue"
                      )}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No deadline</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {application.source}
                  </Badge>
                  {application.source === "gmail" && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {editingId === application.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleSave} className="h-6 px-2 text-xs">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 px-2 text-xs">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(application)}>
                        <Edit2 className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(application.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No applications found</p>
          <p className="text-sm">Start by syncing your Gmail or adding applications manually</p>
        </div>
      )}
    </div>
  );
};