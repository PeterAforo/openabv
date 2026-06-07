import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, Users, Clock, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OA</span>
            </div>
            <span className="font-bold text-xl">OpenABV</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/appointment-status">Check Status</Link>
            </Button>
            <Button asChild>
              <Link href="/book-appointment">Book Appointment</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Staff Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-background px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Appointment Booking &<br />
            <span className="text-primary">Visitor Management</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Book appointments online, streamline visitor check-ins, and manage your front desk operations efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/book-appointment">
                Book an Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/appointment-status">Track My Appointment</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Book Online</h3>
              <p className="text-muted-foreground">
                Schedule your visit in advance. Choose your preferred date, time, and the person you want to meet.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Get Approved</h3>
              <p className="text-muted-foreground">
                Your appointment request is reviewed and you receive confirmation via email and SMS.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Check In</h3>
              <p className="text-muted-foreground">
                Present your reference code at security for a smooth and quick check-in process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">Fast</div>
            <p className="text-sm text-muted-foreground mt-1">Check-in Process</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">Secure</div>
            <p className="text-sm text-muted-foreground mt-1">Visitor Tracking</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">Real-time</div>
            <p className="text-sm text-muted-foreground mt-1">Notifications</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">Smart</div>
            <p className="text-sm text-muted-foreground mt-1">Calendar Sync</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">OA</span>
            </div>
            <span className="font-semibold">OpenABV</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Appointment Booking & Visitor Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
