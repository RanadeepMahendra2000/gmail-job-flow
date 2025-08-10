import { Calendar, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FilterPanel = () => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="flex gap-2">
              <Input type="date" className="text-sm" />
              <Input type="date" className="text-sm" />
            </div>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium invisible">Actions</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Clear
              </Button>
              <Button size="sm" className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};