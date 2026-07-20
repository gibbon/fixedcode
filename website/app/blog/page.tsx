import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogIndex from "@/components/BlogIndex";

export const metadata = {
  title: "Blog - FixedCode",
  description:
    "Writing on spec-driven generation, regeneration contracts, token min-maxxing, and putting AI on both sides of a deterministic engine.",
};

export default function Blog() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <BlogIndex />
      </main>
      <Footer />
    </>
  );
}
