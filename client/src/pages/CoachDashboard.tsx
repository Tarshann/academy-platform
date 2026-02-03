import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Clock, Mail, Phone, User, CheckCircle, XCircle, Clock as ClockIcon } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  coachId: number;
  coachName: string;
  preferredDates: string | null;
  preferredTimes: string | null;
  notes: string | null;
  status: BookingStatus;
  stripeSessionId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function CoachDashboard() {
  const [selectedCoach, setSelectedCoach] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<BookingStatus>("pending");

  const { data: bookings, isLoading, refetch } = trpc.payment.getCoachBookings.useQuery({
    coachId: selectedCoach,
    status: activeTab,
  });

  const updateStatus = trpc.payment.updateBookingStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      refetch();
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to update booking: ${error.message}`);
    },
  });

  const handleStatusChange = (bookingId: number, newStatus: BookingStatus) => {
    updateStatus.mutate({
      bookingId,
      status: newStatus,
    });
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      completed: { variant: "secondary", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Coach Dashboard</h1>
        <p className="text-muted-foreground">Manage your private session booking requests</p>
      </div>

      {/* Coach Filter */}
      <div className="mb-6 flex gap-4">
        <Button
          variant={selectedCoach === undefined ? "default" : "outline"}
          onClick={() => setSelectedCoach(undefined)}
        >
          All Coaches
        </Button>
        <Button
          variant={selectedCoach === 1 ? "default" : "outline"}
          onClick={() => setSelectedCoach(1)}
        >
          Coach Mac
        </Button>
        <Button
          variant={selectedCoach === 2 ? "default" : "outline"}
          onClick={() => setSelectedCoach(2)}
        >
          Coach O
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BookingStatus)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking: Booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {booking.customerName}
                        </CardTitle>
                        <CardDescription>
                          Requested on {formatDate(booking.createdAt)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {/* Contact Information */}
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${booking.customerEmail}`} className="hover:underline">
                            {booking.customerEmail}
                          </a>
                        </div>
                        {booking.customerPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${booking.customerPhone}`} className="hover:underline">
                              {booking.customerPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Coach Assignment */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.coachName}</span>
                      </div>

                      {/* Preferred Schedule */}
                      {(booking.preferredDates || booking.preferredTimes) && (
                        <div className="grid gap-2">
                          {booking.preferredDates && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.preferredDates}</span>
                            </div>
                          )}
                          {booking.preferredTimes && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.preferredTimes}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {booking.notes && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground">{booking.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(booking.id, "confirmed")}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking.id, "cancelled")}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(booking.id, "completed")}
                            disabled={updateStatus.isPending}
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Mark Completed
                          </Button>
                        )}
                        {booking.status === "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(booking.id, "pending")}
                            disabled={updateStatus.isPending}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No {activeTab} bookings found
                  {selectedCoach && " for this coach"}.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
