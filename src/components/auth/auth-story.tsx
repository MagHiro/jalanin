import Image from "next/image";

export function AuthStory() {
  return <aside className="learn-auth-story"><Image src="/images/work-together.jpg" alt="People working together around a table with laptops" fill sizes="(min-width: 768px) 540px, 100vw" className="object-cover" /><div className="learn-auth-story-copy"><p className="learn-kicker">Your next chapter</p><h2>A world of possibilities.<br />A place to begin.</h2><p>Real-world experience. Personal guidance.<br />Your journey starts with a little curiosity.</p></div></aside>;
}
