import { ShieldOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminAccessDenied() {
  return (
    <div className="flex justify-center p-4 pt-8 md:p-6 md:pt-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center justify-items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Access restricted</CardTitle>
          <CardDescription>
            You need administrator permissions to view and manage users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/admin/settings">Go to settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
