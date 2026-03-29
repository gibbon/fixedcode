import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingPage from "@/components/PricingPage";

export const metadata = {
  title: "Pricing - FixedCode",
  description: "From free open-source to enterprise. Same product at every scale.",
};

export default function Pricing() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <PricingPage />
      </main>
      <Footer />
    </>
  );
}
