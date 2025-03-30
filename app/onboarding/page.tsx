"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    phoneNumber: "",
    organization: "",
    gender: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSubmitting(true);

      // Update user document
      await updateDoc(doc(db, "users", user.uid), {
        phoneNumber: formData.phoneNumber,
        organization: formData.organization,
        gender: formData.gender,
        onboardingCompleted: true,
        lastLogin: serverTimestamp(),
      });

      toast("Profile updated", {
        description: "Your profile has been successfully updated.",
      });

      router.push("/events");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error", {
        description:
          "There was an error updating your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }
  if (user.onboardingCompleted) {
    return <div>completed onboarding</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Please provide additional information to complete your profile
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization/Department</Label>
              <Input
                id="organization"
                name="organization"
                placeholder="Enter your organization or department"
                value={formData.organization}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={handleGenderChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="prefer-not-to-say"
                    id="prefer-not-to-say"
                  />
                  <Label htmlFor="prefer-not-to-say">Prefer not to say</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Complete Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
