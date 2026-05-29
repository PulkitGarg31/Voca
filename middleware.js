export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/statistics", "/words", "/practice", "/chat", "/settings"],
};
