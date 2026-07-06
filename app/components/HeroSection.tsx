"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between bg-background px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-20 lg:py-32">
      {/* Left – Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-start text-left max-w-2xl gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-1 w-1.5 rounded-full bg-primary" />
          <span className="text-sm font-medium text-muted-foreground">Interview Preparation</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
          Master Your Next Interview
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
          Practice realistic mock interviews with AI coaches, receive instant feedback, and interview with confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="px-8 py-6 text-base font-medium border border-border bg-background hover:bg-secondary text-foreground rounded-lg transition-colors duration-200"
          >
            Learn More
          </Button>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <span className="text-sm font-semibold text-foreground">2K+</span>
            </div>
            <span className="text-sm text-muted-foreground">Interviews completed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <span className="text-sm font-semibold text-foreground">4.9★</span>
            </div>
            <span className="text-sm text-muted-foreground">Average rating from users</span>
          </div>
        </div>
      </motion.div>

      {/* Right – Features Showcase */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mt-16 lg:mt-0 lg:ml-12 xl:ml-20 max-w-md lg:max-w-lg"
      >
        <div className="space-y-4">
          {/* Feature Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI-Powered Coaching</h3>
                <p className="text-sm text-muted-foreground mt-1">Real-time feedback from multiple AI coaches</p>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Detailed Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">Track your progress with comprehensive reports</p>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Instant Results</h3>
                <p className="text-sm text-muted-foreground mt-1">Get actionable feedback immediately after each session</p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <div className="border border-border bg-card rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-xs text-muted-foreground mt-1">Students Trained</div>
            </div>
            <div className="border border-border bg-card rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">95%</div>
              <div className="text-xs text-muted-foreground mt-1">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
