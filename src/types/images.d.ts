/** Make static PNG imports type-safe before Next generates next-env.d.ts in CI. */
declare module "*.png" {
  import type { StaticImageData } from "next/image";
  const image: StaticImageData;
  export default image;
}
