import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TokenMinMaxxingDetail from "@/components/TokenMinMaxxingDetail";

export const metadata = {
  title: "Token Min-Maxxing - FixedCode",
  description:
    "Minimise tokens spent on deterministic code, maximise the tokens that buy judgment. Measured with FixedCode's spec-driven generation: 600 tokens of spec instead of 8,000 tokens of code.",
};

export default function TokenMinMaxxing() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <TokenMinMaxxingDetail />
      </main>
      <Footer />
    </>
  );
}
