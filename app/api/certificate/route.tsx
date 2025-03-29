import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get certificate parameters
    const eventName = searchParams.get("eventName") || "Campus Event";
    const position = searchParams.get("position") || "Participation";
    const userName = searchParams.get("userName") || "Participant";
    const logoUrl = searchParams.get("logoUrl") || null;
    const date = searchParams.get("date") || new Date().toLocaleDateString();

    // Create certificate
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            backgroundImage:
              "linear-gradient(to bottom right, #f0f4ff, #ffffff)",
            padding: 50,
            position: "relative",
          }}
        >
          {/* Border */}
          <div
            style={{
              position: "absolute",
              inset: 20,
              border: "2px solid #4f46e5",
              borderRadius: 10,
              zIndex: 1, // set as a string so it remains unitless
              display: "block", // explicit display (not strictly needed here, but helps satisfy OG)
            }}
          />
          {/* Certificate content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              zIndex: 2, // set as a string so it remains unitless
              textAlign: "center",
            }}
          >
            {/* Header */}
            <div
              style={{
                fontSize: 24,
                color: "#4f46e5",
                fontWeight: "bold",
                marginBottom: 10,
                display: "flex",
                flexDirection: "column",
              }}
            >
              CERTIFICATE OF {position.toUpperCase()}
            </div>

            {/* Logo if available */}
            {logoUrl && (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt="Event Logo"
                width={80}
                height={80}
                style={{ marginBottom: 20 }}
              />
            )}

            <div
              style={{
                fontSize: 16,
                color: "#6b7280",
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
              }}
            >
              This is to certify that
            </div>

            {/* Recipient name */}
            <div
              style={{
                fontSize: 36,
                color: "#1f2937",
                fontWeight: "bold",
                marginBottom: 20,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {userName}
            </div>

            {/* Certificate text – combined into one string to avoid multiple text nodes */}
            <div
              style={{
                fontSize: 16,
                color: "#6b7280",
                marginBottom: 20,
                maxWidth: 500,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {`has ${
                position === "Participation"
                  ? "participated in"
                  : `achieved ${position} in`
              } the event`}
            </div>

            {/* Event name */}
            <div
              style={{
                fontSize: 24,
                color: "#1f2937",
                fontWeight: "bold",
                marginBottom: 30,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {eventName}
            </div>

            {/* Date */}
            <div
              style={{
                fontSize: 16,
                color: "#6b7280",
                marginBottom: 40,
                display: "flex",
                flexDirection: "column",
              }}
            >
              Issued on {date}
            </div>

            {/* Signature */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "80%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 2,
                    backgroundColor: "#4f46e5",
                    marginBottom: 10,
                    display: "flex",
                    flexDirection: "column",
                  }}
                />
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  Event Organizer
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 2,
                    backgroundColor: "#4f46e5",
                    marginBottom: 10,
                  }}
                />
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  College Authority
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 700,
      }
    );
  } catch (error) {
    console.error("Error generating certificate:", error);
    return new Response(`Failed to generate certificate: ${error}`, {
      status: 500,
    });
  }
}
