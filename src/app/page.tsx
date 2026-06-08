"use client";

import Link from "next/link";
import { CalendarOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";

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
            <Link href="/appointment-status" className="text-sm hover:underline">Check Status</Link>
            <Link href="/book-appointment" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Book Appointment</Link>
            <Link href="/login" className="px-4 py-2 border rounded-lg text-sm font-medium">Staff Login</Link>
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
            <Link href="/book-appointment" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium">
              Book an Appointment <ArrowRightOutlined />
            </Link>
            <Link href="/appointment-status" className="inline-flex items-center gap-2 px-8 py-3 border rounded-lg text-lg font-medium">
              Track My Appointment
            </Link>
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
                <CalendarOutlined style={{ fontSize: 32, color: '#2563eb' }} />
              </div>
              <h3 className="text-xl font-semibold">Book Online</h3>
              <p className="text-muted-foreground">
                Schedule your visit in advance. Choose your preferred date, time, and the person you want to meet.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircleOutlined style={{ fontSize: 32, color: '#16a34a' }} />
              </div>
              <h3 className="text-xl font-semibold">Get Approved</h3>
              <p className="text-muted-foreground">
                Your appointment request is reviewed and you receive confirmation via email and SMS.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <SafetyCertificateOutlined style={{ fontSize: 32, color: '#9333ea' }} />
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
