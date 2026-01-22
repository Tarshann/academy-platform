import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

export function ContactsManager() {
  const { data: contacts, isLoading, refetch } = trpc.contact.list.useQuery();
  const markAsRead = trpc.admin.contacts.markRead.useMutation();
  const markAsResponded = trpc.admin.contacts.markResponded.useMutation();

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync({ id });
      toast.success("Marked as read");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleMarkResponded = async (id: number) => {
    try {
      await markAsResponded.mutateAsync({ id });
      toast.success("Marked as responded");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Submissions</CardTitle>
        <CardDescription>View and manage contact form submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No contact submissions yet
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((contact: any) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="capitalize">{contact.type}</TableCell>
                  <TableCell>
                    <Badge variant={
                      contact.status === 'new' ? 'default' : 
                      contact.status === 'read' ? 'secondary' : 
                      'outline'
                    }>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {contact.status === 'new' && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(contact.id)}>
                          Mark Read
                        </Button>
                      )}
                      {contact.status === 'read' && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkResponded(contact.id)}>
                          Mark Responded
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
