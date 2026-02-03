import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle2, Loader2, Download, Calendar, Clock, MapPin, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClerkPublishableKey, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const { isAuthenticated } = useAuth();
  const clerkPublishableKey = getClerkPublishableKey();
  const loginUrl = getLoginUrl();

  // Fetch checkout session details
  const { data: sessionDetails, isLoading: isLoadingSession } = (trpc.payment as any).getCheckoutSessionDetails.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (!isLoadingSession) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingSession]);

  const handleDownloadReceipt = async () => {
    if (!sessionDetails) return;
    
    setDownloadingReceipt(true);
    try {
      // Create a simple PDF receipt
      const receiptContent = generateReceiptContent(sessionDetails);
      downloadReceiptPDF(receiptContent, sessionDetails.id);
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download receipt. Please try again.");
      console.error("Receipt download error:", error);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading || isLoadingSession) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navigation />
        <main id="main-content" className="flex-1 flex items-center justify-center py-16">
          <div className="container max-w-2xl">
            <Card className="bg-card border-border text-center py-12">
              <CardContent>
                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
                <p className="text-muted-foreground">Confirming your payment...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1 py-16">
        <div className="container max-w-3xl">
          <Breadcrumbs items={[
            { label: "Programs", href: "/programs" },
            { label: "Payment Success" }
          ]} />

          {/* Success Header */}
          <Card className="bg-card border-border mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="text-green-600" size={64} />
              </div>
              <CardTitle className="text-3xl text-foreground">Payment Confirmed!</CardTitle>
              <p className="text-muted-foreground mt-2">Thank you for registering with The Academy</p>
            </CardHeader>
          </Card>

          {/* Order Summary */}
          {sessionDetails && (
            <Card className="bg-card border-border mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transaction Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                    <p className="font-mono text-sm break-all">{sessionDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                    <p className="text-sm">{formatDate(sessionDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {sessionDetails.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <Badge className="capitalize">{sessionDetails.status}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Items Purchased */}
                <div>
                  <h3 className="font-semibold mb-4">Items Purchased</h3>
                  <div className="space-y-3">
                    {sessionDetails.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.product?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.product.description}</p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                          )}
                        </div>
                        <p className="font-semibold text-foreground ml-4">
                          {formatCurrency(item.amount, sessionDetails.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg">
                  <p className="font-semibold">Total Amount</p>
                  <p className="font-bold text-xl text-primary">
                    {formatCurrency(sessionDetails.amount, sessionDetails.currency)}
                  </p>
                </div>

                {/* Download Receipt */}
                <Button 
                  onClick={handleDownloadReceipt}
                  disabled={downloadingReceipt}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingReceipt ? "Downloading..." : "Download Receipt"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Message */}
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Confirmation Email Sent</p>
                  <p className="text-sm text-blue-800">
                    A confirmation email with your program details and next steps has been sent to{' '}
                    <span className="font-semibold">{sessionDetails?.customerEmail}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-xl">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold">
                      1
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Check Your Email</h4>
                    <p className="text-sm text-muted-foreground">
                      Review your confirmation email for program details, start dates, and location information.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold">
                      2
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">View Your Schedule</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Access your registered sessions and upcoming training dates.
                    </p>
                    {isAuthenticated ? (
                      <Link href="/member">
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Schedule
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link> to view your schedule
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold">
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Prepare for Your First Session</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Wear athletic shoes and comfortable clothing</li>
                      <li>Bring a water bottle to stay hydrated</li>
                      <li>Arrive 10 minutes early to check in</li>
                      <li>Bring a positive attitude and be ready to work!</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-semibold">
                      4
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Connect with the Community</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Join our member chat to connect with other athletes and stay updated on announcements.
                    </p>
                    {isAuthenticated ? (
                      <Link href="/member">
                        <Button size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-2" />
                          Join Community Chat
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link> to access community chat
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="space-y-3">
            {isAuthenticated ? (
              <Link href="/member">
                <Button className="w-full" size="lg">
                  Go to Member Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button className="w-full" size="lg">
                    Create Account for Full Access
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            
            <Link href="/register">
              <Button variant="outline" className="w-full" size="lg">
                Register for More Programs
              </Button>
            </Link>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Questions? <Link href="/contact"><span className="text-primary hover:underline">Contact us</span></Link> or email us at{' '}
                <a href="mailto:omarphilmore@yahoo.com" className="text-primary hover:underline">omarphilmore@yahoo.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Helper function to generate receipt content
function generateReceiptContent(sessionDetails: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: sessionDetails.currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return {
    transactionId: sessionDetails.id,
    date: formatDate(sessionDetails.createdAt),
    email: sessionDetails.customerEmail,
    items: sessionDetails.items,
    total: formatCurrency(sessionDetails.amount),
    currency: sessionDetails.currency,
  };
}

// Helper function to download receipt as PDF
function downloadReceiptPDF(receiptContent: any, sessionId: string) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 15;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined as any, 'bold');
    doc.text('THE ACADEMY', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont(undefined as any, 'normal');
    doc.text('PAYMENT RECEIPT', margin, yPosition);
    yPosition += 15;

    // Transaction Details
    doc.setFontSize(10);
    doc.setFont(undefined as any, 'bold');
    doc.text('Transaction Details', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined as any, 'normal');
    doc.setFontSize(9);
    doc.text('Transaction ID: ' + receiptContent.transactionId, margin, yPosition);
    yPosition += lineHeight;
    doc.text('Date: ' + receiptContent.date, margin, yPosition);
    yPosition += lineHeight;
    doc.text('Email: ' + receiptContent.email, margin, yPosition);
    yPosition += 12;

    // Items
    doc.setFontSize(10);
    doc.setFont(undefined as any, 'bold');
    doc.text('Items Purchased', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined as any, 'normal');
    doc.setFontSize(9);
    receiptContent.items.forEach((item: any) => {
      const itemName = item.name.substring(0, 50);
      doc.text('• ' + itemName, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, 'normal');
      doc.setFontSize(8);
      const amountStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: receiptContent.currency?.toUpperCase() || 'USD',
      }).format(item.amount / 100);
      doc.text('  Qty: ' + item.quantity + ' | Amount: ' + amountStr, margin + 5, yPosition);
      yPosition += lineHeight + 2;
      doc.setFontSize(9);
    });

    yPosition += 5;

    // Total
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont(undefined as any, 'bold');
    doc.text('Total Amount:', margin, yPosition);
    doc.text(receiptContent.total as string, pageWidth - margin - 20, yPosition, { align: 'right' });
    yPosition += 15;

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined as any, 'normal');
    doc.text('Thank you for registering with The Academy!', margin, yPosition);
    yPosition += 8;
    doc.text('For questions, contact:', margin, yPosition);
    yPosition += lineHeight;
    doc.text('Email: omarphilmore@yahoo.com | Phone: (571) 292-0833', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is your receipt. Please keep it for your records.', margin, pageHeight - 15);

    // Save the PDF
    doc.save('Academy-Receipt-' + sessionId + '.pdf');
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to text receipt
    const receiptText = 'THE ACADEMY - PAYMENT RECEIPT\n================================\n\nTransaction ID: ' + receiptContent.transactionId + '\nDate: ' + receiptContent.date + '\nEmail: ' + receiptContent.email + '\n\nITEMS PURCHASED\n================================\n' + receiptContent.items.map((item: any) => item.name + '\nQuantity: ' + item.quantity + '\nAmount: ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: receiptContent.currency?.toUpperCase() || 'USD' }).format(item.amount / 100) + '\n').join('\n') + '\nTOTAL: ' + receiptContent.total + '\n\nThank you for your registration!\n\nFor questions, contact:\nEmail: omarphilmore@yahoo.com\nPhone: (571) 292-0833\n\n================================\nThis is your receipt. Please keep it for your records.';

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Academy-Receipt-' + sessionId + '.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
