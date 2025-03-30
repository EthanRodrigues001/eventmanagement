// import Navbarlayout from "@/components/navbar/navbar-layout";

import Navbar from "@/components/navbar";

export default function NavbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <Navbarlayout> */}
      <Navbar />
      {children}
      {/* </Navbarlayout> */}
    </>
  );
}
