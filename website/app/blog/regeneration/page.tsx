import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegenerationDetail from "@/components/RegenerationDetail";

export const metadata = {
  title: "How regenerating code stays out of your way | FixedCode",
  description:
    "The four mechanisms behind FixedCode's regeneration contract: OpenAPI as precedent, interface plus default implementation, local overrides, and library publication.",
};

export default function RegenerationPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <RegenerationDetail />
      </main>
      <Footer />
    </>
  );
}
