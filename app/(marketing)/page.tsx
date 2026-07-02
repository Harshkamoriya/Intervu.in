"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import Herosection from "@/app/components/HeroSection";

const Page = () => {
  const { isSignedIn } = useUser();

  const handleSaveUser = async () => {
    try {
      const res = await axios.post(`/api/user`);
      console.log(res, "res data");
    } catch (error) {
      console.error("Error in saving the user", error);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      handleSaveUser();
    }
  }, [isSignedIn]);

  return (
    <div>
      <Herosection />
    </div>
  );
};

export default Page;
