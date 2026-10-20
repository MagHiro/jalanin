// Additive, local-only fixtures for previewing the internship detail design.
import "./load-env";
import { Client } from "pg";

const listings = [
  {
    slug: "sample-frontend-engineering-kuala-lumpur",
    title: "Frontend Engineering Intern",
    city: "Kuala Lumpur", country: "MY", category: "technology",
    start: "2027-01-11", end: "2027-06-25",
    description: "Fictional sample listing for design preview — this is not a verified vacancy.\n\nJoin a product engineering team building web tools for small businesses across Southeast Asia. You would work alongside frontend engineers, a product designer and a product manager to turn interface designs into accessible, responsive features.\n\nThis sample six-month placement focuses on practical experience with React and TypeScript, from understanding a small product brief to testing and documenting a change before release.",
    responsibilities: "• Build responsive interface components in React and TypeScript from Figma designs.\n• Connect screens to existing APIs and handle loading, empty and error states.\n• Write component tests and help check important user journeys across desktop and mobile.\n• Investigate accessibility issues, including keyboard navigation and form labels.\n• Participate in code reviews, explain your implementation choices and respond to feedback.\n• Document completed work and share progress during team check-ins.",
    requirements: "• Currently studying computer science, software engineering or a related discipline.\n• Comfortable with HTML, CSS and JavaScript, with some exposure to React.\n• Familiarity with Git and an interest in learning TypeScript and automated testing.\n• Able to explain a coursework or personal web project and your contribution to it.\n• Comfortable asking questions and communicating progress in English.\n• Available for the listed placement period. Previous professional experience is not required for this sample role.",
  },
  {
    slug: "sample-product-design-singapore",
    title: "Product Design Intern",
    city: "Singapore", country: "SG", category: "creative",
    start: "2027-02-01", end: "2027-07-30",
    description: "Fictional sample listing for design preview — this is not a verified vacancy.\n\nExplore how research, interaction design and visual design come together in a digital product team. In this sample placement, you would support improvements to an online booking experience, working with a designer and engineers from early sketches through implementation review.\n\nThe role is suited to a student who enjoys understanding user problems, trying different solutions and explaining the thinking behind a design, rather than only producing polished screens.",
    responsibilities: "• Review existing booking flows and identify confusing steps or inconsistent interface patterns.\n• Help prepare interview questions and organise notes from supervised user research.\n• Create user flows, wireframes and interactive Figma prototypes.\n• Explore responsive layouts and accessible interaction states.\n• Update reusable components and document their intended use.\n• Present design alternatives and review implemented screens with engineers.",
    requirements: "• Studying interaction design, communication design, human-computer interaction or a related subject.\n• A small portfolio with two or three projects showing your process; coursework is welcome.\n• Working knowledge of Figma, including auto layout and reusable components.\n• Basic understanding of typography, spacing, hierarchy and accessibility.\n• Willingness to revise work based on research and feedback.\n• Available for the full placement period and able to communicate design decisions clearly.",
  },
  {
    slug: "sample-guest-experience-bangkok",
    title: "Guest Experience & Front Office Intern",
    city: "Bangkok", country: "TH", category: "hospitality",
    start: "2027-01-18", end: "2027-07-16",
    description: "Fictional sample listing for design preview — this is not a verified vacancy.\n\nGet a practical introduction to the daily work of a hotel front-office team. This sample placement follows the guest journey from arrival to departure, with supervised exposure to reception, guest enquiries and coordination with housekeeping.\n\nYou would learn how teams maintain accurate records, communicate handovers and respond thoughtfully when a guest needs help. Tasks would be assigned according to training and supervisor guidance.",
    responsibilities: "• Welcome guests and assist with arrival preparation under supervision.\n• Help check reservation details and prepare information for the reception team.\n• Respond to routine guest enquiries and refer complex requests to a supervisor.\n• Coordinate room-readiness updates with housekeeping and front-office colleagues.\n• Maintain clear shift-handover notes while following guest-data confidentiality procedures.\n• Observe service-recovery conversations and discuss learning points with your supervisor.",
    requirements: "• Enrolled in hospitality management, tourism, business or a related programme.\n• Clear spoken and written English; additional language skills are welcome.\n• A considerate service mindset and attention to detail.\n• Comfortable working with colleagues from different backgrounds.\n• Willingness to learn hotel systems and follow guest-privacy procedures.\n• Able to discuss availability for scheduled shifts during the listed placement period. Any university placement requirements should be confirmed during application review.",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set DATABASE_URL. See .env.example.");
  const host = new URL(connectionString).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("Sample internships can only be seeded into a local development database.");
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const listing of listings) {
      const category = await client.query<{ id: string }>("SELECT id FROM categories WHERE slug = $1", [listing.category]);
      if (!category.rows[0]) throw new Error(`Missing category ${listing.category}. Run pnpm db:seed first.`);
      await client.query(`INSERT INTO internships
        (slug, title, city, country_code, category_id, start_date, end_date,
         description, responsibilities, requirements, publication_status, featured, published_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Published',FALSE,now())
        ON CONFLICT (slug) DO NOTHING`,
      [listing.slug, listing.title, listing.city, listing.country, category.rows[0].id,
        listing.start, listing.end, listing.description, listing.responsibilities, listing.requirements]);
    }
    await client.query("COMMIT");
    console.log("Sample internships ready (existing listings preserved):");
    for (const listing of listings) console.log(`/opportunities/${listing.slug}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
