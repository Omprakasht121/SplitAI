import "./globals.css";

export const metadata = {
  title: "Split AI - Voice-Driven Website Builder",
  description: "Build websites by speaking. Transform your ideas into real websites using just your voice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
