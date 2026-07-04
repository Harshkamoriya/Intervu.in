export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;

  // return (
  //   <html lang="en">
  //     <head>
  //       {/* LiveKit ke official styles bina Webpack error ke load karne ke liye */}
  //       <link
  //         rel="stylesheet"
  //         href="https://cdnjs.cloudflare.com/ajax/libs/livekit-components-react/1.5.0/index.min.css"
  //       />
  //     </head>
  //     <body>{children}</body>
  //   </html>
  // );
}
