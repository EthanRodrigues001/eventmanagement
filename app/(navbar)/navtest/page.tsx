import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="flex h-500 flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">Welcome to the Dashboard</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        This is a demo of a dashboard with a collapsible sidebar and a
        responsive navbar.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/about">Learn More</Link>
        </Button>
      </div>
    </div>
  );
};

export default page;
