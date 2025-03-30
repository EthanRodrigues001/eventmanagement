import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get parameters
    const platform = searchParams.get("platform") || "instagram";
    const eventName = searchParams.get("eventName") || "Campus Event";
    const eventDate =
      searchParams.get("eventDate") || new Date().toLocaleDateString();
    const eventLocation = searchParams.get("eventLocation") || "Campus";
    const eventDescription = searchParams.get("eventDescription") || "";
    const logoUrl = searchParams.get("logoUrl") || null;
    const theme = searchParams.get("theme") || "default";

    // Set dimensions based on platform
    let width = 1080;
    let height = 1080;

    if (platform === "twitter") {
      width = 1200;
      height = 675;
    } else if (platform === "linkedin") {
      width = 1200;
      height = 627;
    }

    // Set colors based on theme
    let primaryColor = "#4f46e5"; // Default indigo
    let secondaryColor = "#f0f4ff";
    let textColor = "#1f2937";
    let accentColor = "#8b5cf6";

    if (theme === "dark") {
      primaryColor = "#6366f1";
      secondaryColor = "#1e1b4b";
      textColor = "#f8fafc";
      accentColor = "#a78bfa";
    } else if (theme === "vibrant") {
      primaryColor = "#ec4899";
      secondaryColor = "#fdf2f8";
      textColor = "#831843";
      accentColor = "#f472b6";
    }

    // Create social media post image
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
            backgroundColor: secondaryColor,
            padding: 60,
            position: "relative",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle at 25px 25px, ${primaryColor}15 2%, transparent 0%), radial-gradient(circle at 75px 75px, ${primaryColor}15 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
              zIndex: 1,
            }}
          />

          {/* Content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              zIndex: 2,
              textAlign: "center",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            {/* Border */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                inset: 20,
                border: `4px solid ${primaryColor}`,
                borderRadius: 12,
              }}
            />

            {/* Logo if available */}
            {logoUrl && (
              <div style={{ display: "flex", marginBottom: 30 }}>
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt="Event Logo"
                  width={100}
                  height={100}
                  style={{
                    borderRadius: "50%",
                    border: `3px solid ${primaryColor}`,
                  }}
                />
              </div>
            )}

            {/* Event type tag */}
            <div
              style={{
                backgroundColor: primaryColor,
                color: "white",
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 20,
              }}
            >
              EVENT ANNOUNCEMENT
            </div>

            {/* Event name */}
            <div
              style={{
                display: "flex",
                fontSize: 60,
                color: textColor,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              {eventName}
            </div>

            {/* Event description - truncated */}
            {eventDescription && (
              <div
                style={{
                  fontSize: 24,
                  color: `${textColor}99`,
                  marginBottom: 30,
                  maxWidth: "70%",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {eventDescription.length > 120
                  ? eventDescription.substring(0, 120) + "..."
                  : eventDescription}
              </div>
            )}

            {/* Event details */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 40,
                marginTop: 20,
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
                    fontSize: 20,
                    display: "flex",
                    color: accentColor,
                    fontWeight: "bold",
                    marginBottom: 5,
                  }}
                >
                  DATE
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: textColor,
                  }}
                >
                  {eventDate}
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
                    display: "flex",
                    fontSize: 20,
                    color: accentColor,
                    fontWeight: "bold",
                    marginBottom: 5,
                  }}
                >
                  LOCATION
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: textColor,
                  }}
                >
                  {eventLocation}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error("Error generating social media image:", error);
    return new Response(`Failed to generate image: ${error}`, {
      status: 500,
    });
  }
}
