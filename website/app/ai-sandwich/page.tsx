import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AISandwichDetail from "@/components/AISandwichDetail";

export const metadata = {
  title: "The AI Sandwich — FixedCode",
  description:
    "AI is good at writing code. It is not good at writing the same code twice. An essay on putting deterministic generation between two layers of AI.",
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
