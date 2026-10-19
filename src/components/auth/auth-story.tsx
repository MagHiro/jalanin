import { JourneyIllustration } from "@/components/graphics/journey-illustration";

/** The same original pathway graphic supports public discovery and sign-in. */
export function AuthStory() {
  return <aside className="learn-auth-story chapters-auth-story">
    <div className="chapters-auth-art" aria-hidden="true"><JourneyIllustration /></div>
    <div className="learn-auth-story-copy">
      <p className="learn-kicker">Begin your next chapter</p>
      <h2>There is more<br />ahead of you.</h2>
      <p>Find an internship that moves you forward.<br />Your journey starts here.</p>
    </div>
  </aside>;
}
