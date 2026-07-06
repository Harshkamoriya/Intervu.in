"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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

      {/* Right – Visual */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mt-16 lg:mt-0 lg:ml-12 xl:ml-20 max-w-md lg:max-w-lg"
      >
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
          <Image
            src="/unnamed.jpg"
            alt="Interview Practice Platform"
            width={600}
            height={600}
            priority
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
