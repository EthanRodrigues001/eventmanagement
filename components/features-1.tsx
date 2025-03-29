import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Users, Clock, MapPin, Video, Megaphone } from "lucide-react";
import { ReactNode } from "react";

export default function Features() {
  return (
    <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Event Management Made Easy
          </h2>
          <p className="mt-4">
            Streamline your event planning with our powerful tools and features.
          </p>
        </div>
        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Calendar className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Event Scheduling</h3>
            </CardHeader>

            <CardContent>
              <p className="text-sm">
                Easily schedule and manage multiple events with our intuitive
                calendar system.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Users className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Guest Management</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Track RSVPs, manage guest lists, and send automated reminders
                seamlessly.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Clock className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Time Management</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Create detailed event timelines and manage speaker schedules
                efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <MapPin className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Venue Management</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Organize and coordinate multiple venue locations with ease.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Video className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Live Streaming</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Broadcast your events live with high-quality video streaming
                capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Megaphone className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">Marketing Tools</h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm">
                Promote your events with built-in marketing tools and social
                media integration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div
      aria-hidden
      className="bg-radial to-background absolute inset-0 from-transparent to-75%"
    />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
