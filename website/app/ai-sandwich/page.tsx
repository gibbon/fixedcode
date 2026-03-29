import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AISandwichDetail from "@/components/AISandwichDetail";

export const metadata = {
  title: "The AI Sandwich - FixedCode",
  description:
    "How AI and deterministic generation work together. AI creates the patterns, FixedCode locks them in, AI enriches the output.",
};

export default function AISandwichPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <AISandwichDetail />
      </main>
      <Footer />
    </>
  );
}
