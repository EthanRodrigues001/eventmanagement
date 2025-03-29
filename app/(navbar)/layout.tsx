import Navbarlayout from "@/components/navbar/navbar-layout";

export default function NavbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbarlayout>{children}</Navbarlayout>
    </>
  );
}
